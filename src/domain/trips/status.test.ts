import { describe, expect, it } from "vitest";
import { addDays, todayInTimezone } from "./dates";
import { deriveTripStatus, effectiveTripStatus, TRIP_STATUSES, type TripStatus } from "./status";

// Tokyo Autumn Trip: Nov 15 – Nov 21 2026.
const START = "2026-11-15";
const END = "2026-11-21";
const statusOn = (today: string) => deriveTripStatus(START, END, today);

describe("deriveTripStatus (ROADMAP D7, D12)", () => {
  it("14-day boundary: day 15 before start is PLANNING, day 14 before is UPCOMING", () => {
    expect(addDays(START, -15)).toBe("2026-10-31");
    expect(statusOn("2026-10-31")).toBe("PLANNING");
    expect(statusOn("2026-11-01")).toBe("UPCOMING");
  });

  it("is PLANNING long before the trip and UPCOMING the day before start", () => {
    expect(statusOn("2026-01-01")).toBe("PLANNING");
    expect(statusOn("2026-11-14")).toBe("UPCOMING");
  });

  it("is TRAVELING on the start day, mid-trip, and the end day", () => {
    expect(statusOn(START)).toBe("TRAVELING");
    expect(statusOn("2026-11-18")).toBe("TRAVELING");
    expect(statusOn(END)).toBe("TRAVELING");
  });

  it("is COMPLETED the day after the end date", () => {
    expect(statusOn("2026-11-22")).toBe("COMPLETED");
    expect(statusOn("2027-06-01")).toBe("COMPLETED");
  });

  it("handles a one-day trip", () => {
    const day = "2026-12-24";
    expect(deriveTripStatus(day, day, "2026-12-09")).toBe("PLANNING");
    expect(deriveTripStatus(day, day, "2026-12-10")).toBe("UPCOMING");
    expect(deriveTripStatus(day, day, "2026-12-23")).toBe("UPCOMING");
    expect(deriveTripStatus(day, day, day)).toBe("TRAVELING");
    expect(deriveTripStatus(day, day, "2026-12-25")).toBe("COMPLETED");
  });

  it("counts the 14-day window across a year boundary", () => {
    expect(deriveTripStatus("2027-01-05", "2027-01-10", "2026-12-22")).toBe("UPCOMING");
    expect(deriveTripStatus("2027-01-05", "2027-01-10", "2026-12-21")).toBe("PLANNING");
  });

  it("uses today in the trip timezone, where it differs from UTC", () => {
    // 2026-11-14 22:30 UTC is already Nov 15 (the start day) in Tokyo.
    const now = new Date("2026-11-14T22:30:00Z");
    expect(statusOn(todayInTimezone(now, "UTC"))).toBe("UPCOMING");
    expect(statusOn(todayInTimezone(now, "Asia/Tokyo"))).toBe("TRAVELING");
    // 2026-11-22 05:00 UTC is still Nov 21 (the last day) in Los Angeles.
    const later = new Date("2026-11-22T05:00:00Z");
    expect(statusOn(todayInTimezone(later, "UTC"))).toBe("COMPLETED");
    expect(statusOn(todayInTimezone(later, "America/Los_Angeles"))).toBe("TRAVELING");
  });

  it("rejects invalid dates and an end before the start", () => {
    expect(() => deriveTripStatus("2026-02-30", END, START)).toThrow(RangeError);
    expect(() => deriveTripStatus(START, END, "not-a-date")).toThrow(RangeError);
    expect(() => deriveTripStatus(END, START, START)).toThrow(RangeError);
  });
});

describe("effectiveTripStatus (ROADMAP D7)", () => {
  it("uses the derived status when no override is set", () => {
    for (const derived of TRIP_STATUSES) expect(effectiveTripStatus(derived, null)).toBe(derived);
  });

  it("lets a set override win over every derived status", () => {
    for (const derived of TRIP_STATUSES) {
      for (const override of TRIP_STATUSES) {
        expect(effectiveTripStatus(derived, override)).toBe(override);
      }
    }
  });

  it("returns to the derived status once the override is cleared", () => {
    let override: TripStatus | null = "COMPLETED";
    expect(effectiveTripStatus("TRAVELING", override)).toBe("COMPLETED");
    override = null;
    expect(effectiveTripStatus("TRAVELING", override)).toBe("TRAVELING");
  });
});
