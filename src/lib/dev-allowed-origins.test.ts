import { describe, expect, it } from "vitest";
import { devAllowedOriginsProblems, parseDevAllowedOrigins } from "./dev-allowed-origins";

describe("parseDevAllowedOrigins", () => {
  it("is empty when unset or blank", () => {
    expect(parseDevAllowedOrigins(undefined)).toEqual([]);
    expect(parseDevAllowedOrigins("")).toEqual([]);
    expect(parseDevAllowedOrigins(" , ")).toEqual([]);
  });

  it("splits, trims and lower-cases hostnames", () => {
    expect(parseDevAllowedOrigins(" 192.168.18.159 , My-Mac.local,*.ngrok.app ")).toEqual([
      "192.168.18.159",
      "my-mac.local",
      "*.ngrok.app",
    ]);
    expect(parseDevAllowedOrigins("**.example.test")).toEqual(["**.example.test"]);
  });

  it.each([
    "http://192.168.18.159",
    "192.168.18.159:3000",
    "example.test/path",
    "exa mple.test",
    "-bad.test",
    "*",
  ])("rejects %j", (value) => {
    expect(devAllowedOriginsProblems(value)).toHaveLength(1);
    expect(() => parseDevAllowedOrigins(value)).toThrow(/DEV_ALLOWED_ORIGINS: entry 1 must be/);
  });

  it("names the bad entry by position without echoing it", () => {
    const problems = devAllowedOriginsProblems("192.168.1.2, http://secret-host:3000");
    expect(problems).toEqual([
      "entry 2 must be a hostname such as 192.168.1.20 (no http://, port or path)",
    ]);
    expect(problems.join()).not.toContain("secret-host");
  });
});
