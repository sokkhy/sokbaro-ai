import { describe, expect, it } from "vitest";

import { POSE } from "./landmarks";
import { GOOD_SCORE_THRESHOLD, scorePosture } from "./scoring";
import type { Baseline, Landmark } from "./types";

// Build a 33-point landmark array, defaulting unused points to origin.
function makeLandmarks(overrides: Partial<Record<number, Landmark>>): Landmark[] {
  const arr: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
  }));
  for (const [idx, lm] of Object.entries(overrides)) {
    arr[Number(idx)] = lm!;
  }
  return arr;
}

// An upright, level, well-distanced pose.
function goodPose(): Landmark[] {
  return makeLandmarks({
    [POSE.NOSE]: { x: 0.5, y: 0.2, z: 0 },
    [POSE.LEFT_EAR]: { x: 0.58, y: 0.2, z: 0 },
    [POSE.RIGHT_EAR]: { x: 0.42, y: 0.2, z: 0 },
    [POSE.LEFT_SHOULDER]: { x: 0.65, y: 0.5, z: 0 },
    [POSE.RIGHT_SHOULDER]: { x: 0.35, y: 0.5, z: 0 },
  });
}

const baseline: Baseline = { headGap: 0.3, shoulderWidth: 0.3 };

describe("scorePosture", () => {
  it("rates an upright pose as good", () => {
    const result = scorePosture(goodPose(), baseline);
    expect(result.score).toBeGreaterThanOrEqual(GOOD_SCORE_THRESHOLD);
    expect(result.status).toBe("good");
  });

  it("flags slouching (head dropped toward shoulders)", () => {
    const lm = goodPose();
    // Nose drops close to the shoulder line -> small head gap.
    lm[POSE.NOSE] = { x: 0.5, y: 0.46, z: 0 };
    lm[POSE.LEFT_EAR] = { x: 0.58, y: 0.46, z: 0 };
    lm[POSE.RIGHT_EAR] = { x: 0.42, y: 0.46, z: 0 };
    const result = scorePosture(lm, baseline);
    expect(result.status).toBe("bad");
    expect(result.worstMetric).toBe("slouch");
  });

  it("flags leaning too close (shoulders much wider than baseline)", () => {
    const lm = goodPose();
    lm[POSE.LEFT_SHOULDER] = { x: 0.78, y: 0.5, z: 0 };
    lm[POSE.RIGHT_SHOULDER] = { x: 0.22, y: 0.5, z: 0 }; // width 0.56 vs 0.3
    const result = scorePosture(lm, baseline);
    expect(result.subScores.distance).toBe(0);
    expect(result.worstMetric).toBe("distance");
  });

  it("flags uneven shoulders", () => {
    const lm = goodPose();
    lm[POSE.LEFT_SHOULDER] = { x: 0.65, y: 0.45, z: 0 };
    lm[POSE.RIGHT_SHOULDER] = { x: 0.35, y: 0.56, z: 0 }; // dy = 0.11
    const result = scorePosture(lm, baseline);
    expect(result.subScores.shoulders).toBe(0);
  });

  it("flags head tilt", () => {
    const lm = goodPose();
    lm[POSE.LEFT_EAR] = { x: 0.58, y: 0.15, z: 0 };
    lm[POSE.RIGHT_EAR] = { x: 0.42, y: 0.27, z: 0 }; // clearly tilted
    const result = scorePosture(lm, baseline);
    expect(result.subScores.tilt).toBeLessThan(50);
  });

  it("treats distance as neutral before calibration", () => {
    const result = scorePosture(goodPose(), null);
    expect(result.metrics.distanceRatio).toBeNull();
    expect(result.subScores.distance).toBe(100);
  });
});
