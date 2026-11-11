import "server-only";
import { env } from "@/lib/env";
import { createDb } from "./client";

// Keep one pool across dev hot reloads so connections are not leaked.
const globalForDb = globalThis as unknown as { tripmateDb?: ReturnType<typeof createDb> };
const instance = globalForDb.tripmateDb ?? createDb(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.tripmateDb = instance;

/** Application database client. Server-only; never import from Client Components. */
export const db = instance.db;
