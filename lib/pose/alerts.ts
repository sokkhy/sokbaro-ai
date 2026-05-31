// Debounce logic for posture alerts. Pure reducer for easy unit testing.

import type { MetricKey, PostureStatus } from "./types";

/** How long posture must stay bad before alerting. */
export const ALERT_HOLD_MS = 10_000;
/** Minimum gap between consecutive alerts. */
export const ALERT_COOLDOWN_MS = 20_000;

export interface AlertState {
  /** Timestamp when posture first turned bad in the current bad streak. */
  badSince: number | null;
  /** Timestamp of the last alert fired. */
  lastFiredAt: number | null;
}

export function createAlertState(): AlertState {
  return { badSince: null, lastFiredAt: null };
}

export interface AlertUpdate {
  state: AlertState;
  /** True only on the frame an alert should fire. */
  fired: boolean;
  /** Metric to message about when `fired` is true. */
  metric: MetricKey | null;
}

interface AlertInput {
  status: PostureStatus;
  worstMetric: MetricKey;
  now: number;
  holdMs?: number;
  cooldownMs?: number;
}

/** Advance the alert state by one frame. */
export function updateAlertState(
  state: AlertState,
  { status, worstMetric, now, holdMs = ALERT_HOLD_MS, cooldownMs = ALERT_COOLDOWN_MS }: AlertInput,
): AlertUpdate {
  // Recovered: clear the bad streak, keep cooldown memory.
  if (status === "good") {
    return { state: { ...state, badSince: null }, fired: false, metric: null };
  }

  // Start of a new bad streak.
  const badSince = state.badSince ?? now;
  const heldLongEnough = now - badSince >= holdMs;
  const offCooldown =
    state.lastFiredAt == null || now - state.lastFiredAt >= cooldownMs;

  if (heldLongEnough && offCooldown) {
    return {
      state: { badSince, lastFiredAt: now },
      fired: true,
      metric: worstMetric,
    };
  }

  return { state: { ...state, badSince }, fired: false, metric: null };
}
