import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createTestDb } from "../src/test/integration/test-database";

/**
 * Applies the committed migrations to the guarded test database (the same one
 * the integration suite uses) before the E2E run. Idempotent; never drops data.
 */
export default async function globalSetup() {
  const { db, pool } = createTestDb();
  try {
    await migrate(db, { migrationsFolder: "src/db/migrations" });
  } finally {
    await pool.end();
  }
}
