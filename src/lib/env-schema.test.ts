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
    it("is accepted in development so a fresh checkout works", () => {
      const env = parseServerEnv({
        ...validEnv,
        BETTER_AUTH_SECRET: EXAMPLE_AUTH_SECRET_PLACEHOLDER,
      });
      expect(env.BETTER_AUTH_SECRET).toBe(EXAMPLE_AUTH_SECRET_PLACEHOLDER);
    });

    it("is rejected in production", () => {
      expect(
        problemsFor({
          ...validEnv,
          NODE_ENV: "production",
          BETTER_AUTH_SECRET: EXAMPLE_AUTH_SECRET_PLACEHOLDER,
        }),
      ).toEqual(["BETTER_AUTH_SECRET: must not be the .env.example placeholder in production"]);
    });

    it("still allows a real secret in production", () => {
      expect(parseServerEnv({ ...validEnv, NODE_ENV: "production" }).NODE_ENV).toBe("production");
    });

    it("matches the value actually shipped in .env.example", () => {
      const example = readFileSync(".env.example", "utf8");
      const line = example.split("\n").find((l) => l.startsWith("BETTER_AUTH_SECRET="));
      expect(line).toBe(`BETTER_AUTH_SECRET=${EXAMPLE_AUTH_SECRET_PLACEHOLDER}`);
    });
  });
});
