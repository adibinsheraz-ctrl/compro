"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Roster" },
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
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-2"
      aria-label="Primary"
    >
      <div className="glass mx-auto flex w-fit max-w-full items-center gap-1 rounded-2xl p-1.5">
        {links.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`t13 rounded-xl px-3.5 py-2.5 font-medium transition-colors ${
                active
                  ? "bg-[var(--accent)] text-[#f2f7f4]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={logout}
          className="t13 rounded-xl px-3.5 py-2.5 font-medium text-muted transition-colors hover:text-ink"
        >
          Out
        </button>
      </div>
    </nav>
  );
}
