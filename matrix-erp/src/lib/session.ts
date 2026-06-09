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
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "matrix-dev-secret"
);

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);

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
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
