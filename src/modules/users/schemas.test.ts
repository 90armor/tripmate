import { describe, expect, it } from "vitest";
import { profileSchema } from "./schemas";

describe("profileSchema", () => {
  it("trims and accepts a display name", () => {
    expect(profileSchema.parse({ displayName: "  Su  " })).toEqual({ displayName: "Su" });
  });

  it("rejects a blank or over-long display name", () => {
    expect(profileSchema.safeParse({ displayName: "   " }).success).toBe(false);
    expect(profileSchema.safeParse({ displayName: "a".repeat(101) }).success).toBe(false);
  });

  it("drops any submitted email: email is read-only (D18)", () => {
    expect(profileSchema.parse({ displayName: "Su", email: "new@example.com" })).toEqual({
      displayName: "Su",
    });
  });
});
