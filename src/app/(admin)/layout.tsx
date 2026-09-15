import { redirect } from "next/navigation";
import { getValidSessionId } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { ToastHost } from "@/components/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getValidSessionId();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <main className="flex-1 px-4 pt-5">{children}</main>
      <BottomNav />
      <ToastHost />
    </div>
  );
}
