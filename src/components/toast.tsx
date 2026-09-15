"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastTone = "teal" | "amber" | "coral" | "ink";

export type ToastPayload = {
  title: string;
  detail?: string;
  tone?: ToastTone;
};

const toneClass: Record<ToastTone, string> = {
  teal: "bg-teal text-white",
  amber: "bg-amber text-white",
  coral: "bg-coral text-white",
  ink: "bg-ink text-white",
};

let pushToast: ((t: ToastPayload) => void) | null = null;

export function toast(payload: ToastPayload) {
  pushToast?.(payload);
}

export function ToastHost() {
  const [item, setItem] = useState<(ToastPayload & { id: number }) | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  return createPortal(
    <div
      key={item.id}
      className={`animate-pop fixed inset-x-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[100] mx-auto max-w-[448px] rounded-2xl px-4 py-3.5 shadow-[var(--shadow)] ${toneClass[item.tone ?? "ink"]}`}
      role="status"
    >
      <p className="font-display text-[15px] font-bold leading-tight">
        {item.title}
      </p>
      {item.detail ? (
        <p className="mt-1 text-[13px] opacity-90">{item.detail}</p>
      ) : null}
    </div>,
    document.body
  );
}
