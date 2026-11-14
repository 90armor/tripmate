import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { DbExecutor } from "../client";
import { currencies } from "../schema";
import type { CurrencySeed } from "./currencies";

/**
 * Idempotent currency upsert (CURRENT_TASK §4.7), in one transaction:
 *   - every listed code is inserted or updated and marked active;
 *   - codes already in the table but missing from the list are set
 *     active = false — never deleted, because trips (and later expenses)
 *     reference them.
 */
export async function upsertCurrencies(db: DbExecutor, list: readonly CurrencySeed[]) {
  if (list.length === 0) throw new Error("Refusing to seed an empty currency list.");
  const codes = list.map((c) => c.code);

  return db.transaction(async (tx) => {
    await tx
      .insert(currencies)
      .values(list.map((c) => ({ ...c, active: true })))
      .onConflictDoUpdate({
        target: currencies.code,
        set: {
          name: sql`excluded.name`,
          symbol: sql`excluded.symbol`,
          minorUnits: sql`excluded.minor_units`,
          active: sql`true`,
        },
      });

    const deactivated = await tx
      .update(currencies)
      .set({ active: false })
      // Only rows that are still active, so the result lists real changes.
      .where(and(notInArray(currencies.code, codes), eq(currencies.active, true)))
      .returning({ code: currencies.code });

    const [{ count } = { count: 0 }] = await tx
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(currencies)
      .where(inArray(currencies.code, codes));

    return { upserted: count, deactivated: deactivated.map((row) => row.code) };
  });
}
