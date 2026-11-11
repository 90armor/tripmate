/**
 * Idempotent seed for local development: `pnpm db:seed`.
 * Upserts reference data by primary key, so it is safe to run repeatedly.
 *
 * Tooling script (not application code): reads .env directly and only needs
 * DATABASE_URL, so it does not require auth configuration.
 */
import { existsSync } from "node:fs";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "../client";
import { currencies } from "../schema";
import { DEV_TEST_CURRENCIES } from "./currencies";

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");

  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: this seed contains development/test data only.");
  }

  const parsed = z.url().safeParse(process.env.DATABASE_URL);
  if (!parsed.success) {
    throw new Error("DATABASE_URL is missing or invalid. See .env.example.");
  }

  const { db, pool } = createDb(parsed.data);
  try {
    await db
      .insert(currencies)
      .values([...DEV_TEST_CURRENCIES])
      .onConflictDoUpdate({
        target: currencies.code,
        set: {
          name: sql`excluded.name`,
          symbol: sql`excluded.symbol`,
          minorUnits: sql`excluded.minor_units`,
          active: sql`excluded.active`,
        },
      });
    console.log(`Seeded ${DEV_TEST_CURRENCIES.length} development currencies (upsert).`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
