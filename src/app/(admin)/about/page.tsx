export default function AboutPage() {
  return (
    <div className="animate-rise pb-8">
      <p className="text-[12px] font-semibold text-teal tracking-wide uppercase">About</p>
      <h1 className="font-display mt-1 text-[1.85rem] font-extrabold text-ink">
        Chance Tracker
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted">
        Built for a single computer class at Kips College. One chance, then an
        automatic fine every time after.
      </p>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-paper p-5 shadow-[var(--shadow)]">
        <p className="text-[12px] font-semibold text-muted uppercase tracking-wide">Developer</p>
        <p className="font-display mt-1 text-[1.35rem] font-extrabold text-ink">
          Adi Bin Sheraz
        </p>

        {/* Contact icons row */}
        <div className="mt-4 flex flex-col gap-3">

          {/* Email */}
          <a
            href="mailto:adi.binsheraz@gmail.com"
            className="pressable flex items-center gap-3 rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[14px] font-medium text-ink hover:border-teal/40 hover:bg-teal/5 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="min-w-0 truncate">adi.binsheraz@gmail.com</span>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/adibinsheraz"
            target="_blank"
            rel="noreferrer"
            className="pressable flex items-center gap-3 rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[14px] font-medium text-ink hover:border-teal/40 hover:bg-teal/5 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.75"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75"/>
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
              </svg>
            </span>
            <span>@adibinsheraz</span>
          </a>

          {/* Portfolio */}
          <a
            href="https://adi3d.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="pressable flex items-center gap-3 rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[14px] font-medium text-ink hover:border-teal/40 hover:bg-teal/5 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75"/>
                <path d="M2 12h20M12 2c-2.5 3-4 6-4 10s1.5 7 4 10M12 2c2.5 3 4 6 4 10s-1.5 7-4 10" stroke="currentColor" strokeWidth="1.75"/>
              </svg>
            </span>
            <span>adi3d.vercel.app</span>
            <svg className="ml-auto shrink-0 text-muted" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M4 12L12 4M6 4h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>

          {/* Social links */}
          <a
            href="https://adisocial.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="pressable flex items-center gap-3 rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[14px] font-medium text-ink hover:border-teal/40 hover:bg-teal/5 transition-colors"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17 8a3 3 0 100-6 3 3 0 000 6zm-10 4a3 3 0 100-6 3 3 0 000 6zm10 4a3 3 0 100-6 3 3 0 000 6zm-10-4l10-4M7 16l10-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </span>
            <span>adisocial.vercel.app</span>
            <svg className="ml-auto shrink-0 text-muted" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M4 12L12 4M6 4h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
