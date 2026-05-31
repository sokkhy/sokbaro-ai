"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isFirebaseConfigured } from "@/lib/firebase/client";
import { fetchRecentSessions, type StoredSession } from "@/lib/firebase/sessions";

type LoadState = "loading" | "ready" | "unconfigured" | "error";

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function fmt(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardClient() {
  const [state, setState] = useState<LoadState>(() =>
    isFirebaseConfigured() ? "loading" : "unconfigured",
  );
  const [sessions, setSessions] = useState<StoredSession[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    let cancelled = false;
    fetchRecentSessions()
      .then((rows) => {
        if (cancelled) return;
        setSessions(rows);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const todays = sessions.filter((s) => isToday(s.startedAt));
  const todayScore =
    todays.length > 0
      ? Math.round(
          todays.reduce((sum, s) => sum + s.avgScore, 0) / todays.length,
        )
      : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-sm uppercase tracking-wide text-white/50">
          Today&apos;s posture score
        </p>
        <p className="mt-2 text-6xl font-bold tabular-nums text-emerald-400">
          {todayScore ?? "—"}
          {todayScore != null && (
            <span className="text-2xl text-white/40"> / 100</span>
          )}
        </p>
        {todayScore == null && state === "ready" && (
          <p className="mt-2 text-sm text-white/50">
            No sessions yet today.{" "}
            <Link href="/monitor" className="text-emerald-400 underline">
              Start one
            </Link>
            .
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">
          Recent sessions
        </h2>

        {state === "loading" && (
          <p className="text-sm text-white/50">Loading…</p>
        )}
        {state === "error" && (
          <p className="text-sm text-red-300">Could not load your history.</p>
        )}
        {state === "unconfigured" && (
          <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
            History is not enabled yet. Add your Firebase config to{" "}
            <code className="text-white/80">.env.local</code> to save sessions.
          </p>
        )}
        {state === "ready" && sessions.length === 0 && (
          <p className="text-sm text-white/50">No sessions recorded yet.</p>
        )}

        {state === "ready" && sessions.length > 0 && (
          <ul className="flex flex-col divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 bg-white/5 px-4 py-3"
              >
                <span className="text-sm text-white/70">{fmt(s.startedAt)}</span>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-white/50">{s.goodPct}% good</span>
                  <span className="text-white/50">{s.alertsCount} alerts</span>
                  <span className="w-10 text-right font-bold tabular-nums text-emerald-400">
                    {s.avgScore}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
