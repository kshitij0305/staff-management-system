import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "vk_session";
export const OAUTH_STATE_COOKIE = "vk_oauth_state";
const SESSION_DAYS = 7;
export const REMEMBER_DAYS = 30;

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  name: string;
  employeeId: string;
}

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET is not set (needs at least 16 characters)");
  }
  // Refuse to run in production with the shipped dev secret.
  if (process.env.NODE_ENV === "production" && secret.includes("dev-only")) {
    throw new Error("JWT_SECRET still has the dev default — set a real secret before deploying");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(
  payload: SessionPayload,
  days: number = SESSION_DAYS
): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, employeeId: payload.employeeId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      name: payload.name as string,
      employeeId: payload.employeeId as string,
    };
  } catch {
    return null;
  }
}

/** Read + verify the session cookie. Server components / route handlers only. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(token: string, days: number = SESSION_DAYS) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
