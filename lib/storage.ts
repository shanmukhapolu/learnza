import { FIREBASE_PROJECT_ID } from "@/lib/firebase-config";
import { refreshIdToken } from "@/lib/firebase-auth-rest";

// Firestore REST base
const FS = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

// ---------------------------------------------------------------------------
// Simple pub/sub for cross-component reactivity (e.g. sidebar ↔ courses page)
// ---------------------------------------------------------------------------
type StorageEventType = "addedCourses";
const listeners: Record<string, Array<() => void>> = {};

export const storageEvents = {
  on(event: StorageEventType, cb: () => void) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
  },
  off(event: StorageEventType, cb: () => void) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((l) => l !== cb);
  },
  emit(event: StorageEventType) {
    (listeners[event] ?? []).forEach((cb) => cb());
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  category: "Cell Biology & Genetics" | "Human Physiology" | "Human Disease";
  difficulty: "Easy" | "Medium" | "Hard";
  explanation: string;
  tag?: string;
}

export type SessionType = "practice" | "timed";

export interface QuestionAttempt {
  questionId: number;
  questionIndex: number;
  category: string;
  difficulty: string;
  isCorrect: boolean;
  thinkTime: number;
  explanationTime: number;
  timestampStart: string;
  timestampSubmit: string;
  isRedemption?: boolean;
  eventId: string;
  correct?: boolean;
  timeSpent?: number;
  timestamp?: string;
}

export interface SessionData {
  sessionId: string;
  sessionType: SessionType;
  event: string;
  startTimestamp: string;
  endTimestamp?: string;
  totalThinkTime: number;
  totalExplanationTime: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  attempts: QuestionAttempt[];
  startTime?: string;
  endTime?: string;
  eventId?: string;
}

