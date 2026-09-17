import type { Metadata } from "next";
import { PublicBoardClient } from "@/components/public-board-client";
import { getPublicSettings, listPublicStudents } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Class Status Board | Kips College Chance Tracker",
  description:
    "Live, read-only class roster and incident tracker for Kips College computer class.",
};

export default async function PublicBoardPage() {
  const [students, settings] = await Promise.all([
    listPublicStudents(),
    getPublicSettings(),
  ]);

  return (
    <main className="min-h-screen">
      <PublicBoardClient
        initialStudents={students}
        initialSettings={settings}
      />
    </main>
  );
}
