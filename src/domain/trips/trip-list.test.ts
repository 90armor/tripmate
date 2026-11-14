import { describe, expect, it } from "vitest";
import type { TripStatus } from "./status";
import { groupTripsForList } from "./trip-list";

type Trip = {
  name: string;
  status: TripStatus;
  archived: boolean;
  startDate: string;
  endDate: string;
};

const trip = (
  name: string,
  status: TripStatus,
  startDate: string,
  endDate: string,
  archived = false,
): Trip => ({ name, status, archived, startDate, endDate });

const names = (trips: Trip[]) => trips.map((t) => t.name);

describe("groupTripsForList", () => {
  it("groups by effective status: Current, Upcoming (UPCOMING + PLANNING), Completed", () => {
    const groups = groupTripsForList([
      trip("Tokyo", "TRAVELING", "2026-11-10", "2026-11-20"),
      trip("Bangkok", "UPCOMING", "2026-11-20", "2026-11-22"),
      trip("Seoul", "COMPLETED", "2026-05-01", "2026-05-05"),
      trip("Lisbon", "PLANNING", "2027-04-01", "2027-04-10"),
    ]);
    expect(names(groups.current)).toEqual(["Tokyo"]);
    expect(names(groups.upcoming)).toEqual(["Bangkok", "Lisbon"]);
    expect(names(groups.completed)).toEqual(["Seoul"]);
    expect(groups.archived).toEqual([]);
  });

  it("puts archived trips in Archived regardless of status (D16)", () => {
    const groups = groupTripsForList([
      trip("Old Tokyo", "TRAVELING", "2026-11-10", "2026-11-20", true),
      trip("Old Seoul", "COMPLETED", "2025-05-01", "2025-05-05", true),
      trip("Old Plan", "PLANNING", "2027-04-01", "2027-04-10", true),
    ]);
    expect(groups.current).toEqual([]);
    expect(groups.upcoming).toEqual([]);
    expect(groups.completed).toEqual([]);
    expect(names(groups.archived)).toEqual(["Old Plan", "Old Tokyo", "Old Seoul"]);
  });

  it("orders upcoming soonest first and completed most recent first", () => {
    const groups = groupTripsForList([
      trip("Later", "PLANNING", "2027-06-01", "2027-06-05"),
      trip("Sooner", "UPCOMING", "2026-11-20", "2026-11-25"),
      trip("Last year", "COMPLETED", "2025-03-01", "2025-03-04"),
      trip("Last month", "COMPLETED", "2026-10-01", "2026-10-04"),
    ]);
    expect(names(groups.upcoming)).toEqual(["Sooner", "Later"]);
    expect(names(groups.completed)).toEqual(["Last month", "Last year"]);
  });

  it("keeps input order for equal dates and handles an empty list", () => {
    const groups = groupTripsForList([
      trip("A", "PLANNING", "2027-01-01", "2027-01-02"),
      trip("B", "PLANNING", "2027-01-01", "2027-01-02"),
    ]);
    expect(names(groups.upcoming)).toEqual(["A", "B"]);
    expect(groupTripsForList([])).toEqual({
      current: [],
      upcoming: [],
      completed: [],
      archived: [],
    });
  });
});
