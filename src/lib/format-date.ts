import { isValidDateString, type DateString } from "@/domain/trips/dates";

/*
 * Display formatting for date-only values (DESIGN_SYSTEM §84). English only for
 * now; localisation comes later.
 *
 * A date-only string is turned into UTC midnight and formatted in UTC, so the
 * printed day is the stored day for every server and viewer timezone.
 */

const RANGE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function utcMidnight(date: DateString): Date {
  if (!isValidDateString(date)) throw new RangeError(`Invalid calendar date: "${date}"`);
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const result = new Date(0);
  result.setUTCFullYear(year, month - 1, day);
  return result;
}

/** "Nov 15 – 21, 2026", "Dec 30, 2026 – Jan 2, 2027", or "Nov 15, 2026" for one day. */
export function formatDateRange(startDate: DateString, endDate: DateString): string {
  return RANGE_FORMAT.formatRange(utcMidnight(startDate), utcMidnight(endDate));
}
