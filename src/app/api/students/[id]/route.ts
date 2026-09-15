import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/lib/auth";
import {
  deleteStudent,
  getStudent,
  listIncidents,
  updateStudent,
} from "@/lib/db";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  roll_no: z.string().trim().min(1).max(40),
  class_name: z.string().trim().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const student = await getStudent(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    const incidents = await listIncidents(id);
    return NextResponse.json({ student, incidents });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load student" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid student data." }, { status: 400 });
    }
    const student = await updateStudent(id, parsed.data);
    return NextResponse.json({ student });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    await deleteStudent(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
