import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminDb } from "./supabase";

export const SESSION_COOKIE = "kips_session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
export const MAX_LOGIN_ATTEMPTS = 8;
export const LOGIN_WINDOW_MS = 1000 * 60 * 15; // 15 minutes

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function sessionExpiryDate(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_MS);
}

export async function createSession(adminId: string): Promise<string> {
  const db = getAdminDb();
  const expiresAt = sessionExpiryDate().toISOString();

  const { data, error } = await db
    .from("sessions")
    .insert({ admin_id: adminId, expires_at: expiresAt })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create session");
  }

  return data.id as string;
}

export async function destroySession(sessionId: string): Promise<void> {
  const db = getAdminDb();
  await db.from("sessions").delete().eq("id", sessionId);
}

export async function getValidSessionId(): Promise<string | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getAdminDb();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("sessions")
    .select("id, expires_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await db.from("sessions").delete().eq("id", sessionId);
    return null;
  }

  // Touch last_seen without blocking the request hard
  void db
    .from("sessions")
    .update({ last_seen_at: now })
    .eq("id", sessionId);

  return data.id as string;
}

export async function requireSession(): Promise<string> {
  const sessionId = await getValidSessionId();
  if (!sessionId) {
    throw new AuthError("Unauthorized");
  }
  return sessionId;
}

export class AuthError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export function attachSessionCookie(
  response: NextResponse,
  sessionId: string
): NextResponse {
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function isRateLimited(ip: string): Promise<boolean> {
  const db = getAdminDb();
  const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();

  const { count, error } = await db
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("attempted_at", since);

  if (error) {
    // Fail closed on rate-limit query errors
    console.error("rate limit check failed", error);
    return true;
  }

  return (count ?? 0) >= MAX_LOGIN_ATTEMPTS;
}

export async function recordLoginAttempt(opts: {
  ip: string;
  username: string;
  success: boolean;
}): Promise<void> {
  const db = getAdminDb();
  await db.from("login_attempts").insert({
    ip: opts.ip,
    username: opts.username,
    success: opts.success,
  });
}