export interface UserStats {
  totalAttempts: number;
  correctAnswers: number;
  averageTime: number;
  categoryStats: {
    [category: string]: {
      attempts: number;
      correct: number;
      averageTime: number;
    };
  };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
type StoredAuthSession = {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt?: number;
  user: { uid: string; email?: string; displayName?: string };
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveUidFromToken(idToken: string): string {
  const payload = decodeJwtPayload(idToken);
  const uid = (payload?.user_id || payload?.sub) as string | undefined;
  return typeof uid === "string" ? uid : "";
}

function readStoredAuth(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("learnza_auth_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    return null;
  }
}

async function getStoredAuth(options?: { forceRefresh?: boolean }): Promise<StoredAuthSession | null> {
  let session = readStoredAuth();
  if (!session) return null;

  // Resolve missing uid from token
  if ((!session.user?.uid || session.user.uid.length === 0) && session.idToken) {
    const decodedUid = resolveUidFromToken(session.idToken);
    if (decodedUid) {
      session = { ...session, user: { ...session.user, uid: decodedUid } };
      localStorage.setItem("learnza_auth_session", JSON.stringify(session));
    }
  }

  const expiresAt = session.expiresAt ?? 0;
  const missingUid = !session.user?.uid || session.user.uid.length === 0;
  const shouldRefresh =
    Boolean(session.refreshToken) &&
    (missingUid || options?.forceRefresh || (expiresAt > 0 && expiresAt <= Date.now() + 30_000));

  if (shouldRefresh) {
    try {
      const refreshed = await refreshIdToken(session.refreshToken);
      session = {
        ...session,
        idToken: refreshed.idToken,
        refreshToken: refreshed.refreshToken,
        expiresIn: refreshed.expiresIn,
        expiresAt: Date.now() + refreshed.expiresIn * 1000,
        user: {
          ...session.user,
          uid: refreshed.uid || session.user.uid || resolveUidFromToken(refreshed.idToken),
        },
      };
      localStorage.setItem("learnza_auth_session", JSON.stringify(session));
    } catch {
      return session;
    }
  }

  return session;
}

async function getAuth(options?: { forceRefresh?: boolean }) {
  const auth = await getStoredAuth(options);
  if (!auth?.user?.uid || !auth?.idToken) throw new Error("Not authenticated");
  return { uid: auth.user.uid, idToken: auth.idToken };
}

type SchemaMode = "users" | "organizations";
let schemaMode: SchemaMode = "users";

function userRoot(uid: string) {
  return `users/${uid}`;
}

function orgRoot(uid: string) {
  return `organizations/${uid}`;
}

function preferencesDoc(uid: string) {
  return schemaMode === "users" ? `${userRoot(uid)}/preferences/app` : `${orgRoot(uid)}/preferences/app`;
}

function eventDoc(uid: string, eventId: string) {
  return schemaMode === "users" ? `${userRoot(uid)}/events/${eventId}` : `${orgRoot(uid)}/events/${eventId}`;
}

function sessionDoc(uid: string, eventId: string, sessionId: string) {
  return `${eventDoc(uid, eventId)}/sessions/${sessionId}`;
}

async function ensureUserBootstrap(uid: string) {
  try {
    schemaMode = "users";
    const user = await fsGet(userRoot(uid));
    if (!user) {
      await fsPatch(userRoot(uid), {
        uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const preferences = await fsGet(preferencesDoc(uid));
    if (!preferences) {
      await fsPatch(preferencesDoc(uid), {
        addedCourses: [],
        currentSession: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return;
  } catch {
    // Fallback for environments still running org-scoped rules.
    schemaMode = "organizations";
  }

  await fsPatch(`${orgRoot(uid)}/members/${uid}`, {
    uid,
    role: "owner",
    status: "active",
    joinedAt: new Date().toISOString(),
  });

  const preferences = await fsGet(preferencesDoc(uid));
  if (!preferences) {
    await fsPatch(preferencesDoc(uid), {
      addedCourses: [],
      currentSession: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// ---------------------------------------------------------------------------
// Firestore value converters
// ---------------------------------------------------------------------------
function fromFsValue(v: any): any {
  if (v === null || v === undefined) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue !== undefined) return (v.arrayValue.values ?? []).map(fromFsValue);
  if (v.mapValue !== undefined) {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields ?? {})) out[k] = fromFsValue(val);
    return out;
  }
  return v;
}

function toFsValue(v: any): any {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFsValue) } };
  if (typeof v === "object") {
    const fields: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) fields[k] = toFsValue(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function fromFsDoc(doc: any): Record<string, any> | null {
  if (!doc?.fields) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields)) out[k] = fromFsValue(v);
  return out;
}

// ---------------------------------------------------------------------------
// Low-level REST helpers
// ---------------------------------------------------------------------------

/** GET a single Firestore document. Returns null if not found. */
async function fsGet(docPath: string): Promise<Record<string, any> | null> {
  let auth = await getAuth();
  // Use access_token query param instead of Bearer header (Firebase ID tokens work this way)
  let res = await fetch(`${FS}/${docPath}?access_token=${encodeURIComponent(auth.idToken)}`);
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(`${FS}/${docPath}?access_token=${encodeURIComponent(auth.idToken)}`);
  }
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return fromFsDoc(await res.json());
}

/** PATCH (create/update) a Firestore document with explicit field mask. */
async function fsPatch(docPath: string, data: Record<string, any>): Promise<void> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFsValue(v);

  const body = JSON.stringify({ fields });

  let auth = await getAuth();
  // Build URL with access_token and field masks
  const buildUrl = (token: string) => {
    const url = new URL(`${FS}/${docPath}`);
    url.searchParams.set("access_token", token);
    for (const f of Object.keys(fields)) {
      url.searchParams.append("updateMask.fieldPaths", f);
    }
    return url.toString();
  };

  let res = await fetch(buildUrl(auth.idToken), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(buildUrl(auth.idToken), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firestore PATCH ${docPath} failed: ${res.status} ${text}`);
  }
}

/** List documents in a Firestore collection. Returns array of plain objects. */
async function fsList(collectionPath: string): Promise<Array<Record<string, any>>> {
  let auth = await getAuth();
  // Use access_token query param instead of Bearer header
  let res = await fetch(`${FS}/${collectionPath}?access_token=${encodeURIComponent(auth.idToken)}`);
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(`${FS}/${collectionPath}?access_token=${encodeURIComponent(auth.idToken)}`);
  }
  if (!res.ok) return [];
  const json = await res.json();
  if (!json?.documents) return [];
  return (json.documents as any[]).map((d) => {
    const obj = fromFsDoc(d) ?? {};
    // Attach the document name (last segment = document ID)
    obj.__id = (d.name as string).split("/").pop() ?? "";
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------
function createDeterministicSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeAttempt(attempt: Partial<QuestionAttempt>, index: number, eventFallback = "unknown"): QuestionAttempt {
  const isCorrect = attempt.isCorrect ?? attempt.correct ?? false;
  const thinkTime = attempt.thinkTime ?? attempt.timeSpent ?? 0;
  return {
    questionId: attempt.questionId ?? -1,
    questionIndex: attempt.questionIndex ?? index + 1,
    category: attempt.category ?? "Unknown",
    difficulty: attempt.difficulty ?? "Unknown",
    isCorrect,
    thinkTime,
    explanationTime: attempt.explanationTime ?? 0,
    timestampStart: attempt.timestampStart ?? attempt.timestamp ?? new Date().toISOString(),
    timestampSubmit: attempt.timestampSubmit ?? attempt.timestamp ?? new Date().toISOString(),
    isRedemption: attempt.isRedemption,
    eventId: attempt.eventId ?? eventFallback,
    correct: isCorrect,
    timeSpent: thinkTime,
    timestamp: attempt.timestampSubmit ?? attempt.timestamp,
  };
}

function normalizeSession(session: Partial<SessionData>): SessionData {
  const event = session.event ?? session.eventId ?? "unknown";

  // Deserialize attempts (they are stored as a JSON string in Firestore to avoid nested array limits)
  let rawAttempts: Partial<QuestionAttempt>[] = [];
  if (typeof (session as any).attempts === "string") {
    try { rawAttempts = JSON.parse((session as any).attempts); } catch { rawAttempts = []; }
  } else if (Array.isArray(session.attempts)) {
    rawAttempts = session.attempts;
  }

  const attempts = rawAttempts.map((a, i) => normalizeAttempt(a, i, event));
  const correctCount = attempts.filter((a) => a.isCorrect).length;

  return {
    sessionId: session.sessionId ?? createDeterministicSessionId(),
    sessionType: session.sessionType ?? "practice",
    event,
    startTimestamp: session.startTimestamp ?? session.startTime ?? new Date().toISOString(),
    endTimestamp: session.endTimestamp ?? session.endTime,
    totalThinkTime: session.totalThinkTime ?? attempts.reduce((s, a) => s + a.thinkTime, 0),
    totalExplanationTime: session.totalExplanationTime ?? attempts.reduce((s, a) => s + a.explanationTime, 0),
    totalQuestions: session.totalQuestions ?? attempts.length,
    correctCount: session.correctCount ?? correctCount,
    accuracy: session.accuracy ?? (attempts.length > 0 ? (correctCount / attempts.length) * 100 : 0),
    attempts,
    startTime: session.startTimestamp ?? session.startTime,
    endTime: session.endTimestamp ?? session.endTime,
    eventId: event,
  };
}

// ---------------------------------------------------------------------------
// Public storage API
// ---------------------------------------------------------------------------
export const storage = {
  createSession(event: string, sessionType: SessionType = "practice"): SessionData {
    return {
      sessionId: createDeterministicSessionId(),
      sessionType,
      event,
      startTimestamp: new Date().toISOString(),
      totalThinkTime: 0,
      totalExplanationTime: 0,
      totalQuestions: 0,
      correctCount: 0,
      accuracy: 0,
      attempts: [],
      eventId: event,
    };
  },

  // ---- Sessions ----

  async getAllSessions(): Promise<SessionData[]> {
    if (typeof window === "undefined") return [];
    try {
      const { uid } = await getAuth();
      // List all event documents under users/{uid}/events
      await ensureUserBootstrap(uid);
      const events = await fsList(schemaMode === "users" ? `${userRoot(uid)}/events` : `${orgRoot(uid)}/events`);
      const allSessions: SessionData[] = [];

      for (const event of events) {
        const eventId = event.__id as string;
        // List all session documents under users/{uid}/events/{eventId}/sessions
        const sessionDocs = await fsList(`${eventDoc(uid, eventId)}/sessions`);
        for (const doc of sessionDocs) {
          allSessions.push(normalizeSession({ ...doc, event: doc.event ?? eventId }));
        }
      }

      return allSessions;
    } catch {
      return [];
    }
  },

  async saveSession(session: SessionData): Promise<void> {
    const { uid } = await getAuth();
    const normalized = normalizeSession({
      ...session,
      endTimestamp: session.endTimestamp ?? new Date().toISOString(),
    });

    // Ensure the event document exists (create with minimal fields if needed)
    await ensureUserBootstrap(uid);
    await fsPatch(eventDoc(uid, normalized.event), { eventId: normalized.event, updatedAt: new Date().toISOString() });

    // Save session document — store attempts as JSON string to avoid Firestore array nesting limits
    await fsPatch(sessionDoc(uid, normalized.event, normalized.sessionId), {
      sessionId: normalized.sessionId,
      sessionType: normalized.sessionType,
      event: normalized.event,
      startTimestamp: normalized.startTimestamp,
      endTimestamp: normalized.endTimestamp ?? "",
      totalThinkTime: normalized.totalThinkTime,
      totalExplanationTime: normalized.totalExplanationTime,
      totalQuestions: normalized.totalQuestions,
      correctCount: normalized.correctCount,
      accuracy: normalized.accuracy,
      attempts: JSON.stringify(normalized.attempts),
    });
  },

  async setCurrentSession(session: SessionData): Promise<void> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      await fsPatch(preferencesDoc(uid), {
        currentSession: JSON.stringify(normalizeSession(session)),
      });
    } catch {
      // non-critical
    }
  },

  async getCurrentSession(): Promise<SessionData | null> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const doc = await fsGet(preferencesDoc(uid));
      if (!doc?.currentSession) return null;
      const parsed = typeof doc.currentSession === "string" ? JSON.parse(doc.currentSession) : doc.currentSession;
      return normalizeSession(parsed);
    } catch {
      return null;
    }
  },

  async clearCurrentSession(): Promise<void> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      await fsPatch(preferencesDoc(uid), { currentSession: "" });
    } catch {
      // non-critical
    }
  },

  // ---- Wrong / Completed questions (stored as fields on the event doc) ----

  async getWrongQuestions(eventId: string): Promise<number[]> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const doc = await fsGet(eventDoc(uid, eventId));
      const raw = doc?.wrongQuestions;
      if (Array.isArray(raw)) return raw.map(Number);
      return [];
    } catch {
      return [];
    }
  },

  async addWrongQuestion(eventId: string, questionId: number): Promise<void> {
    try {
      const { uid } = await getAuth();
      const existing = await storage.getWrongQuestions(eventId);
      if (!existing.includes(questionId)) {
        await ensureUserBootstrap(uid);
        await fsPatch(eventDoc(uid, eventId), {
          eventId,
          wrongQuestions: [...existing, questionId],
        });
      }
    } catch (error) {
      console.warn("Unable to persist wrong question", error);
    }
  },

  async removeWrongQuestion(eventId: string, questionId: number): Promise<void> {
    try {
      const { uid } = await getAuth();
      const existing = await storage.getWrongQuestions(eventId);
      await ensureUserBootstrap(uid);
      await fsPatch(eventDoc(uid, eventId), {
        eventId,
        wrongQuestions: existing.filter((id) => id !== questionId),
      });
    } catch (error) {
      console.warn("Unable to remove wrong question", error);
    }
  },

  async getCompletedQuestions(eventId: string): Promise<number[]> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const doc = await fsGet(eventDoc(uid, eventId));
      const raw = doc?.completedQuestions;
      if (Array.isArray(raw)) return raw.map(Number);
      return [];
    } catch {
      return [];
    }
  },

  async addCompletedQuestion(eventId: string, questionId: number): Promise<void> {
    try {
      const { uid } = await getAuth();
      const existing = await storage.getCompletedQuestions(eventId);
      if (!existing.includes(questionId)) {
        await ensureUserBootstrap(uid);
        await fsPatch(eventDoc(uid, eventId), {
          eventId,
          completedQuestions: [...existing, questionId],
        });
      }
    } catch (error) {
      console.warn("Unable to persist completed question", error);
    }
  },

  // ---- Stats ----

  async getPracticedEvents(): Promise<string[]> {
    const sessions = await storage.getAllSessions();
    return Array.from(new Set(sessions.map((s) => s.event)));
  },

  async calculateStats(): Promise<UserStats> {
    const sessions = await storage.getAllSessions();
    return computeStats(sessions.flatMap((s) => s.attempts));
  },

  async calculateEventStats(eventId: string): Promise<UserStats> {
    const sessions = await storage.getAllSessions();
    const attempts = sessions.flatMap((s) => s.attempts).filter((a) => a.eventId === eventId);
    return computeStats(attempts);
  },

  // ---- Added courses (sidebar) — stored in user preferences ----

  async getAddedCourses(): Promise<string[]> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const doc = await fsGet(preferencesDoc(uid));
      const raw = doc?.addedCourses;
      if (Array.isArray(raw)) return raw.map(String);
      return [];
    } catch {
      return [];
    }
  },

  async addCourse(courseId: string): Promise<void> {
    const { uid } = await getAuth();
    const current = await storage.getAddedCourses();
    if (!current.includes(courseId)) {
      await ensureUserBootstrap(uid);
      await fsPatch(preferencesDoc(uid), { addedCourses: [...current, courseId] });
      storageEvents.emit("addedCourses");
    }
  },

  async removeCourse(courseId: string): Promise<void> {
    const { uid } = await getAuth();
    const current = await storage.getAddedCourses();
    await ensureUserBootstrap(uid);
    await fsPatch(preferencesDoc(uid), { addedCourses: current.filter((id) => id !== courseId) });
    storageEvents.emit("addedCourses");
  },

  // ---- Reset ----

  async resetAllData(): Promise<void> {
    const { uid } = await getAuth();
    // Clear user-level fields
    await ensureUserBootstrap(uid);
    await fsPatch(preferencesDoc(uid), { addedCourses: [], currentSession: "" });
    // Note: deleting subcollections via REST requires listing + deleting each doc.
    // For simplicity we just clear top-level state; session docs remain but won't affect new sessions.
  },
};

// ---------------------------------------------------------------------------
// Internal stats helper
// ---------------------------------------------------------------------------
function computeStats(attempts: QuestionAttempt[]): UserStats {
  const categoryStats: UserStats["categoryStats"] = {};
  for (const a of attempts) {
    if (!categoryStats[a.category]) categoryStats[a.category] = { attempts: 0, correct: 0, averageTime: 0 };
    categoryStats[a.category].attempts++;
    if (a.isCorrect) categoryStats[a.category].correct++;
  }
  for (const cat of Object.keys(categoryStats)) {
    const catAttempts = attempts.filter((a) => a.category === cat);
    categoryStats[cat].averageTime = catAttempts.length
      ? catAttempts.reduce((s, a) => s + a.thinkTime, 0) / catAttempts.length
      : 0;
  }
  const totalCorrect = attempts.filter((a) => a.isCorrect).length;
  const totalTime = attempts.reduce((s, a) => s + a.thinkTime, 0);
  return {
    totalAttempts: attempts.length,
    correctAnswers: totalCorrect,
    averageTime: attempts.length ? totalTime / attempts.length : 0,
    categoryStats,
  };
}
