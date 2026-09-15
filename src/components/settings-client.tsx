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
        toast({ title: "Save failed", detail: data.error, tone: "coral" });
        return;
      }
      setFine(String(data.settings.fine_amount));
      setChances(String(data.settings.chances_allowed));
      toast({ title: "Settings saved", tone: "teal" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-rise pb-6">
      <p className="text-[12px] font-semibold text-teal">Admin</p>
      <h1 className="font-display mt-1 text-[1.85rem] font-extrabold text-ink">
        Settings
      </h1>
      <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-muted">
        Change fine amount and how many free chances each student gets. Stored
        in the database — no code edits needed.
      </p>

      <form
        onSubmit={onSave}
        className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-paper p-4 shadow-[var(--shadow)]"
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
            Fine amount (Rs)
          </span>
          <input
            inputMode="numeric"
            value={fine}
            onChange={(e) => setFine(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-teal"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
            Chances allowed
          </span>
          <input
            inputMode="numeric"
            value={chances}
            onChange={(e) => setChances(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-teal"
            required
          />
          <span className="mt-1.5 block text-[12px] text-muted">
            Default is 1. Raising this only affects future logs — used chances
            already recorded stay used.
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="pressable w-full rounded-xl bg-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
