import { describe, expect, it } from "vitest";

import { BREAK_INTERVAL_MS, isBreakDue } from "./breaks";

describe("isBreakDue", () => {
  it("is not due before the interval", () => {
    expect(
      isBreakDue({
        sessionStart: 0,
        lastReminderAt: null,
        now: BREAK_INTERVAL_MS - 1,
      }),
    ).toBe(false);
  });

  it("is due after the interval from session start", () => {
    expect(
      isBreakDue({ sessionStart: 0, lastReminderAt: null, now: BREAK_INTERVAL_MS }),
    ).toBe(true);
  });

  it("counts from the last reminder once one has fired", () => {
    const last = BREAK_INTERVAL_MS;
    expect(
      isBreakDue({
        sessionStart: 0,
        lastReminderAt: last,
        now: last + BREAK_INTERVAL_MS - 1,
      }),
    ).toBe(false);
    expect(
      isBreakDue({
        sessionStart: 0,
        lastReminderAt: last,
        now: last + BREAK_INTERVAL_MS,
      }),
    ).toBe(true);
  });
});
