import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EnvValidationError, EXAMPLE_AUTH_SECRET_PLACEHOLDER, parseServerEnv } from "./env-schema";

const validEnv = {
  DATABASE_URL: "postgres://tripmate:tripmate@127.0.0.1:5433/tripmate",
  BETTER_AUTH_SECRET: "a-sufficiently-long-test-secret-value-0123456789",
  BETTER_AUTH_URL: "http://localhost:3000",
};

function problemsFor(source: Record<string, string | undefined>): readonly string[] {
  try {
    parseServerEnv(source);
  } catch (error) {
    if (error instanceof EnvValidationError) return error.problems;
    throw error;
  }
  throw new Error("expected parseServerEnv to throw");
}

describe("parseServerEnv", () => {
  it("accepts a complete configuration and defaults NODE_ENV to development", () => {
    expect(parseServerEnv(validEnv)).toEqual({ ...validEnv, NODE_ENV: "development" });
  });

  it("accepts postgresql:// as well as postgres://", () => {
    const env = parseServerEnv({
      ...validEnv,
      DATABASE_URL: "postgresql://u:p@db.internal:5432/tripmate",
    });
    expect(env.DATABASE_URL).toBe("postgresql://u:p@db.internal:5432/tripmate");
  });

  it("names every missing variable", () => {
    expect(problemsFor({})).toEqual([
      "DATABASE_URL: is required",
      "BETTER_AUTH_SECRET: is required",
      "BETTER_AUTH_URL: is required",
    ]);
  });

  it("treats DEV_ALLOWED_ORIGINS as optional and validates it only when present", () => {
    expect(parseServerEnv(validEnv).DEV_ALLOWED_ORIGINS).toBeUndefined();
    expect(parseServerEnv({ ...validEnv, DEV_ALLOWED_ORIGINS: "192.168.1.20" })).toMatchObject({
      DEV_ALLOWED_ORIGINS: "192.168.1.20",
    });
    expect(problemsFor({ ...validEnv, DEV_ALLOWED_ORIGINS: "http://192.168.1.20:3000" })).toEqual([
      "DEV_ALLOWED_ORIGINS: entry 1 must be a hostname such as 192.168.1.20 (no http://, port or path)",
    ]);
  });

  it("rejects a non-postgres database URL", () => {
    expect(problemsFor({ ...validEnv, DATABASE_URL: "mysql://u:p@localhost/tripmate" })).toEqual([
      "DATABASE_URL: must use the postgres:// or postgresql:// scheme",
    ]);
  });

  it("rejects an auth secret shorter than 32 characters", () => {
    expect(problemsFor({ ...validEnv, BETTER_AUTH_SECRET: "x".repeat(31) })).toEqual([
      "BETTER_AUTH_SECRET: must be at least 32 characters",
    ]);
  });

  it("rejects an invalid auth URL", () => {
    expect(problemsFor({ ...validEnv, BETTER_AUTH_URL: "localhost" })).toEqual([
      "BETTER_AUTH_URL: must be a valid URL",
    ]);
  });

  it("never includes variable values in the error message", () => {
    const secret = "short-but-very-secret";
    const dbPassword = "db-password-should-not-leak";
    try {
      parseServerEnv({
        DATABASE_URL: `mysql://user:${dbPassword}@localhost/x`,
        BETTER_AUTH_SECRET: secret,
        BETTER_AUTH_URL: "not a url",
      });
      expect.unreachable("expected a validation error");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain(secret);
      expect(message).not.toContain(dbPassword);
      expect(message).not.toContain("not a url");
    }
  });

  describe("the .env.example auth secret placeholder", () => {
    const placeholderRejected = [
      "BETTER_AUTH_SECRET: must not be the .env.example placeholder in production or when BETTER_AUTH_URL is not localhost",
    ];
    const withPlaceholder = { ...validEnv, BETTER_AUTH_SECRET: EXAMPLE_AUTH_SECRET_PLACEHOLDER };

    it("is accepted in development on localhost so a fresh checkout works", () => {
      const env = parseServerEnv(withPlaceholder);
      expect(env.BETTER_AUTH_SECRET).toBe(EXAMPLE_AUTH_SECRET_PLACEHOLDER);
    });

    it.each(["development", "test"])("is accepted in %s on 127.0.0.1", (NODE_ENV) => {
      const env = parseServerEnv({
        ...withPlaceholder,
        NODE_ENV,
        BETTER_AUTH_URL: "http://127.0.0.1:3100",
      });
      expect(env.BETTER_AUTH_SECRET).toBe(EXAMPLE_AUTH_SECRET_PLACEHOLDER);
    });

    it("is rejected in production, even on localhost", () => {
      expect(problemsFor({ ...withPlaceholder, NODE_ENV: "production" })).toEqual(
        placeholderRejected,
      );
    });

    it.each([
      ["development", "https://staging.tripmate.example"],
      ["test", "https://preview-42.tripmate.example"],
      ["development", "http://localhost.tripmate.example"],
      ["development", "http://192.168.1.20:3000"],
    ])("is rejected in %s when BETTER_AUTH_URL is %s", (NODE_ENV, BETTER_AUTH_URL) => {
      expect(problemsFor({ ...withPlaceholder, NODE_ENV, BETTER_AUTH_URL })).toEqual(
        placeholderRejected,
      );
    });

    it("still allows a real secret in production", () => {
      expect(parseServerEnv({ ...validEnv, NODE_ENV: "production" }).NODE_ENV).toBe("production");
    });

    it("still allows a real secret on a non-localhost URL", () => {
      const env = parseServerEnv({
        ...validEnv,
        BETTER_AUTH_URL: "https://staging.tripmate.example",
      });
      expect(env.BETTER_AUTH_URL).toBe("https://staging.tripmate.example");
    });

    it("matches the value actually shipped in .env.example", () => {
      const example = readFileSync(".env.example", "utf8");
      const line = example.split("\n").find((l) => l.startsWith("BETTER_AUTH_SECRET="));
      expect(line).toBe(`BETTER_AUTH_SECRET=${EXAMPLE_AUTH_SECRET_PLACEHOLDER}`);
    });
  });
});
