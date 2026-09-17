import { NextResponse } from "next/server";
import { getPublicSettings, listPublicStudents } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [students, settings] = await Promise.all([
      listPublicStudents(),
      getPublicSettings(),
    ]);

    return NextResponse.json(
      { students, settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load roster" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed. Public roster is strictly read-only." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Public roster is strictly read-only." },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method not allowed. Public roster is strictly read-only." },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Public roster is strictly read-only." },
    { status: 405 }
  );
}
