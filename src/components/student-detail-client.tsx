"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [className, setClassName] = useState(student.class_name || "");
  const [busy, setBusy] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [justFine, setJustFine] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fineRef = useRef<HTMLParagraphElement>(null);

  const exhausted = isChanceExhausted(student, settings);
  const left = chanceRemaining(student, settings);

  // The one deliberate motion moment: badge settles into its new color and the
  // fine numeral gives a brief weighty bump when an incident is logged.
  useEffect(() => {
    if (!justLogged) return;
    const id = window.setTimeout(() => setJustLogged(false), 600);
    return () => window.clearTimeout(id);
  }, [justLogged]);

  async function logIncident() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/students/${student.id}/incident`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Log failed", detail: data.error, tone: "fine" });
        return;
      }
      setStudent(data.student as Student);
      setIncidents((prev) => [data.incident as Incident, ...prev]);
      setJustFine(data.result_type === "fine");
      setJustLogged(true);
      if (data.result_type === "chance_used") {
        toast({
          title: "Chance used",
          detail: "Warning recorded. No fine this time.",
          tone: "warn",
        });
      } else {
        toast({
          title: `Fine +Rs ${data.amount}`,
          detail: `Total now Rs ${(data.student as Student).total_fine}`,
          tone: "fine",
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
        body: JSON.stringify({ name, roll_no: roll, class_name: className || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Update failed", detail: data.error, tone: "fine" });
        return;
      }
      setStudent(data.student as Student);
      setEditing(false);
      toast({ title: "Saved", tone: "ink" });
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
        toast({ title: "Undo failed", detail: data.error, tone: "fine" });
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
        toast({ title: "Delete failed", detail: data.error, tone: "fine" });
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
    <div className="pb-6">
      <Link
        href="/"
        className="btn-quiet t13 -ml-2 px-2"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Roster
      </Link>

      <header className="mt-4">
        {!editing ? (
          <>
            <h1 className="t24 font-semibold text-ink">{student.name}</h1>
            <div className="mt-1 flex items-baseline gap-3">
              <p className="num t13 text-muted">Roll {student.roll_no}</p>
              {student.class_name ? (
                <p className="t13 text-muted">{student.class_name}</p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="t13 mb-1.5 block font-medium text-muted">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
              />
            </label>
            <label className="block">
              <span className="t13 mb-1.5 block font-medium text-muted">Roll number</span>
              <input
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                className="field"
              />
            </label>
            <label className="block">
              <span className="t13 mb-1.5 block font-medium text-muted">Class</span>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="field"
              >
                <option value="">No class</option>
                <option value="RCSB 1">RCSB 1</option>
                <option value="RCSB 2">RCSB 2</option>
                <option value="RCSB 3">RCSB 3</option>
              </select>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="btn btn-primary flex-1 t15"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                setEditing(false);
                setName(student.name);
                setRoll(student.roll_no);
                setClassName(student.class_name || "");
                }}
                className="btn btn-glass flex-1 t15"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="ledger-strip mt-5 grid grid-cols-2">
        <div className="pr-4 py-3">
          <p className="t12 text-muted">Chance standing</p>
          <p className="mt-1">
            {exhausted ? (
              <span className="badge badge-fine badge-settle">Chance used</span>
            ) : (
              <span
                className={`badge badge-clear ${justLogged && !justFine ? "badge-settle" : ""} ${
                  left === 1 ? "badge-settle" : ""
                }`}
              >
                {left === 1 ? "Chance open" : `${left} chances left`}
              </span>
            )}
          </p>
        </div>
        <div className="pl-4 py-3">
          <p className="t12 text-muted">Fine owed</p>
          <p
            ref={fineRef}
            className={`num t24 mt-0.5 font-medium ${
              student.total_fine > 0 ? "text-fine-text" : "text-ink"
            } ${justLogged && justFine ? "num-bump" : ""}`}
          >
            Rs {student.total_fine}
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={logIncident}
        className={`btn font-display mt-6 w-full t15 font-semibold ${
          exhausted ? "btn-danger" : "btn-accent"
        }`}
      >
        {busy
          ? "Saving…"
          : exhausted
            ? `Log Incident (+Rs ${settings.fine_amount})`
            : "Log Incident (Use Chance)"}
      </button>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn btn-glass flex-1 t13"
        >
          Edit Details
        </button>
        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          aria-expanded={showLog}
          className="btn btn-glass flex-1 t13"
        >
          {showLog ? "Hide Log" : "Incident Log"}
        </button>
      </div>

      {showLog ? (
        <div className="mt-5">
          <div className="register">
            {incidents.length === 0 ? (
              <p className="t13 px-1 py-6 text-center text-muted">
                Nothing logged yet. The first incident for this student will
                appear here.
              </p>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="register-row items-center justify-between !py-2.5"
                >
                  <div>
                    <p className="t13 font-medium text-ink">
                      {inc.type === "chance_used" ? "Chance used" : "Fine charged"}
                    </p>
                    <p className="num t12 text-muted">
                      {new Date(inc.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p
                    className={`num t13 font-medium ${
                      inc.amount > 0 ? "text-fine-text" : "text-muted"
                    }`}
                  >
                    {inc.amount > 0 ? `Rs ${inc.amount}` : "nil"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-10 rounded-xl border border-dashed border-[var(--line-strong)] p-4">
        <p className="t13 font-medium text-muted">Corrections</p>
        <p className="t13 mt-1 leading-relaxed text-muted">
          Only for genuine mistakes. This is intentionally hard to reach.
        </p>

        {!confirmUndo ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setConfirmUndo(true)}
              disabled={incidents.length === 0 || busy}
              className="btn-quiet t13"
            >
              Undo last incident…
            </button>
          </div>
        ) : (
          <div className="sheet-in mt-3 space-y-2.5 rounded-lg border border-[rgba(198,146,58,0.3)] bg-[rgba(198,146,58,0.08)] p-3">
            <p className="t13 text-ink">
              Undo the most recent log for {student.name}? This can restore a
              chance if that log was the chance.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={undoLast}
                disabled={busy}
                className="btn btn-accent flex-1 t13"
              >
                Yes, undo it
              </button>
              <button
                type="button"
                onClick={() => setConfirmUndo(false)}
                className="btn btn-glass flex-1 t13"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-3">
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn-quiet t13 !text-fine-text hover:!text-[#efb3a3]"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M2 4h12M5 4V2.5A1.5 1.5 0 016.5 1h3A1.5 1.5 0 0111 2.5V4m2 0l-.8 9.2A1.5 1.5 0 0110.7 14.5H5.3A1.5 1.5 0 013.8 13.2L3 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Remove student
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="Remove student?"
        detail={`This will permanently delete ${student.name} and their entire incident history. This cannot be undone.`}
        confirmLabel="Delete forever"
        tone="fine"
        busy={busy}
        onConfirm={removeStudent}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
