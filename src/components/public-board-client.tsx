"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { DeveloperCredit } from "@/components/developer-credit";
import { getPublicSupabase } from "@/lib/supabase";
import type { PublicSettings, PublicStudent } from "@/lib/types";

const CLASS_OPTIONS = ["All", "RCSB 1", "RCSB 2", "RCSB 3"] as const;

export function PublicBoardClient({
  initialStudents,
  initialSettings,
}: {
  initialStudents: PublicStudent[];
  initialSettings: PublicSettings;
}) {
  const [students, setStudents] = useState<PublicStudent[]>(initialStudents);
  const [settings, setSettings] = useState<PublicSettings>(initialSettings);
  const [query, setQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const studentsRef = useRef(students);
  studentsRef.current = students;

  // Realtime Supabase Subscription (if anon key is configured)
  useEffect(() => {
    const supabase = getPublicSupabase();
    if (!supabase) return;

    try {
      const channel = supabase
        .channel("public-students-roster")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "students" },
          (payload) => {
            setLastUpdated(new Date());
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as PublicStudent;
              setUpdatedIds((prev) => new Set(prev).add(updated.id));
              setTimeout(() => {
                setUpdatedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(updated.id);
                  return next;
                });
              }, 1200);

              setStudents((prev) =>
                prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
              );
            } else if (payload.eventType === "INSERT") {
              const inserted = payload.new as PublicStudent;
              setStudents((prev) =>
                [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name))
              );
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as { id: string }).id;
              setStudents((prev) => prev.filter((s) => s.id !== deletedId));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Fallback to polling
    }
  }, []);

  // Periodic fast background poll to ensure zero-stale live state
  useEffect(() => {
    let isMounted = true;

    async function syncRoster() {
      try {
        const res = await fetch("/api/public/students", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.students) return;

        const incomingStudents = data.students as PublicStudent[];
        const incomingSettings = data.settings as PublicSettings;

        if (incomingSettings) {
          setSettings(incomingSettings);
        }

        // Compare differences to highlight rows that changed
        const currentMap = new Map(studentsRef.current.map((s) => [s.id, s]));
        const changedIds: string[] = [];

        for (const inc of incomingStudents) {
          const curr = currentMap.get(inc.id);
          if (
            curr &&
            (curr.chances_used !== inc.chances_used ||
              curr.total_fine !== inc.total_fine ||
              curr.class_name !== inc.class_name)
          ) {
            changedIds.push(inc.id);
          }
        }

        if (changedIds.length > 0) {
          setUpdatedIds((prev) => {
            const next = new Set(prev);
            changedIds.forEach((id) => next.add(id));
            return next;
          });
          setTimeout(() => {
            setUpdatedIds((prev) => {
              const next = new Set(prev);
              changedIds.forEach((id) => next.delete(id));
              return next;
            });
          }, 1200);
        }

        setStudents(incomingStudents);
        setLastUpdated(new Date());
      } catch {
        // Network temporary hiccup
      }
    }

    // Refresh on window focus / tab re-open
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        syncRoster();
      }
    }

    window.addEventListener("focus", syncRoster);
    document.addEventListener("visibilitychange", handleVisibility);

    // Live poll interval: 3.5 seconds
    const interval = setInterval(syncRoster, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", syncRoster);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Filter and sort students:
  // 1. Students whose chance is used show on the TOP of the chart
  // 2. Students who have chance show after
  // 3. Secondary sort by fine descending, then name alphabetical
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = students.filter((student) => {
      const matchesText =
        !q ||
        student.name.toLowerCase().includes(q) ||
        student.roll_no.toLowerCase().includes(q) ||
        (student.class_name && student.class_name.toLowerCase().includes(q));

      const studentClass = student.class_name ? student.class_name.trim() : "RCSB 1";
      const matchesSection =
        selectedClass === "All" ||
        studentClass.toLowerCase() === selectedClass.toLowerCase() ||
        studentClass.replace(/\s+/g, "").toLowerCase() === selectedClass.replace(/\s+/g, "").toLowerCase();

      return matchesText && matchesSection;
    });


    return list.sort((a, b) => {
      const aUsed = a.chances_used >= settings.chances_allowed;
      const bUsed = b.chances_used >= settings.chances_allowed;

      // Chance used shows first at the top
      if (aUsed && !bUsed) return -1;
      if (!aUsed && bUsed) return 1;

      // Highest fines next
      if (b.total_fine !== a.total_fine) {
        return b.total_fine - a.total_fine;
      }

      // Alphabetical by name
      return a.name.localeCompare(b.name);
    });
  }, [students, query, selectedClass, settings]);


  return (
    <div className="app-shell px-4 pt-5 pb-10">
      {/* Top Header */}
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="t24 font-semibold text-ink">Chance Tracker</h1>
          </div>

          {/* Unobtrusive Admin Panel link */}
          <Link
            href="/login"
            className="btn btn-glass t13 shrink-0 px-3 py-1.5 min-h-[36px] text-muted hover:text-ink transition-colors"
            title="Admin Login"
          >
            <svg
              className="w-3.5 h-3.5 text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Admin</span>
          </Link>
        </div>
      </header>


      {/* Class Section Filter Tabs */}
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CLASS_OPTIONS.map((cls) => {
          const isSelected = selectedClass === cls;
          return (
            <button
              key={cls}
              type="button"
              onClick={() => setSelectedClass(cls)}
              className={`t12 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                isSelected
                  ? "bg-[var(--accent)] text-[#f2f7f4]"
                  : "bg-[var(--surface)] text-muted hover:text-ink border border-[var(--line)]"
              }`}
            >
              {cls}
            </button>
          );
        })}
      </div>

      {/* Sticky Search Bar */}
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
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
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
            placeholder="Search student or roll number…"
            autoCapitalize="none"
            aria-label="Search students by name or roll number"
            className="w-full bg-transparent py-2.5 text-[15px] text-ink outline-none placeholder:text-muted"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-muted hover:text-ink text-xs px-1"
              aria-label="Clear search"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* Roster List (Read-only) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-12 text-center">
          <p className="t15 font-medium text-ink">
            {students.length === 0
              ? "No students registered yet"
              : "No students match that filter"}
          </p>
          <p className="t13 mx-auto mt-1.5 max-w-[32ch] text-muted">
            {students.length === 0
              ? "When the instructor adds students in the admin panel, they will appear here live."
              : "Try adjusting your search query or selecting a different class section."}
          </p>
        </div>
      ) : (
        <div className="register">
          {filtered.map((student) => {
            const isExhausted = student.chances_used >= settings.chances_allowed;
            const remaining = Math.max(settings.chances_allowed - student.chances_used, 0);
            const isRecentlyUpdated = updatedIds.has(student.id);

            return (
              <div
                key={student.id}
                className={`register-row items-center transition-colors duration-500 ${
                  isRecentlyUpdated ? "bg-[rgba(76,122,115,0.12)] rounded-lg px-2" : ""
                }`}
              >
                {/* Student Info */}
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="t15 truncate font-medium text-ink">
                      {student.name}
                    </p>
                    <span className="num t13 shrink-0 text-muted">
                      #{student.roll_no}
                    </span>
                    <span className="t12 font-medium shrink-0 text-muted">
                      {student.class_name || "RCSB 1"}
                    </span>
                  </div>


                  <div className="mt-1 flex items-center gap-2">
                    {/* Chance Status Badge */}
                    {isExhausted ? (
                      <span
                        className={`badge badge-fine ${
                          isRecentlyUpdated ? "badge-settle" : ""
                        }`}
                      >
                        <span className="badge-dot" />
                        Chance used
                      </span>
                    ) : (
                      <span
                        className={`badge badge-clear ${
                          isRecentlyUpdated ? "badge-settle" : ""
                        }`}
                      >
                        <span className="badge-dot" />
                        {remaining === 1 ? "Chance open" : `${remaining} chances left`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fine Amount */}
                <div className="shrink-0 text-right pl-3">
                  <span
                    className={`num t15 font-semibold ${
                      isRecentlyUpdated ? "num-bump" : ""
                    } ${student.total_fine > 0 ? "text-fine-text" : "text-muted"}`}
                  >
                    Rs {student.total_fine}
                  </span>
                  <p className="t12 text-muted leading-tight">fine owed</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sync Footer Note */}
      <div className="mt-6 flex items-center justify-between text-[11px] text-muted border-t border-[var(--line)] pt-3">
        <span>Updates live during class</span>
        <span className="num">
          Synced {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      {/* Developer Credit Block (Exact reuse from Admin About) */}
      <DeveloperCredit className="mt-8" />
    </div>
  );
}
