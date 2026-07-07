import { format, formatDistanceStrict, isValid, parse } from "date-fns";

/** "8:30 PM" from a Date. */
export function formatClockTime(date: Date): string {
  return format(date, "h:mm a");
}

/** "8:30 PM" from a Postgres time string like "20:30:00". */
export function formatTimeString(time: string | null): string | null {
  if (!time) return null;
  const parsed = parse(time, "HH:mm:ss", new Date());
  if (!isValid(parsed)) {
    const short = parse(time, "HH:mm", new Date());
    return isValid(short) ? format(short, "h:mm a") : null;
  }
  return format(parsed, "h:mm a");
}

/** "Sat 12 Jul" from a Postgres date string like "2026-07-12". */
export function formatEventDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = parse(date, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? format(parsed, "EEE d MMM") : null;
}

/** "12 min" / "1 hr 5 min" from a minute count. */
export function formatMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

/** "in 12 min" style relative label from now to a future Date. */
export function formatRelativeTo(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 30_000) return "now";
  return `in ${formatDistanceStrict(date, now)}`;
}
