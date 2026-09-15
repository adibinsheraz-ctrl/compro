"use client";

import { useEffect } from "react";

export function ConfirmModal({
  open,
  title,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "coral",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  detail: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "coral" | "ink" | "amber";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmBg =
    tone === "coral" ? "bg-coral" : tone === "amber" ? "bg-amber" : "bg-ink";

  return (
    <div
      className="modal-backdrop animate-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <h2
          id="confirm-title"
          className="font-display text-[1.25rem] font-semibold text-ink"
        >
          {title}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{detail}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="pressable flex-1 rounded-2xl bg-fog py-3 text-[14px] font-semibold text-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`pressable flex-1 rounded-2xl py-3 text-[14px] font-semibold text-white disabled:opacity-60 ${confirmBg}`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
