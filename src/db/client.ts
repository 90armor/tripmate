import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Creates a Drizzle client over a pg connection pool. Takes the URL explicitly so
 * scripts and integration tests choose their database deliberately; the app
 * singleton in ./index.ts uses the validated DATABASE_URL.
 *
 * pg returns NUMERIC as strings, which keeps future money values exact
 * (never parse them with Number()).
 */
export function createDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

export type Database = ReturnType<typeof createDb>["db"];
