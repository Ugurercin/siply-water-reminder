// ─── Date Key Format: 'YYYY-MM-DD' ───────────────────────────────────────────

/**
 * Return today's date as a storage key string: 'YYYY-MM-DD'.
 */
export function todayKey(): string {
  return toDateKey(new Date());
}

/**
 * Convert a Date object to a 'YYYY-MM-DD' storage key.
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a 'YYYY-MM-DD' key back into a Date object (midnight local time).
 */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  // Fallback to epoch if parsing fails (should never happen with valid keys)
  if (year === undefined || month === undefined || day === undefined) {
    return new Date(0);
  }
  return new Date(year, month - 1, day);
}

/**
 * Return an array of date keys for the last N days (today first).
 * E.g. getLastNDayKeys(7) → ['2024-03-28', '2024-03-27', ..., '2024-03-22']
 */
export function getLastNDayKeys(n: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

/**
 * Check whether two Date objects represent the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check whether a date key is today.
 */
export function isToday(key: string): boolean {
  return key === todayKey();
}

/**
 * Format a date key for display: 'Mon, Mar 28'
 */
export function formatDayLabel(key: string): string {
  const date = fromDateKey(key);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format a timestamp ISO string to a readable time: '9:30 AM'
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Calculate the current streak (consecutive days where goalReached is true),
 * given a list of (goalReached, date key) pairs ordered most-recent first.
 *
 * The streak ends at the first day where the goal was not reached.
 * Today is excluded from breaking the streak if its goal hasn't been reached yet.
 */
export function calculateStreak(
  days: Array<{ dateKey: string; goalReached: boolean }>
): number {
  let streak = 0;
  const today = todayKey();

  for (const day of days) {
    // Skip today — we don't penalize for an incomplete current day
    if (day.dateKey === today) continue;
    if (day.goalReached) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
