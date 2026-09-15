import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  destroySession,
} from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    try {
      await destroySession(sessionId);
    } catch (err) {
      console.error("logout session destroy failed", err);
    }
  }

  const response = NextResponse.json({ ok: true });
  return clearSessionCookie(response);
}
