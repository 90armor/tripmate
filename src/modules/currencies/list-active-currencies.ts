import { asc, eq } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { currencies } from "@/db/schema";

export type CurrencyOption = { readonly code: string; readonly name: string };

/** Currencies a trip may use as its base currency (CURRENT_TASK §4.3): active only. */
export async function listActiveCurrencies(db: DbExecutor): Promise<CurrencyOption[]> {
  return db
    .select({ code: currencies.code, name: currencies.name })
    .from(currencies)
    .where(eq(currencies.active, true))
    .orderBy(asc(currencies.code));
}
