"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  chanceRemaining,
  isChanceExhausted,
  type Incident,
  type Settings,
  type Student,
} from "@/lib/types";

export function StudentDetailClient({
  initialStudent,
  initialIncidents,
  settings,
}: {
  initialStudent: Student;
  initialIncidents: Incident[];
  settings: Settings;
}) {
  const router = useRouter();
  const [student, setStudent] = useState(initialStudent);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [showLog, setShowLog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [roll, setRoll] = useState(student.roll_no);
  const [busy, setBusy] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const exhausted = isChanceExhausted(student, settings);
  const left = chanceRemaining(student, settings);

  async function logIncident() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}/incident`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Log failed", detail: data.error, tone: "coral" });
        return;
      }
      setStudent(data.student as Student);
      setIncidents((prev) => [data.incident as Incident, ...prev]);
      if (data.result_type === "chance_used") {
        toast({
          title: "Chance used",
          detail: "Warning recorded. No fine this time.",
          tone: "amber",
        });
      } else {
        toast({
          title: `Fine +Rs ${data.amount}`,
          detail: `Total now Rs ${(data.student as Student).total_fine}`,
          tone: "coral",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roll_no: roll }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Update failed", detail: data.error, tone: "coral" });
        return;
      }
      setStudent(data.student as Student);
      setEditing(false);
      toast({ title: "Saved", tone: "teal" });
    } finally {
      setBusy(false);
    }
  }

  async function undoLast() {
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}/undo`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Undo failed", detail: data.error, tone: "coral" });
        return;
      }
      setStudent(data.student as Student);
      setIncidents((prev) => prev.slice(1));
      setConfirmUndo(false);
      toast({
        title: "Last incident undone",
        detail: "Only use this for genuine misclicks.",
        tone: "ink",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeStudent() {
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Delete failed", detail: data.error, tone: "coral" });
        return;
      }
      toast({ title: "Student removed", tone: "ink" });
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise pb-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Roster
      </Link>

      <header className="mt-4">
        {!editing ? (
          <>
            <h1 className="font-display text-[2rem] font-extrabold leading-none text-ink">
              {student.name}
            </h1>
            <p className="mt-2 text-[14px] font-medium text-muted">
              Roll #{student.roll_no}
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-paper px-3.5 py-3 text-[16px] outline-none focus:border-teal"
            />
            <input
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-paper px-3.5 py-3 text-[16px] outline-none focus:border-teal"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="pressable flex-1 rounded-xl bg-teal py-3 text-[14px] font-semibold text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setName(student.name);
                  setRoll(student.roll_no);
                }}
                className="pressable flex-1 rounded-xl bg-fog py-3 text-[14px] font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[var(--line)] bg-paper p-4">
          <p className="text-[12px] font-semibold text-muted">Chance</p>
          <p
            className={`font-display mt-1 text-[1.35rem] font-extrabold ${
              exhausted ? "text-coral" : "text-teal-deep"
            }`}
          >
            {exhausted ? "Used" : left === 1 ? "Open" : `${left} left`}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-paper p-4">
          <p className="text-[12px] font-semibold text-muted">Fine owed</p>
          <p className="font-display mt-1 text-[1.35rem] font-extrabold text-ink">
            Rs {student.total_fine}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={logIncident}
        className={`pressable mt-5 w-full rounded-2xl py-4 text-[16px] font-bold text-white shadow-[var(--shadow)] disabled:opacity-60 ${
          exhausted ? "bg-coral" : "bg-amber"
        }`}
      >
        {busy
          ? "Saving…"
          : exhausted
            ? `Log incident   +Rs ${settings.fine_amount}`
            : "Log incident   use chance"}
      </button>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="pressable flex-1 rounded-xl bg-fog py-3 text-[13px] font-semibold text-ink"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          className="pressable flex-1 rounded-xl bg-fog py-3 text-[13px] font-semibold text-ink"
        >
          {showLog ? "Hide log" : "History"}
        </button>
      </div>

      {showLog ? (
        <div className="animate-pop mt-4 space-y-2">
          {incidents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] px-3 py-6 text-center text-[13px] text-muted">
              No incidents yet.
            </p>
          ) : (
            incidents.map((inc) => (
              <div
                key={inc.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-paper px-3.5 py-3"
              >
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    {inc.type === "chance_used" ? "Chance used" : "Fine"}
                  </p>
                  <p className="text-[12px] text-muted">
                    {new Date(inc.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-[13px] font-bold text-muted">
                  {inc.amount > 0 ? `Rs ${inc.amount}` : "nil"}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className="mt-10 rounded-2xl border border-dashed border-[var(--line)] p-4">
        <p className="text-[12px] font-semibold text-muted">Corrections</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Only for genuine mistakes. This is intentionally hard to reach.
        </p>

        {!confirmUndo ? (
          <button
            type="button"
            onClick={() => setConfirmUndo(true)}
            disabled={incidents.length === 0 || busy}
            className="mt-3 text-[13px] font-semibold text-ink underline decoration-[var(--line)] underline-offset-4 disabled:opacity-40"
          >
            Undo last incident…
          </button>
        ) : (
          <div className="animate-pop mt-3 space-y-2 rounded-xl bg-amber/10 p-3">
            <p className="text-[13px] font-medium text-ink">
              Undo the most recent log for {student.name}? This can restore a
              chance if that log was the chance.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={undoLast}
                disabled={busy}
                className="pressable flex-1 rounded-lg bg-ink py-2.5 text-[13px] font-semibold text-white"
              >
                Yes, undo it
              </button>
              <button
                type="button"
                onClick={() => setConfirmUndo(false)}
                className="pressable flex-1 rounded-lg bg-paper py-2.5 text-[13px] font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-coral"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M5 4V2.5A1.5 1.5 0 016.5 1h3A1.5 1.5 0 0111 2.5V4m2 0l-.8 9.2A1.5 1.5 0 0110.7 14.5H5.3A1.5 1.5 0 013.8 13.2L3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Remove student
        </button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Remove student?"
        detail={`This will permanently delete ${student.name} and their entire incident history. This cannot be undone.`}
        confirmLabel="Delete forever"
        tone="coral"
        busy={busy}
        onConfirm={removeStudent}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
