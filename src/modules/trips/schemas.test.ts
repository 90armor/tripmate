import { describe, expect, it } from "vitest";
import { tripDetailsSchema } from "./schemas";

const valid = {
  name: "Tokyo Autumn Trip",
  destination: "Tokyo, Japan",
  startDate: "2026-11-15",
  endDate: "2026-11-21",
  timezone: "Asia/Tokyo",
  baseCurrency: "JPY",
};

function fieldErrors(input: unknown): Record<string, string> {
  const result = tripDetailsSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("tripDetailsSchema (Create Trip / Trip Settings)", () => {
  it("accepts valid input and trims text", () => {
    const result = tripDetailsSchema.parse({
      ...valid,
      name: "  Tokyo Autumn Trip ",
      destination: " Tokyo, Japan ",
      baseCurrency: " jpy ",
    });
    expect(result).toEqual(valid);
  });

  it("requires every field", () => {
    expect(Object.keys(fieldErrors({})).sort()).toEqual(
      ["baseCurrency", "destination", "endDate", "name", "startDate", "timezone"].sort(),
    );
    expect(fieldErrors({ ...valid, name: "   " })).toEqual({ name: "Enter a trip name" });
    expect(fieldErrors({ ...valid, destination: "" })).toEqual({
      destination: "Enter a destination",
    });
  });

  it("limits name and destination to 100 characters", () => {
    expect(fieldErrors({ ...valid, name: "a".repeat(100) })).toEqual({});
    expect(Object.keys(fieldErrors({ ...valid, name: "a".repeat(101) }))).toEqual(["name"]);
    expect(Object.keys(fieldErrors({ ...valid, destination: "a".repeat(101) }))).toEqual([
      "destination",
    ]);
  });

  it("rejects an end date before the start date, on the end date field", () => {
    expect(fieldErrors({ ...valid, startDate: "2026-11-21", endDate: "2026-11-15" })).toEqual({
      endDate: "End date can’t be before the start date",
    });
  });

  it("accepts a one-day trip and a trip already in progress or in the past", () => {
    expect(fieldErrors({ ...valid, startDate: "2026-11-15", endDate: "2026-11-15" })).toEqual({});
    expect(fieldErrors({ ...valid, startDate: "2020-01-01", endDate: "2030-01-01" })).toEqual({});
  });

  it("rejects impossible or malformed dates", () => {
    expect(fieldErrors({ ...valid, startDate: "2026-02-30" })).toEqual({
      startDate: "Enter a real date",
    });
    expect(fieldErrors({ ...valid, endDate: "21/11/2026" })).toEqual({
      endDate: "Enter a real date",
    });
  });

  it("requires a timezone from the runtime IANA list, with no default (D15)", () => {
    expect(fieldErrors({ ...valid, timezone: "" })).toEqual({ timezone: "Choose a timezone" });
    expect(fieldErrors({ ...valid, timezone: "Tokyo" })).toEqual({
      timezone: "Choose a timezone from the list",
    });
    expect(fieldErrors({ ...valid, timezone: "Asia/Yangon" })).toEqual({});
  });

  it("requires a three-letter currency code", () => {
    expect(fieldErrors({ ...valid, baseCurrency: "" })).toEqual({
      baseCurrency: "Choose a currency",
    });
    expect(fieldErrors({ ...valid, baseCurrency: "YEN!" })).toEqual({
      baseCurrency: "Choose a currency",
    });
  });
});
