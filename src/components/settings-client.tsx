"use client";

import { FormEvent, useState } from "react";
import { toast } from "@/components/toast";
import type { Settings } from "@/lib/types";

export function SettingsClient({ initial }: { initial: Settings }) {
  const [fine, setFine] = useState(String(initial.fine_amount));
  const [chances, setChances] = useState(String(initial.chances_allowed));
  const [saving, setSaving] = useState(false);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fine_amount: Number(fine),
          chances_allowed: Number(chances),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Save failed", detail: data.error, tone: "fine" });
        return;
      }
      setFine(String(data.settings.fine_amount));
      setChances(String(data.settings.chances_allowed));
      toast({ title: "Settings saved", tone: "ink" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-6">
      <p className="t13 font-medium text-muted">Admin</p>
      <h1 className="t24 mt-1 font-semibold text-ink">Settings</h1>
      <p className="t15 mt-2 max-w-[40ch] leading-relaxed text-muted">
        Change the fine amount and how many free chances each student gets.
        Stored in the database. No code edits needed.
      </p>

      <form
        onSubmit={onSave}
        className="mt-6 space-y-4 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4"
      >
        <label className="block">
          <span className="t13 mb-1.5 block font-medium text-ink">
            Fine amount (Rs)
          </span>
          <input
            inputMode="numeric"
            value={fine}
            onChange={(e) => setFine(e.target.value)}
            className="field num"
            required
          />
        </label>
        <label className="block">
          <span className="t13 mb-1.5 block font-medium text-ink">
            Chances allowed
          </span>
          <input
            inputMode="numeric"
            value={chances}
            onChange={(e) => setChances(e.target.value)}
            className="field num"
            required
          />
          <span className="t12 mt-1.5 block leading-relaxed text-muted">
            Default is 1. Raising this only affects future logs. Used chances
            already recorded stay used.
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary w-full t15"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
