import { describe, expect, it } from "vitest";
import { cx } from "./cx";

describe("cx", () => {
  it("joins class names with single spaces", () => {
    expect(cx("a", "b c", "d")).toBe("a b c d");
  });

  it("skips falsy values so conditional classes read naturally", () => {
    const hasError = false;
    expect(cx("base", hasError && "border-danger", null, undefined, "", "end")).toBe("base end");
  });

  it("returns an empty string when nothing applies", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
