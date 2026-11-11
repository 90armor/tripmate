import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createTestDb } from "./test-database";

/**
 * Applies the committed migrations to the guarded test database before the
 * integration suite. Idempotent; never drops anything. On a fresh database (CI)
 * this also proves the migrations apply from empty.
 */
export default async function setup() {
  const { db, pool } = createTestDb();
  try {
    await migrate(db, { migrationsFolder: "src/db/migrations" });
  } finally {
    await pool.end();
  }
}
