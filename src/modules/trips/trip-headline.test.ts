import { describe, expect, it } from "vitest";
import { tripHeadline } from "./trip-headline";

const trip = { startDate: "2026-11-15", endDate: "2026-11-21", dayCount: 7 };
const at = (today: string, status: Parameters<typeof tripHeadline>[0]["status"]) =>
  tripHeadline({ ...trip, today, status }).replace(/[  ]/g, " ");

describe("tripHeadline", () => {
  it("counts down before the trip", () => {
    expect(at("2026-10-28", "PLANNING")).toBe("Starts in 18 days");
    expect(at("2026-11-13", "UPCOMING")).toBe("Starts in 2 days");
    expect(at("2026-11-14", "UPCOMING")).toBe("Starts tomorrow");
  });

  it("shows the trip day while traveling", () => {
    expect(at("2026-11-15", "TRAVELING")).toBe("Day 1 of 7");
    expect(at("2026-11-17", "TRAVELING")).toBe("Day 3 of 7");
    expect(at("2026-11-21", "TRAVELING")).toBe("Day 7 of 7");
  });

  it("shows the end date once completed", () => {
    expect(at("2026-11-22", "COMPLETED")).toBe("Ended Nov 21, 2026");
  });

  it("stays sensible when an override disagrees with the dates (D7)", () => {
    // Marked TRAVELING before it starts: show the date range, not "Day -2".
    expect(at("2026-11-12", "TRAVELING")).toBe("Nov 15 – 21, 2026");
    // Marked UPCOMING but the start date has passed.
    expect(at("2026-11-16", "UPCOMING")).toBe("Starts Nov 15, 2026");
    // Marked COMPLETED early.
    expect(at("2026-11-17", "COMPLETED")).toBe("Completed");
  });
});
