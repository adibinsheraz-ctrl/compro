import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db";

const schema = z.object({
  fine_amount: z.number().int().min(0).max(100000),
  chances_allowed: z.number().int().min(1).max(50),
});

export async function GET() {
  try {
    await requireSession();
    const settings = await getSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireSession();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
    }
    const settings = await updateSettings(parsed.data);
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
