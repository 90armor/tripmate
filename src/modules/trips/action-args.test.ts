import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseArchiveArgs, parseTripIdArg } from "./action-args";

const TRIP_ID = randomUUID();

describe("parseTripIdArg", () => {
  it("accepts a UUID in either case", () => {
    expect(parseTripIdArg(TRIP_ID)).toBe(TRIP_ID);
    expect(parseTripIdArg(TRIP_ID.toUpperCase())).toBe(TRIP_ID.toUpperCase());
  });

  it.each(["", "not-a-uuid", `${TRIP_ID}x`, "../settings", 42, null, undefined, { id: TRIP_ID }])(
    "rejects %j",
    (value) => {
      expect(parseTripIdArg(value)).toBeNull();
    },
  );
});

describe("parseArchiveArgs", () => {
  it("accepts a UUID and a real boolean", () => {
    expect(parseArchiveArgs(TRIP_ID, true)).toEqual({ tripId: TRIP_ID, archived: true });
    expect(parseArchiveArgs(TRIP_ID, false)).toEqual({ tripId: TRIP_ID, archived: false });
  });

  it.each(["false", "true", "", 0, 1, null, undefined])(
    "rejects archived = %j (not a boolean)",
    (archived) => {
      expect(parseArchiveArgs(TRIP_ID, archived)).toBeNull();
    },
  );

  it("rejects a malformed trip id", () => {
    expect(parseArchiveArgs("not-a-uuid", true)).toBeNull();
  });
});
