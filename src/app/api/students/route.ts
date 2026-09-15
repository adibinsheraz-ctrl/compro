import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireSession } from "@/lib/auth";
import { createStudent, listStudents } from "@/lib/db";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  roll_no: z.string().trim().min(1).max(40),
  class_name: z.string().trim().optional(),
});

export async function GET() {
  try {
    await requireSession();
    const students = await listStudents();
    return NextResponse.json({ students });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Name and roll number are required." }, { status: 400 });
    }
    const student = await createStudent(parsed.data);
    return NextResponse.json({ student }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Failed to add student";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
