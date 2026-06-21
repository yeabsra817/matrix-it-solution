import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./constants";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  schoolCode: string | null;
  schoolName?: string;
  mustChangePwd?: boolean;
};

const COOKIE = "matrix_session";

/** Stable fallback so Vercel demos work when SESSION_SECRET is not yet configured. */
const PRODUCTION_SESSION_FALLBACK = "matrix-it-solution-production-session-v1";

function getSessionSecret(): Uint8Array {
  const raw =
    process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    (process.env.VERCEL ? PRODUCTION_SESSION_FALLBACK : "matrix-dev-secret");
  return new TextEncoder().encode(raw);
}

export function isSessionConfigured(): boolean {
  return !!(process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.VERCEL);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getSessionSecret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSessionSecret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
