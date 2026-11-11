import { describe, expect, it } from "vitest";
import { assertSafeTestDatabaseUrl } from "./database-guard";

const app = "postgres://tripmate:secret-pw@127.0.0.1:5433/tripmate";
const test = "postgres://tripmate:secret-pw@127.0.0.1:5433/tripmate_test";

describe("assertSafeTestDatabaseUrl", () => {
  it("accepts a *_test database that differs from the app database", () => {
    expect(assertSafeTestDatabaseUrl(test, app)).toBe(test);
  });

  it("accepts a test database when DATABASE_URL is not set", () => {
    expect(assertSafeTestDatabaseUrl(test, undefined)).toBe(test);
  });

  it("refuses when TEST_DATABASE_URL is missing", () => {
    expect(() => assertSafeTestDatabaseUrl(undefined, app)).toThrow(/TEST_DATABASE_URL is not set/);
  });

  it("refuses a database whose name does not end in _test", () => {
    expect(() => assertSafeTestDatabaseUrl(app, undefined)).toThrow(/must end in "_test"/);
  });

  it("refuses when test and app URLs name the same database", () => {
    expect(() => assertSafeTestDatabaseUrl(test, test)).toThrow(/same database/);
  });

  it("treats a missing port as 5432 when comparing", () => {
    expect(() =>
      assertSafeTestDatabaseUrl("postgres://a@db:5432/x_test", "postgres://b@db/x_test"),
    ).toThrow(/same database/);
  });

  it("refuses non-postgres URLs", () => {
    expect(() => assertSafeTestDatabaseUrl("mysql://u@h/db_test", undefined)).toThrow(/scheme/);
  });

  it("never echoes credentials in its errors", () => {
    const messages: string[] = [];
    for (const [testUrl, appUrl] of [
      [app, undefined],
      [test, test],
    ] as const) {
      try {
        assertSafeTestDatabaseUrl(testUrl, appUrl);
      } catch (error) {
        messages.push((error as Error).message);
      }
    }
    expect(messages).toHaveLength(2);
    for (const message of messages) expect(message).not.toContain("secret-pw");
  });
});
