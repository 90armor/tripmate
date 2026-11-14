import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./schemas";

const valid = { displayName: "Phyo", email: "phyo@example.com", password: "12345678" };

function errorsOf(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
}

describe("signUpSchema", () => {
  it("accepts valid input and normalises email to trimmed lowercase (D10)", () => {
    const result = signUpSchema.parse({ ...valid, email: "  Phyo.Travel@Example.COM " });
    expect(result.email).toBe("phyo.travel@example.com");
  });

  it("trims the display name and requires it", () => {
    expect(signUpSchema.parse({ ...valid, displayName: "  Phyo  " }).displayName).toBe("Phyo");
    expect(errorsOf(signUpSchema.safeParse({ ...valid, displayName: "   " }))).toEqual([
      "displayName",
    ]);
  });

  it("limits the display name to 100 characters", () => {
    expect(signUpSchema.safeParse({ ...valid, displayName: "a".repeat(100) }).success).toBe(true);
    expect(errorsOf(signUpSchema.safeParse({ ...valid, displayName: "a".repeat(101) }))).toEqual([
      "displayName",
    ]);
  });

  it("requires a valid email", () => {
    expect(errorsOf(signUpSchema.safeParse({ ...valid, email: "" }))).toContain("email");
    expect(errorsOf(signUpSchema.safeParse({ ...valid, email: "not-an-email" }))).toContain(
      "email",
    );
  });

  it("requires a password of 8 to 128 characters (D14)", () => {
    expect(errorsOf(signUpSchema.safeParse({ ...valid, password: "1234567" }))).toEqual([
      "password",
    ]);
    expect(signUpSchema.safeParse({ ...valid, password: "x".repeat(128) }).success).toBe(true);
    expect(errorsOf(signUpSchema.safeParse({ ...valid, password: "x".repeat(129) }))).toEqual([
      "password",
    ]);
  });

  it("does not trim passwords", () => {
    expect(signUpSchema.parse({ ...valid, password: " 1234567 " }).password).toBe(" 1234567 ");
  });

  it("reports every missing field", () => {
    expect(errorsOf(signUpSchema.safeParse({})).sort()).toEqual([
      "displayName",
      "email",
      "password",
    ]);
  });
});

describe("signInSchema", () => {
  it("normalises email and requires a password without a length rule", () => {
    const result = signInSchema.parse({ email: "A@B.CO", password: "x" });
    expect(result).toEqual({ email: "a@b.co", password: "x" });
    expect(errorsOf(signInSchema.safeParse({ email: "a@b.co", password: "" }))).toEqual([
      "password",
    ]);
  });
});
