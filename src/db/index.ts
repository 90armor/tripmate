import "server-only";
import { getEnv } from "@/lib/env";
import { createDb, type Database } from "./client";

// Keep one pool across dev hot reloads so connections are not leaked.
const globalForDb = globalThis as unknown as { tripmateDb?: ReturnType<typeof createDb> };

/**
 * Application database client. Server-only; never import from Client Components.
 * Created on first use so `next build` can import route modules without a
 * database URL (see getEnv()).
 */
export function getDb(): Database {
  if (!globalForDb.tripmateDb) {
    const env = getEnv();
    const instance = createDb(env.DATABASE_URL);
    // In production the module is never reloaded; caching on globalThis is harmless.
    globalForDb.tripmateDb = instance;
  }
  return globalForDb.tripmateDb.db;
}
