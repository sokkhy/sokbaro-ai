// Pure posture-scoring logic. No browser APIs — fully unit-testable.

import { POSE } from "./landmarks";
import type {
  Baseline,
  Landmark,
  MetricKey,
  PostureMetrics,
  PostureResult,
} from "./types";

/** Score becomes "bad" below this overall threshold. */
export const GOOD_SCORE_THRESHOLD = 70;

const WEIGHTS: Record<MetricKey, number> = {
  slouch: 0.35,
  distance: 0.25,
  shoulders: 0.2,
  tilt: 0.2,
};

/** Linear sub-score: returns 100 when value is at/under `good`, 0 at/over `bad`. */
function rampDown(value: number, good: number, bad: number): number {
  if (value <= good) return 100;
  if (value >= bad) return 0;
  return Math.round(100 * (1 - (value - good) / (bad - good)));
}

/** Linear sub-score: returns 100 when value is at/over `good`, 0 at/under `bad`. */
function rampUp(value: number, good: number, bad: number): number {
  if (value >= good) return 100;
  if (value <= bad) return 0;
  return Math.round(100 * ((value - bad) / (good - bad)));
}

function midpointY(a: Landmark, b: Landmark): number {
  return (a.y + b.y) / 2;
}

/** Head tilt in degrees relative to horizontal, normalized to [0, 90]. */
function headTiltDegrees(leftEar: Landmark, rightEar: Landmark): number {
  const dy = rightEar.y - leftEar.y;
  const dx = rightEar.x - leftEar.x;
  let deg = Math.abs((Math.atan2(dy, dx) * 180) / Math.PI);
  if (deg > 90) deg = 180 - deg;
  return deg;
}

/** Compute raw geometric metrics from a set of normalized landmarks. */
export function computeMetrics(
  landmarks: Landmark[],
  baseline: Baseline | null,
): PostureMetrics {
  const nose = landmarks[POSE.NOSE];
  const leftShoulder = landmarks[POSE.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE.RIGHT_SHOULDER];
  const leftEar = landmarks[POSE.LEFT_EAR];
  const rightEar = landmarks[POSE.RIGHT_EAR];

  const shoulderMidY = midpointY(leftShoulder, rightShoulder);
  const headGap = shoulderMidY - nose.y;
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  const shoulderDy = Math.abs(leftShoulder.y - rightShoulder.y);
  const headTiltDeg = headTiltDegrees(leftEar, rightEar);
  const distanceRatio =
    baseline && baseline.shoulderWidth > 0
      ? shoulderWidth / baseline.shoulderWidth
      : null;

  return { headGap, shoulderWidth, shoulderDy, headTiltDeg, distanceRatio };
}

/** Score a single frame's landmarks into per-metric and overall scores. */
export function scorePosture(
  landmarks: Landmark[],
  baseline: Baseline | null,
): PostureResult {
  const metrics = computeMetrics(landmarks, baseline);

  // Slouch: prefer baseline-relative gap; fall back to absolute thresholds.
  let slouch: number;
  if (baseline && baseline.headGap > 0) {
    const ratio = metrics.headGap / baseline.headGap;
    slouch = rampUp(ratio, 0.88, 0.65);
  } else {
    slouch = rampUp(metrics.headGap, 0.24, 0.16);
  }

  // Distance: only meaningful once calibrated; neutral otherwise.
  const distance =
    metrics.distanceRatio == null
      ? 100
      : rampDown(metrics.distanceRatio, 1.1, 1.3);

  const shoulders = rampDown(metrics.shoulderDy, 0.03, 0.06);
  const tilt = rampDown(metrics.headTiltDeg, 5, 12);

  const subScores: Record<MetricKey, number> = {
    slouch,
    distance,
    shoulders,
    tilt,
  };

  const score = Math.round(
    (Object.keys(WEIGHTS) as MetricKey[]).reduce(
      (sum, key) => sum + subScores[key] * WEIGHTS[key],
      0,
    ),
  );

  const worstMetric = (Object.keys(subScores) as MetricKey[]).reduce(
    (worst, key) => (subScores[key] < subScores[worst] ? key : worst),
    "slouch" as MetricKey,
  );

  return {
    metrics,
    subScores,
    score,
    status: score >= GOOD_SCORE_THRESHOLD ? "good" : "bad",
    worstMetric,
  };
}

/** Human-readable coaching message for the worst-scoring metric. */
export const METRIC_MESSAGES: Record<MetricKey, string> = {
  slouch: "Sit up straight",
  distance: "You are leaning too close to the screen",
  shoulders: "Relax and level your shoulders",
  tilt: "Keep your head level",
};
