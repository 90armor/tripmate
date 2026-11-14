/*
 * Calendar-date helpers for date-only values (DATABASE §6, FEATURES §42).
 *
 * Trip dates are `YYYY-MM-DD` strings end to end. They never pass through a
 * local-time JS Date: `new Date("2026-11-15")` is UTC midnight, which is still
 * Nov 14 for a viewer in Los Angeles. All arithmetic here works on whole UTC
 * days, where every calendar day is exactly 86 400 000 ms (UTC has no DST).
 */

/** A calendar date, `YYYY-MM-DD` (4-digit year). */
export type DateString = string;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Days since 1970-01-01 for a valid date string, otherwise null. */
function toEpochDay(value: string): number | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // setUTCFullYear, not Date.UTC: Date.UTC maps years 0–99 to 1900–1999.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  // Round-trip check rejects impossible dates such as 2026-02-30 (which Date
  // would silently roll over to March 2).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.round(date.getTime() / MS_PER_DAY);
}

function requireEpochDay(value: string): number {
  const day = toEpochDay(value);
  if (day === null) throw new RangeError(`Invalid calendar date: "${value}"`);
  return day;
}

function fromEpochDay(epochDay: number): DateString {
  const date = new Date(epochDay * MS_PER_DAY);
  const year = String(date.getUTCFullYear()).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True for a real calendar date in `YYYY-MM-DD` form. */
export function isValidDateString(value: string): boolean {
  return toEpochDay(value) !== null;
}

/** `date` shifted by `days` calendar days (negative goes back). */
export function addDays(date: DateString, days: number): DateString {
  return fromEpochDay(requireEpochDay(date) + days);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: DateString, to: DateString): number {
  return requireEpochDay(to) - requireEpochDay(from);
}

/**
 * Number of trip days, counting both the start and end date: Nov 15 – Nov 21 is
 * 7 days, and a one-day trip (start = end) is 1.
 */
export function tripDayCount(startDate: DateString, endDate: DateString): number {
  const span = daysBetween(startDate, endDate);
  if (span < 0) throw new RangeError("Trip end date is before its start date");
  return span + 1;
}

/**
 * The calendar date at instant `now` in an IANA timezone. Trip status is judged
 * against "today" in the trip's timezone, never the server's or the viewer's
 * (FEATURES §6, ROADMAP D12). Throws RangeError for an unknown timezone.
 */
export function todayInTimezone(now: Date, timeZone: string): DateString {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  // Built from parts rather than a locale's output format, which is not a contract.
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year").padStart(4, "0")}-${part("month")}-${part("day")}`;
}
