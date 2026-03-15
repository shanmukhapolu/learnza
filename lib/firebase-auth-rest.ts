import { FIREBASE_API_KEY, FIREBASE_PROJECT_ID } from "@/lib/firebase-config";

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
}

export interface AuthSession {
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
}

const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1";
const SECURE_TOKEN_BASE = "https://securetoken.googleapis.com/v1";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveUid(data: any): string {
  const direct = data?.localId || data?.user_id || data?.userId;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const token = typeof data?.idToken === "string" ? data.idToken : null;
  if (token) {
    const payload = decodeJwtPayload(token);
    const fromToken = (payload?.user_id || payload?.sub) as string | undefined;
    if (typeof fromToken === "string" && fromToken.length > 0) {
      return fromToken;
    }
  }

  return "";
}

function toSession(data: any): AuthSession {
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: Number(data.expiresIn || 3600),
    user: {
      uid: resolveUid(data),
      email: data.email,
      displayName: data.displayName,
    },
  };
}

async function authRequest(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${AUTH_BASE}/${endpoint}?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Authentication request failed");
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const data = await authRequest("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });
  return toSession(data);
}

export async function signInWithEmail(email: string, password: string) {
  const data = await authRequest("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
  return toSession(data);
}

export async function signInWithGoogleIdToken(idToken: string) {
  const data = await authRequest("accounts:signInWithIdp", {
    requestUri: window.location.origin,
    postBody: `id_token=${idToken}&providerId=google.com`,
    returnSecureToken: true,
    returnIdpCredential: true,
  });
  return toSession(data);
}

export async function updateDisplayName(idToken: string, displayName: string, fallbackUid?: string) {
  const data = await authRequest("accounts:update", {
    idToken,
    displayName,
    returnSecureToken: true,
  });
  const session = toSession(data);
  if (!session.user.uid && fallbackUid) {
    session.user.uid = fallbackUid;
  }
  return session;
}

export async function refreshIdToken(refreshToken: string) {
  const res = await fetch(`${SECURE_TOKEN_BASE}/token?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Token refresh failed");
  }

  return {
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresIn: Number(data.expires_in || 3600),
    uid: data.user_id,
  };
}

export async function saveUserProfile(idToken: string, uid: string, profile: UserProfile) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  const orgUrl = new URL(`${FIRESTORE_BASE}/organizations/${uid}`);
  orgUrl.searchParams.set("access_token", idToken);
  orgUrl.searchParams.set("updateMask.fieldPaths", "ownerUid");
  orgUrl.searchParams.append("updateMask.fieldPaths", "updatedAt");

  await fetch(orgUrl.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        ownerUid: { stringValue: uid },
        updatedAt: { timestampValue: new Date().toISOString() },
      },
    }),
  }).catch(() => null);

  // Use Firestore REST API with Firebase ID token as query param (not Bearer token)

  // Firebase ID tokens work when passed via access_token query param
  const url = new URL(`${FIRESTORE_BASE}/organizations/${uid}/members/${uid}`);
  url.searchParams.set("access_token", idToken);
  url.searchParams.set("updateMask.fieldPaths", "name");
  url.searchParams.append("updateMask.fieldPaths", "firstName");
  url.searchParams.append("updateMask.fieldPaths", "lastName");
  url.searchParams.append("updateMask.fieldPaths", "uid");
  url.searchParams.append("updateMask.fieldPaths", "role");
  url.searchParams.append("updateMask.fieldPaths", "status");

  const nameRes = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        name: { stringValue: fullName },
        firstName: { stringValue: profile.firstName },
        lastName: { stringValue: profile.lastName },
        uid: { stringValue: uid },
        role: { stringValue: "owner" },
        status: { stringValue: "active" },
      },
    }),
  });

  if (!nameRes.ok) {
    const text = await nameRes.text().catch(() => "");
    throw new Error(`Failed to save display name: ${nameRes.status} ${text}`);
  }
}

export async function getUserProfile(idToken: string, uid: string): Promise<UserProfile | null> {
  // Use Firestore REST API with Firebase ID token as query param
  const url = new URL(`${FIRESTORE_BASE}/organizations/${uid}/members/${uid}`);
  url.searchParams.set("access_token", idToken);

  const nameRes = await fetch(url.toString());
  
  if (!nameRes.ok) {
    return null;
  }

  const data = await nameRes.json();
  if (!data?.fields) {
    return null;
  }

  const fields = data.fields;
  
  // Check for firstName/lastName fields first
  if (fields.firstName?.stringValue || fields.lastName?.stringValue) {
    return {
      firstName: fields.firstName?.stringValue || "",
      lastName: fields.lastName?.stringValue || "",
    };
  }

  // Fallback: parse from full name field
  if (fields.name?.stringValue) {
    const [firstName = "", ...rest] = fields.name.stringValue.trim().split(/\s+/);
    return {
      firstName,
      lastName: rest.join(" "),
    };
  }

  return null;
}
