"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Class" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "About" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="sticky bottom-0 z-40 mt-auto border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="flex items-center gap-1">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`pressable flex-1 rounded-xl px-2 py-2.5 text-center text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-ink text-white"
                  : "text-muted hover:bg-fog/70"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className="pressable rounded-xl px-3 py-2.5 text-[13px] font-semibold text-muted hover:bg-fog/70"
        >
          Out
        </button>
      </div>
    </nav>
  );
}
