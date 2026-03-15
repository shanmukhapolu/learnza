import { FIREBASE_DATABASE_URL } from "@/lib/firebase-config";
import { refreshIdToken } from "@/lib/firebase-auth-rest";

// ---------------------------------------------------------------------------
// Firebase Realtime Database REST API
// 
// Database Schema:
// /users/{uid}/
//     profile/           - User profile info (name, email, etc.)
//     preferences/       - User preferences (addedCourses, settings)
//     sessions/{id}      - Practice session data
//     progress/{eventId} - Progress data per course (wrong questions, completed)
// ---------------------------------------------------------------------------

const RTDB = FIREBASE_DATABASE_URL;

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

// ---------------------------------------------------------------------------
// Firebase Realtime Database REST helpers
// ---------------------------------------------------------------------------

/** GET data from a path. Returns null if not found. */
async function rtdbGet<T>(path: string): Promise<T | null> {
  let auth = await getAuth();
  let res = await fetch(`${RTDB}/${path}.json?auth=${encodeURIComponent(auth.idToken)}`);
  
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(`${RTDB}/${path}.json?auth=${encodeURIComponent(auth.idToken)}`);
  }
  
  if (!res.ok) return null;
  const data = await res.json();
  return data as T;
}

/** PUT data to a path (overwrites). */
async function rtdbPut(path: string, data: unknown): Promise<void> {
  let auth = await getAuth();
  let res = await fetch(`${RTDB}/${path}.json?auth=${encodeURIComponent(auth.idToken)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(`${RTDB}/${path}.json?auth=${encodeURIComponent(auth.idToken)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RTDB PUT ${path} failed: ${res.status} ${text}`);
  }
}

/** PATCH data to a path (merges). */
async function rtdbPatch(path: string, data: Record<string, unknown>): Promise<void> {
  let auth = await getAuth();
  let res = await fetch(`${RTDB}/${path}.json?auth=${encodeURIComponent(auth.idToken)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(`${RTDB}/${path}.json?auth=${encodeURIComponent(auth.idToken)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RTDB PATCH ${path} failed: ${res.status} ${text}`);
  }
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

  let rawAttempts: Partial<QuestionAttempt>[] = [];
  if (typeof (session as any).attempts === "string") {
    try { rawAttempts = JSON.parse((session as any).attempts); } catch { rawAttempts = []; }
  } else if (Array.isArray(session.attempts)) {
    rawAttempts = session.attempts;
  } else if (session.attempts && typeof session.attempts === "object") {
    // RTDB converts arrays to objects with numeric keys
    rawAttempts = Object.values(session.attempts);
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

function computeStats(attempts: QuestionAttempt[]): UserStats {
  const categoryStats: UserStats["categoryStats"] = {};
  let totalTime = 0;
  let correctAnswers = 0;

  for (const attempt of attempts) {
    totalTime += attempt.thinkTime;
    if (attempt.isCorrect) correctAnswers++;

    if (!categoryStats[attempt.category]) {
      categoryStats[attempt.category] = { attempts: 0, correct: 0, averageTime: 0 };
    }
    categoryStats[attempt.category].attempts++;
    if (attempt.isCorrect) categoryStats[attempt.category].correct++;
    categoryStats[attempt.category].averageTime += attempt.thinkTime;
  }

  for (const cat of Object.keys(categoryStats)) {
    if (categoryStats[cat].attempts > 0) {
      categoryStats[cat].averageTime /= categoryStats[cat].attempts;
    }
  }

  return {
    totalAttempts: attempts.length,
    correctAnswers,
    averageTime: attempts.length > 0 ? totalTime / attempts.length : 0,
    categoryStats,
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

  // ---- Sessions (stored at /users/{uid}/sessions/{sessionId}) ----

  async getAllSessions(): Promise<SessionData[]> {
    if (typeof window === "undefined") return [];
    try {
      const { uid } = await getAuth();
      const data = await rtdbGet<Record<string, any>>(`users/${uid}/sessions`);
      if (!data) return [];
      
      return Object.entries(data).map(([id, session]) => 
        normalizeSession({ ...session, sessionId: id })
      );
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

    // Save session
    await rtdbPut(`users/${uid}/sessions/${normalized.sessionId}`, {
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
      attempts: normalized.attempts,
    });
  },

  async setCurrentSession(session: SessionData): Promise<void> {
    try {
      const { uid } = await getAuth();
      await rtdbPut(`users/${uid}/currentSession`, normalizeSession(session));
    } catch {
      // non-critical
    }
  },

  async getCurrentSession(): Promise<SessionData | null> {
    try {
      const { uid } = await getAuth();
      const data = await rtdbGet<any>(`users/${uid}/currentSession`);
      if (!data) return null;
      return normalizeSession(data);
    } catch {
      return null;
    }
  },

  async clearCurrentSession(): Promise<void> {
    try {
      const { uid } = await getAuth();
      await rtdbPut(`users/${uid}/currentSession`, null);
    } catch {
      // non-critical
    }
  },

  // ---- Progress data (stored at /users/{uid}/progress/{eventId}) ----

  async getWrongQuestions(eventId: string): Promise<number[]> {
    try {
      const { uid } = await getAuth();
      const data = await rtdbGet<number[]>(`users/${uid}/progress/${eventId}/wrongQuestions`);
      if (Array.isArray(data)) return data.map(Number);
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
        await rtdbPut(`users/${uid}/progress/${eventId}/wrongQuestions`, [...existing, questionId]);
      }
    } catch (error) {
      console.warn("Unable to persist wrong question", error);
    }
  },

  async removeWrongQuestion(eventId: string, questionId: number): Promise<void> {
    try {
      const { uid } = await getAuth();
      const existing = await storage.getWrongQuestions(eventId);
      await rtdbPut(`users/${uid}/progress/${eventId}/wrongQuestions`, existing.filter((id) => id !== questionId));
    } catch (error) {
      console.warn("Unable to remove wrong question", error);
    }
  },

  async getCompletedQuestions(eventId: string): Promise<number[]> {
    try {
      const { uid } = await getAuth();
      const data = await rtdbGet<number[]>(`users/${uid}/progress/${eventId}/completedQuestions`);
      if (Array.isArray(data)) return data.map(Number);
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
        await rtdbPut(`users/${uid}/progress/${eventId}/completedQuestions`, [...existing, questionId]);
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

  // ---- Preferences (stored at /users/{uid}/preferences/) ----

  async getAddedCourses(): Promise<string[]> {
    try {
      const { uid } = await getAuth();
      const data = await rtdbGet<string[]>(`users/${uid}/preferences/addedCourses`);
      if (Array.isArray(data)) return data.map(String);
      return [];
    } catch {
      return [];
    }
  },

  async addCourse(courseId: string): Promise<void> {
    const { uid } = await getAuth();
    const current = await storage.getAddedCourses();
    if (!current.includes(courseId)) {
      await rtdbPut(`users/${uid}/preferences/addedCourses`, [...current, courseId]);
      storageEvents.emit("addedCourses");
    }
  },

  async removeCourse(courseId: string): Promise<void> {
    const { uid } = await getAuth();
    const current = await storage.getAddedCourses();
    await rtdbPut(`users/${uid}/preferences/addedCourses`, current.filter((id) => id !== courseId));
    storageEvents.emit("addedCourses");
  },

  // ---- Profile (stored at /users/{uid}/profile/) ----

  async saveProfile(profile: { firstName: string; lastName: string }): Promise<void> {
    const { uid } = await getAuth();
    await rtdbPatch(`users/${uid}/profile`, {
      firstName: profile.firstName,
      lastName: profile.lastName,
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      updatedAt: new Date().toISOString(),
    });
  },

  async getProfile(): Promise<{ firstName: string; lastName: string } | null> {
    try {
      const { uid } = await getAuth();
      const data = await rtdbGet<any>(`users/${uid}/profile`);
      if (!data) return null;
      
      if (data.firstName || data.lastName) {
        return { firstName: data.firstName || "", lastName: data.lastName || "" };
      }
      
      if (data.name) {
        const [firstName = "", ...rest] = data.name.trim().split(/\s+/);
        return { firstName, lastName: rest.join(" ") };
      }
      
      return null;
    } catch {
      return null;
    }
  },

  // ---- Reset ----

  async resetAllData(): Promise<void> {
    const { uid } = await getAuth();
    await rtdbPut(`users/${uid}/sessions`, null);
    await rtdbPut(`users/${uid}/progress`, null);
    await rtdbPut(`users/${uid}/currentSession`, null);
  },
};
