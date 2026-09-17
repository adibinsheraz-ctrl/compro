import { DeveloperCredit } from "@/components/developer-credit";

export default function AboutPage() {
  return (
    <div className="pb-8">
      <p className="t13 font-medium text-muted">About</p>
      <h1 className="t24 mt-1 font-semibold text-ink">Chance Tracker</h1>
      <p className="t15 mt-3 max-w-[44ch] leading-relaxed text-muted">
        Built for a single computer class at Kips College. One chance, then an
        automatic fine every time after.
      </p>

      <DeveloperCredit className="mt-8" />
    </div>
  );
}

