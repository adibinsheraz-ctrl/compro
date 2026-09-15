import { SettingsClient } from "@/components/settings-client";
import { getSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient initial={settings} />;
}
