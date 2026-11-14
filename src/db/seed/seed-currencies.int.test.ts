import { eq, inArray } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createTestDb, withRollback } from "@/test/integration/test-database";
import { currencies } from "../schema";
import { ISO_4217_CURRENCIES } from "./currencies";
import { upsertCurrencies } from "./seed-currencies";

const { db, pool } = createTestDb();
afterAll(() => pool.end());

const ISO_CODES = ISO_4217_CURRENCIES.map((c) => c.code);
// Every IsFund="true" code in List One (2026-09-17), including XAD (Arab Accounting Dinar).
const FUND_CODES = ["BOV", "CHE", "CHW", "CLF", "COU", "MXV", "USN", "UYI", "UYW", "XAD"];

describe("currency seed (ROADMAP D13, CURRENT_TASK §4.7)", () => {
  it("is idempotent: a second run changes nothing", async () => {
    await withRollback(db, async (tx) => {
      await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      const first = await tx.select().from(currencies).orderBy(currencies.code);
      const result = await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      const second = await tx.select().from(currencies).orderBy(currencies.code);

      expect(second).toEqual(first);
      expect(result.upserted).toBe(ISO_4217_CURRENCIES.length);
    });
  });

  // List One's only 4-minor-unit codes (CLF, UYW) are funds, now excluded (D13),
  // so the rounding classes in the data are 0, 2 and 3.
  it("stores the ISO minor units for each rounding class", async () => {
    await withRollback(db, async (tx) => {
      await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      const rows = await tx
        .select({
          code: currencies.code,
          minorUnits: currencies.minorUnits,
          active: currencies.active,
        })
        .from(currencies)
        .where(inArray(currencies.code, ["JPY", "USD", "EUR", "KWD"]))
        .orderBy(currencies.code);
      expect(rows).toEqual([
        { code: "EUR", minorUnits: 2, active: true },
        { code: "JPY", minorUnits: 0, active: true },
        { code: "KWD", minorUnits: 3, active: true },
        { code: "USD", minorUnits: 2, active: true },
      ]);
    });
  });

  it("leaves ISO fund codes out of the seeded data (D13)", async () => {
    await withRollback(db, async (tx) => {
      await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      const funds = await tx
        .select({ code: currencies.code, active: currencies.active })
        .from(currencies)
        .where(inArray(currencies.code, FUND_CODES));
      // Absent, or (on a database seeded before D13 changed) present but inactive.
      expect(funds.filter((row) => row.active)).toEqual([]);
    });
    for (const code of FUND_CODES) expect(ISO_CODES).not.toContain(code);
  });

  it("excludes codes without minor units (metals, testing, no-currency)", () => {
    for (const code of ["XAU", "XAG", "XPT", "XPD", "XDR", "XTS", "XXX"]) {
      expect(ISO_CODES).not.toContain(code);
    }
    expect(new Set(ISO_CODES).size).toBe(ISO_CODES.length);
  });

  it("deactivates codes missing from the list instead of deleting them, and reactivates them", async () => {
    await withRollback(db, async (tx) => {
      // A retired code left over from an older list (DEM was replaced by EUR).
      await tx
        .insert(currencies)
        .values({ code: "DEM", name: "Deutsche Mark", minorUnits: 2, active: true })
        .onConflictDoNothing();

      const result = await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      expect(result.deactivated).toContain("DEM");
      const [dem] = await tx.select().from(currencies).where(eq(currencies.code, "DEM"));
      expect(dem).toMatchObject({ code: "DEM", active: false });

      await upsertCurrencies(tx, [
        ...ISO_4217_CURRENCIES,
        { code: "DEM", name: "Deutsche Mark", symbol: null, minorUnits: 2 },
      ]);
      const [back] = await tx.select().from(currencies).where(eq(currencies.code, "DEM"));
      expect(back?.active).toBe(true);
    });
  });

  it("updates changed reference data on re-run", async () => {
    await withRollback(db, async (tx) => {
      await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      await tx
        .update(currencies)
        .set({ name: "Stale name", symbol: "¥", minorUnits: 2 })
        .where(eq(currencies.code, "JPY"));

      await upsertCurrencies(tx, ISO_4217_CURRENCIES);
      const [jpy] = await tx.select().from(currencies).where(eq(currencies.code, "JPY"));
      expect(jpy).toMatchObject({ name: "Yen", symbol: null, minorUnits: 0, active: true });
    });
  });

  it("refuses an empty list (which would deactivate everything)", async () => {
    await expect(upsertCurrencies(db, [])).rejects.toThrow(/empty/);
  });
});
