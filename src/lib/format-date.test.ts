import { describe, expect, it } from "vitest";
import { formatDateRange } from "./format-date";

// ICU separates ranges with thin spaces (U+2009) around the en dash; compare
// with ordinary spaces so the assertions stay readable.
const format = (start: string, end: string) =>
  formatDateRange(start, end).replace(/[\u2009\u202f]/g, " ");

describe("formatDateRange", () => {
  it("formats ranges without repeating the shared month or year", () => {
    expect(format("2026-11-15", "2026-11-21")).toBe("Nov 15 – 21, 2026");
    expect(format("2026-11-28", "2026-12-02")).toBe("Nov 28 – Dec 2, 2026");
    expect(format("2026-12-30", "2027-01-02")).toBe("Dec 30, 2026 – Jan 2, 2027");
  });

  it("formats a one-day trip as a single date", () => {
    expect(format("2026-11-15", "2026-11-15")).toBe("Nov 15, 2026");
  });

  it("is pinned to UTC, so the stored day is printed as-is", () => {
    // A local-time conversion in a negative-offset zone would print Nov 14.
    expect(format("2026-11-15", "2026-11-15")).not.toContain("14");
  });

  it("rejects invalid dates", () => {
    expect(() => formatDateRange("2026-02-30", "2026-03-01")).toThrow(RangeError);
  });
});
