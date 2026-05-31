// Offscreen document: owns the camera + MediaPipe loop and runs in the
// background (persists even with no SokBaro tab open). Reuses the same pure
// posture logic as the web app.

import type { PoseLandmarker } from "@mediapipe/tasks-vision";

import { createPoseLandmarker } from "@/lib/pose/poseLandmarker";
import { scorePosture, METRIC_MESSAGES } from "@/lib/pose/scoring";
import {
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
import type { Baseline, Landmark } from "@/lib/pose/types";
import type { Message, Phase } from "./messages";

// Timers (not rAF) keep firing when the page is backgrounded. ~10 fps when
// active; Chrome may throttle to ~1/s in the background — fine for a 10s alert.
const PROCESS_INTERVAL_MS = 100;
const STATUS_POST_INTERVAL_MS = 500;

const video = document.getElementById("video") as HTMLVideoElement;

let landmarker: PoseLandmarker | null = null;
let stream: MediaStream | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let starting = false; // re-entrancy guard: set synchronously, before any await

let baseline: Baseline | null = null;
let calibration: CalibrationState = createCalibrationState();
let calibrationStart = 0;
let alertState: AlertState = createAlertState();
let lastBreakAt: number | null = null;
let lastStatusPost = 0;
let phase: Phase = "idle";

function post(message: Message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Service worker may be asleep; sending wakes it. Ignore transient errors.
  });
}

function setPhase(next: Phase) {
  phase = next;
}

async function start() {
  // Guard against overlapping starts: timer is only set after the awaits below,
  // so a second start() would otherwise slip past and fight over the <video>.
  if (timer || starting) return;
  starting = true;
  setPhase("initializing");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();

    if (!landmarker) {
      landmarker = await createPoseLandmarker({
        wasmPath: chrome.runtime.getURL("wasm"),
        modelPath: chrome.runtime.getURL("models/pose_landmarker_lite.task"),
      });
    }

    baseline = null;
    calibration = createCalibrationState();
    calibrationStart = Date.now();
    alertState = createAlertState();
    lastBreakAt = null;
    lastStatusPost = 0;
    setPhase("calibrating");
    post({ type: "STATUS", phase, score: 100, status: "good" });

    timer = setInterval(tick, PROCESS_INTERVAL_MS);
  } catch (err) {
    // DOMExceptions stringify to "[object DOMException]" — pull out name+message.
    const name = err instanceof Error ? err.name : "";
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[SokBaro offscreen] start() failed: ${name}: ${detail}`);

    // Map the common getUserMedia failures to a plain-language reason.
    const friendly =
      name === "NotReadableError"
        ? "Camera is in use by another app or tab. Close Zoom/Meet/Photo Booth and any camera tab, then try again."
        : name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access for the extension."
          : name === "NotFoundError"
            ? "No camera found."
            : `${name || "Error"}: ${detail}`;

    setPhase("error");
    post({
      type: "ERROR",
      message: friendly,
      // Offscreen can't show a camera prompt; this means it was never granted.
      needsPermission: name === "NotAllowedError",
    });
    stop();
  } finally {
    starting = false;
  }
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  video.srcObject = null;
  setPhase("idle");
}

function tick() {
  if (!landmarker || video.readyState < 2) return;

  const result = landmarker.detectForVideo(video, performance.now());
  const landmarks = result.landmarks?.[0] as Landmark[] | undefined;
  if (!landmarks) return;

  const now = Date.now();

  // Calibration: capture a personal baseline before scoring.
  if (!baseline) {
    calibration = addCalibrationSample(calibration, landmarks);
    if (now - calibrationStart >= CALIBRATION_DURATION_MS) {
      const captured = finalizeCalibration(calibration);
      if (captured) {
        baseline = captured;
        lastBreakAt = now;
        setPhase("monitoring");
      } else {
        calibration = createCalibrationState();
        calibrationStart = now;
      }
    }
    return;
  }

  // Monitoring: score, alert, break reminder.
  const posture = scorePosture(landmarks, baseline);

  if (now - lastStatusPost >= STATUS_POST_INTERVAL_MS) {
    lastStatusPost = now;
    post({ type: "STATUS", phase, score: posture.score, status: posture.status });
  }

  const alert = updateAlertState(alertState, {
    status: posture.status,
    worstMetric: posture.worstMetric,
    now,
  });
  alertState = alert.state;
  if (alert.fired && alert.metric) {
    post({ type: "ALERT", message: METRIC_MESSAGES[alert.metric] });
  }

  if (
    isBreakDue({ sessionStart: calibrationStart, lastReminderAt: lastBreakAt, now })
  ) {
    lastBreakAt = now;
    post({
      type: "ALERT",
      message: "Time to stand up and stretch.",
      variant: "info",
    });
  }
}

chrome.runtime.onMessage.addListener((msg: Message) => {
  if (msg.type === "OFFSCREEN_START") start();
  else if (msg.type === "OFFSCREEN_STOP") stop();
});

// Offscreen documents can't use chrome.storage — announce readiness instead, so
// the background can start us once it loads (no race with OFFSCREEN_START).
post({ type: "OFFSCREEN_READY" });
