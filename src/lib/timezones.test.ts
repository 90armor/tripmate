import { describe, expect, it } from "vitest";
import { isSupportedTimeZone, listTimeZones } from "./timezones";

describe("listTimeZones (ROADMAP D15)", () => {
  const zones = listTimeZones();

  it("is sorted, unique, and includes UTC", () => {
    expect([...zones].sort()).toEqual(zones);
    expect(new Set(zones).size).toBe(zones.length);
    expect(zones).toContain("UTC");
    expect(zones.length).toBeGreaterThan(300);
  });

  it("uses current IANA names instead of legacy ICU spellings", () => {
    for (const current of ["Asia/Yangon", "Asia/Kolkata", "Asia/Ho_Chi_Minh", "Europe/Kyiv"]) {
      expect(zones).toContain(current);
    }
    for (const legacy of ["Asia/Rangoon", "Asia/Calcutta", "Asia/Saigon", "Europe/Kiev"]) {
      expect(zones).not.toContain(legacy);
    }
  });

  it("only offers names the runtime accepts", () => {
    for (const zone of zones) {
      expect(() => new Intl.DateTimeFormat("en-US", { timeZone: zone }), zone).not.toThrow();
    }
  });
});

describe("isSupportedTimeZone", () => {
  it.each(["Asia/Tokyo", "Asia/Yangon", "Europe/Paris", "America/Los_Angeles", "UTC"])(
    "accepts %s",
    (zone) => {
      expect(isSupportedTimeZone(zone)).toBe(true);
    },
  );

  it.each(["", "asia/tokyo", "Asia/Tokyo ", "Mars/Olympus_Mons", "Tokyo", "GMT+9", "Asia/Rangoon"])(
    "rejects %j",
    (zone) => {
      expect(isSupportedTimeZone(zone)).toBe(false);
    },
  );
});
