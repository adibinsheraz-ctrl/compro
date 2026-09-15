import { notFound } from "next/navigation";
import { StudentDetailClient } from "@/components/student-detail-client";
import { getSettings, getStudent, listIncidents } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function StudentPage({ params }: Props) {
  const { id } = await params;
  const [student, settings, incidents] = await Promise.all([
    getStudent(id),
    getSettings(),
    listIncidents(id),
  ]);

  if (!student) notFound();

  return (
    <StudentDetailClient
      initialStudent={student}
      initialIncidents={incidents}
      settings={settings}
    />
  );
}
