"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell justify-center px-5">
      <div className="animate-rise relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-paper p-6 shadow-[var(--shadow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-teal/15 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-amber/15 blur-2xl"
        />

        <p className="text-[12px] font-semibold tracking-[0.08em] text-teal">
          Kips College
        </p>
        <h1 className="font-display mt-2 text-[2rem] font-extrabold leading-[1.05] text-ink">
          Chance Tracker
        </h1>
        <p className="mt-3 max-w-[28ch] text-[15px] leading-relaxed text-muted">
          One chance. After that, every miss adds a fine, automatically.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
              Username
            </span>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-[var(--line)] bg-surface px-4 py-3.5 text-[16px] outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
              placeholder="kips@7777"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-[var(--line)] bg-surface px-4 py-3.5 text-[16px] outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15"
              placeholder="••••••••"
              required
            />
          </label>

          {error ? (
            <p className="animate-pop rounded-xl bg-coral/10 px-3 py-2 text-[13px] font-medium text-coral">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="pressable w-full rounded-2xl bg-ink px-4 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(11,36,33,0.22)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Open class roster"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-[12px] text-muted">
        Built by Adi Bin Sheraz
      </p>
    </div>
  );
}
