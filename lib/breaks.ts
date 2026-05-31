// Break-reminder logic. Pure function for testability.

/** Remind the user to stretch after this much continuous work. */
export const BREAK_INTERVAL_MS = 50 * 60 * 1000;

interface BreakInput {
  sessionStart: number;
  lastReminderAt: number | null;
  now: number;
  intervalMs?: number;
}

/** Returns true when a break reminder is due. */
export function isBreakDue({
  sessionStart,
  lastReminderAt,
  now,
  intervalMs = BREAK_INTERVAL_MS,
}: BreakInput): boolean {
  const since = lastReminderAt ?? sessionStart;
  return now - since >= intervalMs;
}
