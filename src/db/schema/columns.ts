import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";

/** Standard audit fields (DATABASE §5, §58): TIMESTAMPTZ, defaulted by the database. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/**
 * `column IN ('A', 'B')` for CHECK constraints built from a TypeScript constant,
 * so allowed codes have one source of truth (DATABASE §56: VARCHAR + CHECK).
 * Only ever used with compile-time constants, never user input.
 */
export function inList(column: AnyPgColumn, values: readonly string[]): SQL {
  const list = values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", ");
  return sql`${column} IN (${sql.raw(list)})`;
}
