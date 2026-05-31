"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { usePoseDetection, type SessionSummary } from "@/hooks/usePoseDetection";
import { METRIC_MESSAGES } from "@/lib/pose/scoring";
import { saveSession } from "@/lib/firebase/sessions";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import type { MetricKey } from "@/lib/pose/types";

type SaveState = "idle" | "saving" | "saved" | "skipped" | "error";

function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 45) return "text-amber-400";
  return "text-red-400";
}

export default function MonitorClient() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    phase,
    error,
    score,
    status,
    subScores,
    calibrationProgress,
    alertMessage,
    breakDue,
    start,
    stop,
    dismissBreak,
  } = usePoseDetection({ videoRef, canvasRef });

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const active = phase === "calibrating" || phase === "monitoring";

  const handleStop = async () => {
    const result = stop();
    setSummary(result);
    if (!result) return;
    if (!isFirebaseConfigured()) {
      setSaveState("skipped");
      return;
    }
    setSaveState("saving");
    try {
      const ok = await saveSession(result);
      setSaveState(ok ? "saved" : "skipped");
    } catch {
      setSaveState("error");
    }
  };

  const handleStart = () => {
    setSummary(null);
    setSaveState("idle");
    start();
  };

  // Failing metrics (sub-score below the "good" line), worst first.
  const hints = subScores
    ? (Object.keys(subScores) as MetricKey[])
        .filter((k) => subScores[k] < 70)
        .sort((a, b) => subScores[a] - subScores[b])
    : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />

        {/* Live score + status badges */}
        {phase === "monitoring" && (
          <div className="absolute left-4 top-4 flex items-center gap-3 rounded-xl bg-black/55 px-4 py-2 backdrop-blur">
            <span className={`text-3xl font-bold tabular-nums ${scoreColor(score)}`}>
              {score}
            </span>
            <span className="text-xs uppercase tracking-wide text-white/60">/ 100</span>
            <span
              className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold ${
                status === "good"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {status === "good" ? "Good posture" : "Fix your posture"}
            </span>
          </div>
        )}

        {/* Idle / loading / calibrating overlays */}
        {!active && phase !== "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60 text-center text-white">
            <p className="max-w-sm px-6 text-sm text-white/80">
              {phase === "initializing"
                ? "Starting camera and loading the posture model…"
                : "Allow camera access and sit normally to begin. Video never leaves your device."}
            </p>
          </div>
        )}
        {phase === "calibrating" && (
          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-4 text-center text-white">
            <p className="text-sm font-medium">Calibrating — sit up straight…</p>
            <div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-emerald-400 transition-[width] duration-150"
                style={{ width: `${Math.round(calibrationProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Sustained-bad-posture alert */}
        {phase === "monitoring" && alertMessage && (
          <div className="absolute inset-x-4 bottom-4 rounded-xl bg-red-500/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
            {alertMessage}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!active ? (
          <button
            onClick={handleStart}
            disabled={phase === "initializing"}
            className="rounded-full bg-emerald-500 px-6 py-2.5 font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {phase === "initializing" ? "Starting…" : "Start posture check"}
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="rounded-full bg-white/10 px-6 py-2.5 font-semibold text-white transition hover:bg-white/20"
          >
            End session
          </button>
        )}
        <Link
          href="/dashboard"
          className="rounded-full border border-white/15 px-6 py-2.5 font-semibold text-white/80 transition hover:bg-white/5"
        >
          View dashboard
        </Link>
      </div>

      {/* Live coaching hints */}
      {phase === "monitoring" && hints.length > 0 && (
        <ul className="flex flex-col gap-2">
          {hints.map((k) => (
            <li
              key={k}
              className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-200"
            >
              {METRIC_MESSAGES[k]}
            </li>
          ))}
        </ul>
      )}

      {/* Break reminder */}
      {breakDue && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sky-100">
          <span className="text-sm font-medium">
            You&apos;ve been working for a while. Time to stand up and stretch.
          </span>
          <button
            onClick={dismissBreak}
            className="rounded-full bg-sky-400/20 px-4 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-400/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Post-session summary */}
      {summary && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Session summary</h2>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <Stat label="Avg score" value={`${summary.avgScore}`} />
            <Stat label="Good posture" value={`${summary.goodPct}%`} />
            <Stat label="Alerts" value={`${summary.alertsCount}`} />
          </div>
          <p className="mt-4 text-xs text-white/50">
            {saveState === "saving" && "Saving to your history…"}
            {saveState === "saved" && "Saved to your history."}
            {saveState === "skipped" &&
              "History saving is off (Firebase not configured)."}
            {saveState === "error" && "Could not save this session."}
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/30 px-3 py-4">
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-white/50">
        {label}
      </div>
    </div>
  );
}
