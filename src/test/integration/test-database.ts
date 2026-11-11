import { existsSync } from "node:fs";
import { createDb, type Database } from "@/db/client";
import { assertSafeTestDatabaseUrl } from "./database-guard";

/** Resolves the guarded integration-test database URL (loads .env locally; CI sets env). */
export function getTestDatabaseUrl(): string {
  if (existsSync(".env")) process.loadEnvFile(".env");
  return assertSafeTestDatabaseUrl(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
}

export function createTestDb(options?: Parameters<typeof createDb>[1]) {
  return createDb(getTestDatabaseUrl(), options);
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

class RollbackSignal extends Error {}

/**
 * Runs `fn` inside a transaction that is always rolled back, so tests leave no
 * data behind and cannot see each other's rows.
 */
export async function withRollback(db: Database, fn: (tx: Transaction) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await fn(tx);
      throw new RollbackSignal();
    });
  } catch (error) {
    if (!(error instanceof RollbackSignal)) throw error;
  }
}

/**
 * Asserts that `operation` fails with a specific PostgreSQL constraint. Runs it in
 * a savepoint so the surrounding test transaction stays usable afterwards.
 */
export async function expectConstraintViolation(
  tx: Transaction,
  constraint: string,
  operation: (sp: Transaction) => Promise<unknown>,
) {
  let caught: unknown;
  try {
    await tx.transaction(async (sp) => {
      await operation(sp);
    });
  } catch (error) {
    caught = error;
  }
  const actual = findConstraintName(caught);
  if (actual !== constraint) {
    throw new Error(
      `Expected violation of "${constraint}", got ${
        caught === undefined ? "no error" : `"${actual ?? String(caught)}"`
      }.`,
    );
  }
}

// Drizzle wraps driver errors; the pg error (with .constraint) is in the cause chain.
function findConstraintName(error: unknown): string | undefined {
  let current: unknown = error;
  while (current && typeof current === "object") {
    if ("constraint" in current && typeof current.constraint === "string") {
      return current.constraint;
    }
    current = "cause" in current ? current.cause : undefined;
  }
  return undefined;
}
