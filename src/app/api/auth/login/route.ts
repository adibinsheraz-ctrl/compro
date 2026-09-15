import { NextResponse } from "next/server";
import { z } from "zod";
import {
  attachSessionCookie,
  createSession,
  isRateLimited,
  recordLoginAttempt,
  verifyPassword,
} from "@/lib/auth";
import { getAdminDb } from "@/lib/supabase";

const bodySchema = z.object({
  // Username is optional and ignored by the lookup below: the client never
  // sends it, so the admin username never ships in the browser bundle.
  username: z.string().max(100).optional(),
  password: z.string().min(1).max(200),
});

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const db = getAdminDb();

    // Fail fast: body parse, rate-limit check, and the admin lookup all run
    // together — the rate-limit query never gates the happy path.
    const [json, limited, adminRes] = await Promise.all([
      request.json().catch(() => null),
      isRateLimited(ip),
      // Single-admin app: resolve the admin row server-side so the username
      // is never exposed to the client.
      db
        .from("admins")
        .select("id, username, password_hash")
        .maybeSingle(),
    ]);

    if (limited) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const admin = adminRes.data;

    const ok =
      !!admin && (await verifyPassword(password, admin.password_hash as string));

    if (!ok) {
      // Audit log is best-effort: never block the failure response on it.
      void recordLoginAttempt({
        ip,
        username: admin?.username ?? username ?? "unknown",
        success: false,
      }).catch(() => {});
      return NextResponse.json(
        { error: "Wrong username or password." },
        { status: 401 }
      );
    }

    // Session insert runs alongside the attempt log — both must finish
    // before the cookie is set, so only the cookie awaits them.
    const [, sessionId] = await Promise.all([
      recordLoginAttempt({
        ip,
        username: admin!.username as string,
        success: true,
      }),
      createSession(admin!.id as string),
    ]);
    const response = NextResponse.json({ ok: true });
    return attachSessionCookie(response, sessionId);
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json(
      { error: "Login failed. Check server configuration." },
      { status: 500 }
    );
  }
}
