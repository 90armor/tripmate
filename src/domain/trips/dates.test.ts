import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isValidDateString, todayInTimezone, tripDayCount } from "./dates";

describe("isValidDateString", () => {
  it.each(["2026-11-15", "2028-02-29", "2026-12-31", "2026-01-01"])("accepts %s", (value) => {
    expect(isValidDateString(value)).toBe(true);
  });

  it.each([
    "2026-02-29", // not a leap year
    "2026-02-30",
    "2026-13-01",
    "2026-00-10",
    "2026-04-31",
    "2026-11-5",
    "26-11-15",
    "2026/11/15",
    "2026-11-15T00:00:00Z",
    " 2026-11-15",
    "",
  ])("rejects %j", (value) => {
    expect(isValidDateString(value)).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month, year and leap-day boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
    expect(addDays("2027-03-01", -1)).toBe("2027-02-28");
    expect(addDays("2026-11-15", -14)).toBe("2026-11-01");
    expect(addDays("2026-11-15", 0)).toBe("2026-11-15");
  });

  it("is unaffected by DST transitions (whole calendar days)", () => {
    // US DST ends 2026-11-01, EU DST ends 2026-10-25.
    expect(addDays("2026-10-31", 2)).toBe("2026-11-02");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
  });

  it("throws on an invalid date", () => {
    expect(() => addDays("2026-02-30", 1)).toThrow(RangeError);
  });
});

describe("daysBetween", () => {
  it("counts calendar days in either direction", () => {
    expect(daysBetween("2026-11-15", "2026-11-21")).toBe(6);
    expect(daysBetween("2026-11-21", "2026-11-15")).toBe(-6);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });
});

describe("tripDayCount", () => {
  it("counts start and end days inclusively", () => {
    expect(tripDayCount("2026-11-15", "2026-11-21")).toBe(7);
    expect(tripDayCount("2026-12-30", "2027-01-02")).toBe(4);
  });

  it("is 1 for a one-day trip", () => {
    expect(tripDayCount("2026-11-15", "2026-11-15")).toBe(1);
  });

  it("rejects an end date before the start date", () => {
    expect(() => tripDayCount("2026-11-21", "2026-11-15")).toThrow(RangeError);
  });
});

describe("todayInTimezone", () => {
  // 2026-11-14 22:30 UTC: already Nov 15 in Tokyo/Auckland, still Nov 14 in the
  // Americas.
  const lateUtc = new Date("2026-11-14T22:30:00Z");
  // 2026-11-15 03:00 UTC: Nov 15 in UTC and Asia, still Nov 14 in LA/Honolulu.
  const earlyUtc = new Date("2026-11-15T03:00:00Z");

  it("uses the trip timezone, not UTC", () => {
    expect(todayInTimezone(lateUtc, "UTC")).toBe("2026-11-14");
    expect(todayInTimezone(lateUtc, "Asia/Tokyo")).toBe("2026-11-15");
    expect(todayInTimezone(lateUtc, "Pacific/Auckland")).toBe("2026-11-15");
    expect(todayInTimezone(earlyUtc, "UTC")).toBe("2026-11-15");
    expect(todayInTimezone(earlyUtc, "America/Los_Angeles")).toBe("2026-11-14");
    expect(todayInTimezone(earlyUtc, "Pacific/Honolulu")).toBe("2026-11-14");
  });

  it("handles half-hour and quarter-hour offsets", () => {
    // 18:20 UTC is 23:50 in Kolkata (+05:30) and 00:05 next day in Kathmandu (+05:45).
    const instant = new Date("2026-11-14T18:20:00Z");
    expect(todayInTimezone(instant, "Asia/Kolkata")).toBe("2026-11-14");
    expect(todayInTimezone(instant, "Asia/Kathmandu")).toBe("2026-11-15");
  });

  it("rejects an unknown timezone", () => {
    expect(() => todayInTimezone(lateUtc, "Mars/Olympus_Mons")).toThrow(RangeError);
  });
});
