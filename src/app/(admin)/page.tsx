import { RosterClient } from "@/components/roster-client";
import { getSettings, listStudents } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [students, settings] = await Promise.all([
    listStudents(),
    getSettings(),
  ]);

  return <RosterClient initialStudents={students} settings={settings} />;
}
