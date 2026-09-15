import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { ToastHost } from "@/components/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware has already gated this route group. Checking cookie presence
  // here avoids two DB roundtrips per page render — every mutating API still
  // verifies the session server-side against the sessions table.
  const jar = await cookies();
  if (!jar.get(SESSION_COOKIE)?.value) {
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
