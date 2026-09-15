import { NextResponse } from "next/server";
import { AuthError, requireSession } from "@/lib/auth";
import { logIncident } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const result = await logIncident(id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Failed to log incident";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
