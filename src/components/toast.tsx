"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type ToastTone = "ink" | "warn" | "fine";

export type ToastPayload = {
  title: string;
  detail?: string;
  tone?: ToastTone;
};

const toneStyle: Record<ToastTone, { border: string; icon: string }> = {
  ink: {
    border: "var(--glass-line)",
    icon: "var(--muted)",
  },
  warn: {
    border: "rgba(198, 146, 58, 0.45)",
    icon: "var(--warn)",
  },
  fine: {
    border: "rgba(180, 67, 46, 0.45)",
    icon: "var(--fine)",
  },
};

let pushToast: ((t: ToastPayload) => void) | null = null;

export function toast(payload: ToastPayload) {
  pushToast?.(payload);
}

const emptySubscribe = () => () => {};

export function ToastHost() {
  // Hydration-safe: false during SSR, true once the client has taken over,
  // without calling setState inside an effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [item, setItem] = useState<(ToastPayload & { id: number }) | null>(
    null
  );

  useEffect(() => {
    pushToast = (t) => setItem({ ...t, id: Date.now() });
    return () => {
      pushToast = null;
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    const id = window.setTimeout(() => setItem(null), 2800);
    return () => window.clearTimeout(id);
  }, [item]);

  if (!mounted || !item) return null;

  const tone = toneStyle[item.tone ?? "ink"];

  return createPortal(
    <div
      key={item.id}
      role="status"
      className="glass-strong toast-in fixed inset-x-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-[448px] overflow-hidden rounded-xl py-3 pl-4 pr-4"
      style={{ borderColor: tone.border }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: tone.icon }}
      />
      <p className="t13 pl-1.5 font-semibold leading-tight text-ink">
        {item.title}
      </p>
      {item.detail ? (
        <p className="t12 pl-1.5 mt-1 leading-relaxed text-muted">
          {item.detail}
        </p>
      ) : null}
    </div>,
    document.body
  );
}
