"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

import { createPoseLandmarker } from "@/lib/pose/poseLandmarker";
import { METRIC_MESSAGES, scorePosture } from "@/lib/pose/scoring";
import {
  ALERT_HOLD_MS,
  createAlertState,
  updateAlertState,
  type AlertState,
} from "@/lib/pose/alerts";
import {
  CALIBRATION_DURATION_MS,
  addCalibrationSample,
  createCalibrationState,
  finalizeCalibration,
  type CalibrationState,
} from "@/lib/pose/calibration";
import { isBreakDue } from "@/lib/breaks";
import { UPPER_BODY_CONNECTIONS } from "@/lib/pose/landmarks";
import type {
  Baseline,
  Landmark,
  MetricKey,
  PostureStatus,
} from "@/lib/pose/types";

/** Process ~10 frames/sec so detection doesn't peg the main thread. */
const PROCESS_INTERVAL_MS = 100;

export type PosturePhase =
  | "idle"
  | "initializing"
  | "calibrating"
  | "monitoring"
  | "error";

export interface SessionSummary {
  startedAt: number;
  endedAt: number;
  avgScore: number;
  goodPct: number;
  alertsCount: number;
}

interface SessionAccumulator {
  startedAt: number;
  scoreSum: number;
  frames: number;
  goodFrames: number;
  alertsCount: number;
}

