import { describe, expect, it } from "vitest";
import { DEFAULT_SIGNED_IN_PATH, safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/trips", "/trips"],
    [
      "/trips/6f1c0a2e-0000-4000-8000-000000000000/settings",
      "/trips/6f1c0a2e-0000-4000-8000-000000000000/settings",
    ],
    ["/trips?tab=archived#top", "/trips?tab=archived#top"],
    ["/", "/"],
  ])("keeps the same-origin path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ["absolute https URL", "https://evil.example/trips"],
    ["absolute http URL", "http://evil.example"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,hi"],
    ["protocol-relative", "//evil.example/trips"],
    ["protocol-relative with extra slashes", "///evil.example"],
    ["backslash host", "/\\evil.example"],
    ["double backslash", "\\\\evil.example"],
    ["tab-smuggled", "/\t/evil.example"],
    ["newline-smuggled", "/\n/evil.example"],
    ["relative path without leading slash", "trips"],
    ["empty string", ""],
  ])("rejects %s", (_name, input) => {
    expect(safeRedirectPath(input)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("rejects non-string values such as repeated query params", () => {
    expect(safeRedirectPath(["/trips", "//evil.example"])).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_SIGNED_IN_PATH);
    expect(safeRedirectPath(null)).toBe(DEFAULT_SIGNED_IN_PATH);
  });

  it("does not treat percent-encoded slashes as a new host", () => {
    // "/%2F%2Fevil" stays a path on our origin.
    expect(safeRedirectPath("/%2F%2Fevil.example")).toBe("/%2F%2Fevil.example");
  });

  it("uses the given fallback", () => {
    expect(safeRedirectPath("https://evil.example", "/sign-in")).toBe("/sign-in");
  });
});
