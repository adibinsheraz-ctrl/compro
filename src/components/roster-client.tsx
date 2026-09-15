"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  chanceRemaining,
  isChanceExhausted,
  type Settings,
  type Student,
} from "@/lib/types";

const CLASS_OPTIONS = ["RCSB 1", "RCSB 2", "RCSB 3"] as const;

function matchesQuery(student: Student, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    student.name.toLowerCase().includes(needle) ||
    student.roll_no.toLowerCase().includes(needle)
  );
}

export function RosterClient({
  initialStudents,
  settings,
}: {
  initialStudents: Student[];
  settings: Settings;
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState<string>(CLASS_OPTIONS[0]);
  const [pending, startTransition] = useTransition();
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(
    () => students.filter((s) => matchesQuery(s, query)),
    [students, query]
  );

  async function addStudent() {
    if (!name.trim() || !roll.trim()) return;
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, roll_no: roll, class_name: className }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: "Could not add", detail: data.error, tone: "coral" });
      return;
    }
    setStudents((prev) =>
      [...prev, data.student as Student].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setName("");
    setRoll("");
    setClassName(CLASS_OPTIONS[0]);
    setShowAdd(false);
    toast({ title: "Student added", tone: "teal" });
  }

  async function deleteStudent() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Delete failed", detail: data.error, tone: "coral" });
        return;
      }
      setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast({ title: "Student removed", tone: "ink" });
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } finally {
      setDeleting(false);
    }
  }

  async function logIncident(student: Student) {
    if (loggingId) return;
    setLoggingId(student.id);

    const wasExhausted = isChanceExhausted(student, settings);
    // Optimistic preview
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== student.id) return s;
        if (!wasExhausted) {
          return { ...s, chances_used: s.chances_used + 1 };
        }
        return { ...s, total_fine: s.total_fine + settings.fine_amount };
      })
    );

    try {
      const res = await fetch(`/api/students/${student.id}/incident`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        // Revert optimistic update
        setStudents((prev) =>
          prev.map((s) => (s.id === student.id ? student : s))
        );
        toast({ title: "Log failed", detail: data.error, tone: "coral" });
        return;
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? (data.student as Student) : s))
      );

      if (data.result_type === "chance_used") {
        toast({
          title: "Chance used",
          detail: `${student.name}: warning recorded. No fine.`,
          tone: "amber",
        });
      } else {
        toast({
          title: `Fine +Rs ${data.amount}`,
          detail: `New total: Rs ${(data.student as Student).total_fine}`,
          tone: "coral",
        });
      }
      startTransition(() => router.refresh());
    } catch {
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? student : s))
      );
      toast({ title: "Network error", tone: "coral" });
    } finally {
      setLoggingId(null);
    }
  }

  return (
    <div className="animate-rise pb-4">
      <header className="mb-5">
        <p className="text-[12px] font-semibold text-teal tracking-wide uppercase">Computer Class</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="font-display text-[1.85rem] font-extrabold leading-none text-ink">
            Roster
          </h1>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="pressable rounded-full bg-ink px-3.5 py-2 text-[13px] font-semibold text-white"
          >
            {showAdd ? "Close" : "Add Student"}
          </button>
        </div>
        <p className="mt-2 text-[14px] text-muted">
          Fine Rs {settings.fine_amount}{" "}
          <span className="mx-1.5 opacity-30">|</span>{" "}
          {settings.chances_allowed} chance
          {settings.chances_allowed === 1 ? "" : "s"}
        </p>
      </header>

      {showAdd ? (
        <div className="animate-pop mb-4 space-y-3 rounded-2xl border border-[var(--line)] bg-paper p-4 shadow-[var(--shadow)]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student name"
            className="w-full rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-teal"
          />
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="Roll number"
            className="w-full rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-teal"
          />
          <div className="relative">
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[var(--line)] bg-surface px-3.5 py-3 text-[16px] outline-none focus:border-teal pr-10 cursor-pointer"
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              width="16" height="16" viewBox="0 0 16 16" fill="none"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button
            type="button"
            onClick={addStudent}
            className="pressable w-full rounded-xl bg-teal px-3 py-3 text-[14px] font-semibold text-white"
          >
            Save Student
          </button>
        </div>
      ) : null}

      <div className="sticky top-0 z-20 -mx-1 mb-3 bg-gradient-to-b from-surface via-surface to-transparent px-1 pb-3 pt-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or roll…"
          autoCapitalize="none"
          className="w-full rounded-2xl border border-[var(--line)] bg-paper px-4 py-3.5 text-[16px] shadow-sm outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-10 text-center">
          <p className="font-display text-lg font-bold text-ink">No students</p>
          <p className="mt-1 text-[14px] text-muted">
            {students.length === 0
              ? "Add your class to start logging."
              : "Nothing matches that search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((student) => {
            const exhausted = isChanceExhausted(student, settings);
            const left = chanceRemaining(student, settings);
            return (
              <li
                key={student.id}
                className="flex items-stretch gap-2 rounded-2xl border border-[var(--line)] bg-paper p-2 shadow-[0_4px_16px_rgba(19,34,31,0.04)]"
              >
                <Link
                  href={`/students/${student.id}`}
                  className="pressable min-w-0 flex-1 rounded-xl px-3 py-2.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-display text-[17px] font-bold text-ink">
                      {student.name}
                    </p>
                    <span className="shrink-0 text-[12px] font-semibold text-muted">
                      {student.roll_no}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] font-semibold">
                    {student.class_name && (
                      <span className="rounded-full bg-[var(--fog)] px-2 py-0.5 text-[11px] font-semibold text-muted">
                        {student.class_name}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        exhausted
                          ? "bg-coral/10 text-coral"
                          : "bg-teal/10 text-teal-deep"
                      }`}
                    >
                      {exhausted
                        ? "Chance used"
                        : left === 1
                          ? "Chance open"
                          : `${left} chances left`}
                    </span>
                    <span className="text-muted">
                      Rs {student.total_fine}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={loggingId === student.id || pending}
                    onClick={() => logIncident(student)}
                    className={`pressable flex w-[5rem] shrink-0 flex-1 flex-col items-center justify-center rounded-xl text-[12px] font-bold text-white ${
                      exhausted ? "bg-coral" : "bg-amber"
                    } disabled:opacity-50`}
                  >
                    <span className="text-[11px] font-semibold opacity-90">
                      Log
                    </span>
                    <span>{exhausted ? "Fine" : "Chance"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(student)}
                    className="pressable flex w-[5rem] shrink-0 items-center justify-center rounded-xl bg-[var(--fog)] py-1.5 text-[11px] font-semibold text-coral hover:bg-coral/10"
                    title="Remove student"
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="mr-0.5">
                      <path d="M2 4h12M5 4V2.5A1.5 1.5 0 016.5 1h3A1.5 1.5 0 0111 2.5V4m2 0l-.8 9.2A1.5 1.5 0 0110.7 14.5H5.3A1.5 1.5 0 013.8 13.2L3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Del
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Remove student?"
        detail={`This will permanently delete ${deleteTarget?.name ?? "this student"} and their entire incident history. This cannot be undone.`}
        confirmLabel="Yes, delete"
        tone="coral"
        busy={deleting}
        onConfirm={deleteStudent}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
