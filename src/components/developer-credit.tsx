import Image from "next/image";

const links = [
  {
    href: "mailto:adi.binsheraz@gmail.com",
    icon: "/icons/communication.png",
    alt: "",
    label: "Email Adi Bin Sheraz",
    title: "Email",
    external: false,
  },
  {
    href: "https://instagram.com/adibinsheraz",
    icon: "/icons/instagram.png",
    alt: "",
    label: "Instagram: @adibinsheraz",
    title: "Instagram",
    external: true,
  },
  {
    href: "https://adi3d.vercel.app/",
    icon: "/icons/link.png",
    alt: "",
    label: "Portfolio: adi3d.vercel.app",
    title: "My website",
    external: true,
  },
  {
    href: "https://adisocial.vercel.app/",
    icon: "/icons/export.png",
    alt: "",
    label: "Second website: adisocial.vercel.app",
    title: "My second website",
    external: true,
  },
];

export function DeveloperCredit({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-5 ${className}`}
    >
      <p className="t12 text-muted">Developer</p>
      <p className="t18 mt-1 font-semibold text-ink">Adi Bin Sheraz</p>

      <div className="mt-4 flex items-center gap-3">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noreferrer" : undefined}
            aria-label={link.label}
            title={link.title}
            className="pressable flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--line-strong)] transition-colors hover:border-[var(--accent)]"
          >
            <Image
              src={link.icon}
              alt={link.alt}
              width={22}
              height={22}
              className="h-[22px] w-[22px]"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