interface UsePoseDetectionArgs {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export interface PostureUiState {
  phase: PosturePhase;
  error: string | null;
  score: number;
  status: PostureStatus;
  subScores: Record<MetricKey, number> | null;
  calibrationProgress: number;
  alertMessage: string | null;
  breakDue: boolean;
  start: () => void;
  stop: () => SessionSummary | null;
  dismissBreak: () => void;
}

export function usePoseDetection({
  videoRef,
  canvasRef,
}: UsePoseDetectionArgs): PostureUiState {
  const [phase, setPhase] = useState<PosturePhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(100);
  const [status, setStatus] = useState<PostureStatus>("good");
  const [subScores, setSubScores] = useState<Record<MetricKey, number> | null>(
    null,
  );
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [breakDue, setBreakDue] = useState(false);
  const [running, setRunning] = useState(false);

  // Mutable loop state (avoids stale closures inside the rAF callback).
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastProcessRef = useRef(0);
  const statusRef = useRef<PostureStatus>("good");

  const baselineRef = useRef<Baseline | null>(null);
  const calibrationRef = useRef<CalibrationState>(createCalibrationState());
  const calibrationStartRef = useRef(0);
  const alertStateRef = useRef<AlertState>(createAlertState());
  const sessionRef = useRef<SessionAccumulator | null>(null);
  const lastBreakRef = useRef<number | null>(null);
  // Guards against re-entrant start() calls while a session is spinning up.
  const activeRef = useRef(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, [videoRef]);

  // The detection loop lives in an effect so it owns its own rAF lifecycle.
  // All inputs are refs (or stable setters), so it only depends on `running`.
  useEffect(() => {
    if (!running) return;
    let rafId = 0;

    const drawOverlay = (landmarks: Landmark[] | undefined) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!landmarks) return;

      const { width, height } = canvas;
      const color = statusRef.current === "good" ? "#34d399" : "#f87171";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 4;
      for (const [a, b] of UPPER_BODY_CONNECTIONS) {
        const pa = landmarks[a];
        const pb = landmarks[b];
        if (!pa || !pb) continue;
        ctx.beginPath();
        ctx.moveTo(pa.x * width, pa.y * height);
        ctx.lineTo(pb.x * width, pb.y * height);
        ctx.stroke();
      }
      for (const [a, b] of UPPER_BODY_CONNECTIONS) {
        for (const idx of [a, b]) {
          const p = landmarks[idx];
          if (!p) continue;
          ctx.beginPath();
          ctx.arc(p.x * width, p.y * height, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const frame = () => {
      rafId = requestAnimationFrame(frame);

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !landmarker || video.readyState < 2) return;

      const tNow = performance.now();
      if (tNow - lastProcessRef.current < PROCESS_INTERVAL_MS) return;
      lastProcessRef.current = tNow;

      const result = landmarker.detectForVideo(video, tNow);
      const landmarks = result.landmarks?.[0] as Landmark[] | undefined;
      drawOverlay(landmarks);
      if (!landmarks) return;

      const wallNow = Date.now();

      // Calibration phase: gather a baseline before scoring.
      if (!baselineRef.current) {
        calibrationRef.current = addCalibrationSample(
          calibrationRef.current,
          landmarks,
        );
        const elapsed = wallNow - calibrationStartRef.current;
        setCalibrationProgress(Math.min(1, elapsed / CALIBRATION_DURATION_MS));
        if (elapsed >= CALIBRATION_DURATION_MS) {
          const baseline = finalizeCalibration(calibrationRef.current);
          if (baseline) {
            baselineRef.current = baseline;
            sessionRef.current = {
              startedAt: wallNow,
              scoreSum: 0,
              frames: 0,
              goodFrames: 0,
              alertsCount: 0,
            };
            lastBreakRef.current = null;
            setPhase("monitoring");
          } else {
            calibrationRef.current = createCalibrationState();
            calibrationStartRef.current = wallNow;
          }
        }
        return;
      }

      // Monitoring phase: score, alert, accumulate session stats.
      const posture = scorePosture(landmarks, baselineRef.current);
      statusRef.current = posture.status;
      setScore(posture.score);
      setStatus(posture.status);
      setSubScores(posture.subScores);

      const session = sessionRef.current;
      if (session) {
        session.scoreSum += posture.score;
        session.frames += 1;
        if (posture.status === "good") session.goodFrames += 1;
      }

      const alert = updateAlertState(alertStateRef.current, {
        status: posture.status,
        worstMetric: posture.worstMetric,
        now: wallNow,
      });
      alertStateRef.current = alert.state;
      if (alert.fired && alert.metric) {
        setAlertMessage(METRIC_MESSAGES[alert.metric]);
        if (session) session.alertsCount += 1;
      } else if (posture.status === "good") {
        setAlertMessage(null);
      }

      if (
        session &&
        isBreakDue({
          sessionStart: session.startedAt,
          lastReminderAt: lastBreakRef.current,
          now: wallNow,
        })
      ) {
        lastBreakRef.current = wallNow;
        setBreakDue(true);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [running, videoRef, canvasRef]);

  const start = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    setPhase("initializing");
    setError(null);

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("Video element unavailable");
        video.srcObject = stream;
        await video.play();

        if (!landmarkerRef.current) {
          landmarkerRef.current = await createPoseLandmarker();
        }

        // Reset per-session state and begin calibration.
        baselineRef.current = null;
        calibrationRef.current = createCalibrationState();
        calibrationStartRef.current = Date.now();
        alertStateRef.current = createAlertState();
        sessionRef.current = null;
        lastProcessRef.current = 0;
        statusRef.current = "good";
        setCalibrationProgress(0);
        setAlertMessage(null);
        setBreakDue(false);
        setScore(100);
        setStatus("good");
        setPhase("calibrating");
        setRunning(true);
      } catch (err) {
        activeRef.current = false;
        stopStream();
        setError(
          err instanceof Error
            ? err.message
            : "Could not start the camera or detector.",
        );
        setPhase("error");
      }
    })();
  }, [videoRef, stopStream]);

  const stop = useCallback((): SessionSummary | null => {
    activeRef.current = false;
    setRunning(false);
    stopStream();
    setPhase("idle");
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session || session.frames === 0) return null;
    return {
      startedAt: session.startedAt,
      endedAt: Date.now(),
      avgScore: Math.round(session.scoreSum / session.frames),
      goodPct: Math.round((session.goodFrames / session.frames) * 100),
      alertsCount: session.alertsCount,
    };
  }, [stopStream]);

  const dismissBreak = useCallback(() => setBreakDue(false), []);

  // Stop the camera if the component unmounts mid-session.
  useEffect(() => stopStream, [stopStream]);

  return {
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
  };
}

export { ALERT_HOLD_MS };
