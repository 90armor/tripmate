import type { Logger } from "drizzle-orm";
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
export function createDb(connectionString: string, options: { logger?: Logger } = {}) {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema, logger: options.logger });
  return { db, pool };
}

export type Database = ReturnType<typeof createDb>["db"];

/** A transaction handle; nested `.transaction()` calls on it become savepoints. */
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * What application services and queries accept: the app client or an open
 * transaction. Lets integration tests run services inside a rolled-back
 * transaction without a separate code path.
 */
export type DbExecutor = Database | Transaction;
