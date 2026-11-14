import { migrate } from "drizzle-orm/node-postgres/migrator";
import { ISO_4217_CURRENCIES } from "../src/db/seed/currencies";
import { upsertCurrencies } from "../src/db/seed/seed-currencies";
import { createTestDb } from "../src/test/integration/test-database";

/**
 * Prepares the guarded test database (the same one the integration suite uses)
 * before the E2E run: applies committed migrations and upserts the ISO 4217
 * currencies that Create Trip offers. Idempotent; never drops data.
 */
export default async function globalSetup() {
  const { db, pool } = createTestDb();
  try {
    await migrate(db, { migrationsFolder: "src/db/migrations" });
    await upsertCurrencies(db, ISO_4217_CURRENCIES);
  } finally {
    await pool.end();
  }
}
