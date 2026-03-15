import { FIREBASE_DATABASE_URL } from "@/lib/firebase-config";
import { refreshIdToken } from "@/lib/firebase-auth-rest";

const DB = FIREBASE_DATABASE_URL.replace(/\/$/, "");

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

function dbUrl(path: string, token: string) {
  return `${DB}/${path}.json?auth=${encodeURIComponent(token)}`;
}

async function dbGet(path: string): Promise<any> {
  let auth = await getAuth();
  let res = await fetch(dbUrl(path, auth.idToken));
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(dbUrl(path, auth.idToken));
  }
  if (!res.ok) return null;
  return res.json();
}

async function dbPatch(path: string, data: Record<string, any>): Promise<void> {
  let auth = await getAuth();
  const body = JSON.stringify(data);
  let res = await fetch(dbUrl(path, auth.idToken), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (res.status === 401 || res.status === 403) {
    auth = await getAuth({ forceRefresh: true });
    res = await fetch(dbUrl(path, auth.idToken), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Realtime DB PATCH ${path} failed: ${res.status} ${text}`);
  }
}

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
    try {
      rawAttempts = JSON.parse((session as any).attempts);
    } catch {
      rawAttempts = [];
    }
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

async function ensureUserBootstrap(uid: string) {
  const user = await dbGet(`users/${uid}`);
  if (!user) {
    await dbPatch(`users/${uid}`, {
      uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const prefs = await dbGet(`users/${uid}/preferences/app`);
  if (!prefs) {
    await dbPatch(`users/${uid}/preferences/app`, {
      addedCourses: [],
      currentSession: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

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

  async getAllSessions(): Promise<SessionData[]> {
    if (typeof window === "undefined") return [];
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const events = (await dbGet(`users/${uid}/events`)) ?? {};
      const allSessions: SessionData[] = [];

      for (const [eventId, eventData] of Object.entries(events as Record<string, any>)) {
        const sessions = (eventData as any)?.sessions ?? {};
        for (const doc of Object.values(sessions as Record<string, any>)) {
          allSessions.push(normalizeSession({ ...(doc as any), event: (doc as any)?.event ?? eventId }));
        }
      }
      return allSessions;
    } catch {
      return [];
    }
  },

  async saveSession(session: SessionData): Promise<void> {
    const { uid } = await getAuth();
    await ensureUserBootstrap(uid);
    const normalized = normalizeSession({ ...session, endTimestamp: session.endTimestamp ?? new Date().toISOString() });

    await dbPatch(`users/${uid}/events/${normalized.event}`, {
      eventId: normalized.event,
      updatedAt: new Date().toISOString(),
    });

    await dbPatch(`users/${uid}/events/${normalized.event}/sessions/${normalized.sessionId}`, {
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
      await dbPatch(`users/${uid}/preferences/app`, { currentSession: JSON.stringify(normalizeSession(session)) });
    } catch {}
  },

  async getCurrentSession(): Promise<SessionData | null> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const doc = await dbGet(`users/${uid}/preferences/app`);
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
      await dbPatch(`users/${uid}/preferences/app`, { currentSession: "" });
    } catch {}
  },

  async getWrongQuestions(eventId: string): Promise<number[]> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const raw = (await dbGet(`users/${uid}/events/${eventId}/wrongQuestions`)) ?? [];
      return Array.isArray(raw) ? raw.map(Number) : [];
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
        await dbPatch(`users/${uid}/events/${eventId}`, { eventId, wrongQuestions: [...existing, questionId] });
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
      await dbPatch(`users/${uid}/events/${eventId}`, { eventId, wrongQuestions: existing.filter((id) => id !== questionId) });
    } catch (error) {
      console.warn("Unable to remove wrong question", error);
    }
  },

  async getCompletedQuestions(eventId: string): Promise<number[]> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const raw = (await dbGet(`users/${uid}/events/${eventId}/completedQuestions`)) ?? [];
      return Array.isArray(raw) ? raw.map(Number) : [];
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
        await dbPatch(`users/${uid}/events/${eventId}`, { eventId, completedQuestions: [...existing, questionId] });
      }
    } catch (error) {
      console.warn("Unable to persist completed question", error);
    }
  },

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

  async getAddedCourses(): Promise<string[]> {
    try {
      const { uid } = await getAuth();
      await ensureUserBootstrap(uid);
      const raw = (await dbGet(`users/${uid}/preferences/app/addedCourses`)) ?? [];
      return Array.isArray(raw) ? raw.map(String) : [];
    } catch {
      return [];
    }
  },

  async addCourse(courseId: string): Promise<void> {
    const { uid } = await getAuth();
    const current = await storage.getAddedCourses();
    if (!current.includes(courseId)) {
      await ensureUserBootstrap(uid);
      await dbPatch(`users/${uid}/preferences/app`, { addedCourses: [...current, courseId], updatedAt: new Date().toISOString() });
      storageEvents.emit("addedCourses");
    }
  },

  async removeCourse(courseId: string): Promise<void> {
    const { uid } = await getAuth();
    const current = await storage.getAddedCourses();
    await ensureUserBootstrap(uid);
    await dbPatch(`users/${uid}/preferences/app`, { addedCourses: current.filter((id) => id !== courseId), updatedAt: new Date().toISOString() });
    storageEvents.emit("addedCourses");
  },

  async resetAllData(): Promise<void> {
    const { uid } = await getAuth();
    await ensureUserBootstrap(uid);
    await dbPatch(`users/${uid}/preferences/app`, { addedCourses: [], currentSession: "", updatedAt: new Date().toISOString() });
  },
};

function computeStats(attempts: QuestionAttempt[]): UserStats {
  const categoryStats: UserStats["categoryStats"] = {};
  for (const a of attempts) {
    if (!categoryStats[a.category]) categoryStats[a.category] = { attempts: 0, correct: 0, averageTime: 0 };
    categoryStats[a.category].attempts++;
    if (a.isCorrect) categoryStats[a.category].correct++;
  }
  for (const cat of Object.keys(categoryStats)) {
    const catAttempts = attempts.filter((a) => a.category === cat);
    categoryStats[cat].averageTime = catAttempts.length ? catAttempts.reduce((s, a) => s + a.thinkTime, 0) / catAttempts.length : 0;
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
