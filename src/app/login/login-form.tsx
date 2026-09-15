"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

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
        body: JSON.stringify({ password }),
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
      <div className="glass-strong rounded-2xl p-6">
        <h1 className="t32 font-semibold leading-[1.1] text-ink">
          Chance Tracker
        </h1>
        <p className="t15 mt-3 max-w-[30ch] leading-relaxed text-muted">
          One chance. After that, every miss adds a fine, automatically.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="t13 mb-1.5 block font-medium text-muted">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="Enter admin password"
              required
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="sheet-in rounded-lg border border-[rgba(180,67,46,0.35)] bg-[rgba(180,67,46,0.12)] px-3 py-2.5 text-[13px] text-fine-text"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full t15 font-semibold"
          >
            {loading ? "Signing in…" : "Open Class Roster"}
          </button>
        </form>
      </div>

      <p className="t12 mt-8 text-center text-muted">
        Built by Adi Bin Sheraz
      </p>
    </div>
  );
}
