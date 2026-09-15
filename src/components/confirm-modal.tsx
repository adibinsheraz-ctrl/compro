"use client";

import { useEffect } from "react";

export function ConfirmModal({
  open,
  title,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "fine",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  detail: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "fine" | "ink" | "warn";
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

  const confirmClass =
    tone === "fine"
      ? "btn-danger"
      : tone === "warn"
        ? "btn-accent"
        : "btn-primary";

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={onCancel}
    >
      <div
        className="modal-sheet sheet-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="t18 font-semibold text-ink">
          {title}
        </h2>
        <p className="t13 mt-2 leading-relaxed text-muted">{detail}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn btn-glass flex-1 t15"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`btn flex-1 t15 ${confirmClass}`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
