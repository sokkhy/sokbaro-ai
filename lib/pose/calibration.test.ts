import { describe, expect, it } from "vitest";

import { POSE } from "./landmarks";
import {
  addCalibrationSample,
  createCalibrationState,
  finalizeCalibration,
} from "./calibration";
import type { Landmark } from "./types";

function poseWith(headGap: number, shoulderWidth: number): Landmark[] {
  const arr: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0 }));
  const shoulderY = 0.5;
  arr[POSE.NOSE] = { x: 0.5, y: shoulderY - headGap, z: 0 };
  arr[POSE.LEFT_SHOULDER] = { x: 0.5 + shoulderWidth / 2, y: shoulderY, z: 0 };
  arr[POSE.RIGHT_SHOULDER] = { x: 0.5 - shoulderWidth / 2, y: shoulderY, z: 0 };
  arr[POSE.LEFT_EAR] = { x: 0.55, y: shoulderY - headGap, z: 0 };
  arr[POSE.RIGHT_EAR] = { x: 0.45, y: shoulderY - headGap, z: 0 };
  return arr;
}

describe("calibration", () => {
  it("returns null with too few samples", () => {
    let state = createCalibrationState();
    state = addCalibrationSample(state, poseWith(0.3, 0.3));
    expect(finalizeCalibration(state)).toBeNull();
  });

  it("averages samples into a baseline", () => {
    let state = createCalibrationState();
    for (let i = 0; i < 10; i++) {
      state = addCalibrationSample(state, poseWith(0.3, 0.28));
    }
    const baseline = finalizeCalibration(state);
    expect(baseline).not.toBeNull();
    expect(baseline!.headGap).toBeCloseTo(0.3, 5);
    expect(baseline!.shoulderWidth).toBeCloseTo(0.28, 5);
  });
});
