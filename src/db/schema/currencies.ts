import { sql } from "drizzle-orm";
import { boolean, char, check, pgTable, smallint, varchar } from "drizzle-orm/pg-core";

/**
 * Currency reference data (DATABASE §16), keyed by ISO 4217 code.
 * `minor_units` drives deterministic rounding: JPY 0, USD 2, KWD 3.
 */
export const currencies = pgTable(
  "currencies",
  {
    code: char("code", { length: 3 }).primaryKey(),
    name: varchar("name").notNull(),
    symbol: varchar("symbol"),
    minorUnits: smallint("minor_units").notNull(),
    active: boolean("active").notNull().default(true),
  },
  (t) => [
    check("currencies_code_format", sql`${t.code} ~ '^[A-Z]{3}$'`),
    // ISO 4217 minor units are 0-4 (e.g. CLF uses 4).
    check("currencies_minor_units_range", sql`${t.minorUnits} BETWEEN 0 AND 4`),
  ],
);
