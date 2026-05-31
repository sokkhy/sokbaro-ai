// Shared types for posture detection and scoring.

/** A single normalized pose landmark from MediaPipe (origin top-left, y grows down). */
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/** Personalized baseline captured while the user sits normally. */
export interface Baseline {
  /** shoulderMidY - noseY when sitting upright. */
  headGap: number;
  /** Horizontal distance between the shoulders when at a comfortable distance. */
  shoulderWidth: number;
}

export type MetricKey = "slouch" | "distance" | "shoulders" | "tilt";

export type PostureStatus = "good" | "bad";

/** Raw geometric measurements derived from landmarks. */
export interface PostureMetrics {
  /** Vertical gap between shoulder midpoint and the nose (larger = more upright). */
  headGap: number;
  /** Horizontal shoulder width (larger = closer to the camera). */
  shoulderWidth: number;
  /** Absolute vertical offset between the two shoulders (0 = level). */
  shoulderDy: number;
  /** Head tilt in degrees relative to horizontal (0 = level). */
  headTiltDeg: number;
  /** shoulderWidth / baseline.shoulderWidth (>1 means leaning closer). null until calibrated. */
  distanceRatio: number | null;
}

/** Full result of scoring a single frame. */
export interface PostureResult {
  metrics: PostureMetrics;
  /** Per-metric sub-scores in [0, 100]. */
  subScores: Record<MetricKey, number>;
  /** Overall posture score in [0, 100]. */
  score: number;
  status: PostureStatus;
  /** The metric with the lowest sub-score (drives alert messaging). */
  worstMetric: MetricKey;
}
