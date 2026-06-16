const CLIENT_SESSION_KEY = "matrix_client_session";

export type ClientSession = {
  email: string;
  fullName: string;
  role: string;
  schoolCode: string | null;
  redirect: string;
  savedAt: number;
};

export function saveClientSession(session: ClientSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage blocked */
  }
}

export function getClientSession(): ClientSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLIENT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSession;
    if (!parsed?.role || !parsed?.redirect) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearClientSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CLIENT_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
