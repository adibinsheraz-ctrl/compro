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
  username: z.string().min(1).max(100),
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

    if (await isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const db = getAdminDb();

    const { data: admin } = await db
      .from("admins")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();

    const ok =
      !!admin && (await verifyPassword(password, admin.password_hash as string));

    await recordLoginAttempt({ ip, username, success: ok });

    if (!ok) {
      return NextResponse.json(
        { error: "Wrong username or password." },
        { status: 401 }
      );
    }

    const sessionId = await createSession(admin!.id as string);
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
