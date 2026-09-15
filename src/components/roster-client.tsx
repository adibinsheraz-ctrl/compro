"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
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

function statusBadge(student: Student, settings: Settings) {
  const exhausted = isChanceExhausted(student, settings);
  const left = chanceRemaining(student, settings);
  if (exhausted) {
    return <span className="badge badge-fine">Chance used</span>;
  }
  return (
    <span className={`badge badge-clear ${left === 1 ? "badge-settle" : ""}`}>
      {left === 1 ? "Chance open" : `${left} chances left`}
    </span>
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
  const [, startTransition] = useTransition();
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

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
      toast({ title: "Could not add", detail: data.error, tone: "fine" });
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
    toast({ title: "Student added", tone: "ink" });
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
        toast({ title: "Log failed", detail: data.error, tone: "fine" });
        return;
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? (data.student as Student) : s))
      );
      setJustLoggedId(student.id);
      window.setTimeout(() => setJustLoggedId(null), 600);

      if (data.result_type === "chance_used") {
        toast({
          title: "Chance used",
          detail: `${student.name}: warning recorded. No fine.`,
          tone: "warn",
        });
      } else {
        toast({
          title: `Fine +Rs ${data.amount}`,
          detail: `New total: Rs ${(data.student as Student).total_fine}`,
          tone: "fine",
        });
      }
      startTransition(() => router.refresh());
    } catch {
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? student : s))
      );
      toast({ title: "Network error", tone: "fine" });
    } finally {
      setLoggingId(null);
    }
  }

  return (
    <div className="pb-4">
      <header className="mb-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="t13 font-medium text-muted">Computer Class</p>
            <h1 className="t24 font-semibold text-ink">Roster</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="btn btn-glass t13 px-4"
          >
            {showAdd ? "Close" : "Add Student"}
          </button>
        </div>
        <div className="ledger-strip mt-4 grid grid-cols-2">
          <div className="px-1 py-2.5">
            <p className="t12 text-muted">Students</p>
            <p className="num t18 font-medium text-ink">{students.length}</p>
          </div>
          <div className="px-1 py-2.5">
            <p className="t12 text-muted">Fine</p>
            <p className="num t18 font-medium text-ink">
              Rs {settings.fine_amount}
            </p>
          </div>
        </div>
      </header>

      {showAdd ? (
        <div
          className="sheet-in mb-5 space-y-3 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4"
          role="group"
          aria-label="Add student"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Student name"
            className="field"
          />
          <input
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="Roll number"
            className="field"
          />
          <div className="relative">
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="field pr-10"
            >
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <button
            type="button"
            onClick={addStudent}
            className="btn btn-primary w-full t15"
          >
            Save Student
          </button>
        </div>
      ) : null}

      <div className="sticky top-0 z-20 -mx-4 mb-3 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)] to-transparent px-4 pb-3 pt-1">
        <div className="glass flex items-center rounded-xl px-3.5">
          <svg
            aria-hidden
            className="mr-2.5 shrink-0 text-muted"
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10.5 10.5L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or roll number"
            autoCapitalize="none"
            aria-label="Search students by name or roll number"
            className="w-full bg-transparent py-3 text-[16px] text-ink outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-12 text-center">
          <p className="t15 font-medium text-ink">
            {students.length === 0
              ? "Your register is empty"
              : "No students match that search"}
          </p>
          <p className="t13 mx-auto mt-1.5 max-w-[32ch] text-muted">
            {students.length === 0
              ? "Use Add Student above to enter your first name and roll number, then log incidents straight from this list."
              : "Check the spelling, or clear the search to see the full roster."}
          </p>
        </div>
      ) : (
        <div className="register">
          {filtered.map((student) => {
            const exhausted = isChanceExhausted(student, settings);
            const isLogging = loggingId === student.id;
            return (
              <div key={student.id} className="register-row">
                <Link
                  href={`/students/${student.id}`}
                  prefetch
                  className="min-w-0 flex-1 rounded-lg py-0.5"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="t15 truncate font-medium text-ink">
                      {student.name}
                    </p>
                    <span className="num t13 shrink-0 text-muted">
                      {student.roll_no}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    {student.class_name ? (
                      <span className="t12 text-muted">{student.class_name}</span>
                    ) : null}
                    {justLoggedId === student.id ? (
                      exhausted ? (
                        <span className="badge badge-fine badge-settle">
                          Chance used
                        </span>
                      ) : (
                        <span className="badge badge-clear badge-settle">
                          {chanceRemaining(student, settings) === 1
                            ? "Chance open"
                            : `${chanceRemaining(student, settings)} chances left`}
                        </span>
                      )
                    ) : (
                      statusBadge(student, settings)
                    )}
                    <span
                      className={`num t13 font-medium ${
                        student.total_fine > 0 ? "text-fine-text" : "text-muted"
                      }`}
                    >
                      Rs {student.total_fine}
                    </span>
                  </div>
                </Link>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    disabled={isLogging}
                    onClick={() => logIncident(student)}
                    className={`btn font-display t13 h-11 px-3.5 ${
                      exhausted ? "btn-danger" : "btn-accent"
                    }`}
                  >
                    {isLogging
                      ? "…"
                      : exhausted
                        ? "Fine"
                        : "Log"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
