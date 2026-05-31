import { describe, expect, it } from "vitest";

import {
  ALERT_COOLDOWN_MS,
  ALERT_HOLD_MS,
  createAlertState,
  updateAlertState,
} from "./alerts";

describe("updateAlertState", () => {
  it("does not fire before the hold window elapses", () => {
    const state = createAlertState();
    const start = 1000;
    let last = updateAlertState(state, {
      status: "bad",
      worstMetric: "slouch",
      now: start,
    });
    expect(last.fired).toBe(false);

    last = updateAlertState(last.state, {
      status: "bad",
      worstMetric: "slouch",
      now: start + ALERT_HOLD_MS - 1,
    });
    expect(last.fired).toBe(false);
  });

  it("fires once after 10s of continuous bad posture", () => {
    let res = updateAlertState(createAlertState(), {
      status: "bad",
      worstMetric: "distance",
      now: 0,
    });
    res = updateAlertState(res.state, {
      status: "bad",
      worstMetric: "distance",
      now: ALERT_HOLD_MS,
    });
    expect(res.fired).toBe(true);
    expect(res.metric).toBe("distance");
  });

  it("resets the streak when posture recovers", () => {
    let res = updateAlertState(createAlertState(), {
      status: "bad",
      worstMetric: "slouch",
      now: 0,
    });
    res = updateAlertState(res.state, {
      status: "good",
      worstMetric: "slouch",
      now: 5000,
    });
    expect(res.state.badSince).toBeNull();

    // New bad streak must wait the full hold window again.
    res = updateAlertState(res.state, {
      status: "bad",
      worstMetric: "slouch",
      now: 6000,
    });
    res = updateAlertState(res.state, {
      status: "bad",
      worstMetric: "slouch",
      now: 6000 + ALERT_HOLD_MS - 1,
    });
    expect(res.fired).toBe(false);
  });

  it("respects the cooldown between alerts", () => {
    let res = updateAlertState(createAlertState(), {
      status: "bad",
      worstMetric: "slouch",
      now: 0,
    });
    res = updateAlertState(res.state, {
      status: "bad",
      worstMetric: "slouch",
      now: ALERT_HOLD_MS,
    });
    expect(res.fired).toBe(true);

    // Still bad, but within cooldown -> no refire.
    res = updateAlertState(res.state, {
      status: "bad",
      worstMetric: "slouch",
      now: ALERT_HOLD_MS + ALERT_COOLDOWN_MS - 1,
    });
    expect(res.fired).toBe(false);

    // Past cooldown -> fires again.
    res = updateAlertState(res.state, {
      status: "bad",
      worstMetric: "slouch",
      now: ALERT_HOLD_MS + ALERT_COOLDOWN_MS,
    });
    expect(res.fired).toBe(true);
  });
});
