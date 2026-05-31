// Baseline calibration: averages a few seconds of "sit normally" frames.

import { computeMetrics } from "./scoring";
import type { Baseline, Landmark } from "./types";

export interface CalibrationState {
  headGapSum: number;
  shoulderWidthSum: number;
  samples: number;
}

export const CALIBRATION_DURATION_MS = 3000;
const MIN_SAMPLES = 5;

export function createCalibrationState(): CalibrationState {
  return { headGapSum: 0, shoulderWidthSum: 0, samples: 0 };
}

/** Fold one frame of landmarks into the running calibration state. */
export function addCalibrationSample(
  state: CalibrationState,
  landmarks: Landmark[],
): CalibrationState {
  const { headGap, shoulderWidth } = computeMetrics(landmarks, null);
  return {
    headGapSum: state.headGapSum + headGap,
    shoulderWidthSum: state.shoulderWidthSum + shoulderWidth,
    samples: state.samples + 1,
  };
}

/** Produce a Baseline from accumulated samples, or null if too few. */
export function finalizeCalibration(state: CalibrationState): Baseline | null {
  if (state.samples < MIN_SAMPLES) return null;
  return {
    headGap: state.headGapSum / state.samples,
    shoulderWidth: state.shoulderWidthSum / state.samples,
  };
}
