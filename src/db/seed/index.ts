/**
 * Reference-data seed: `pnpm db:seed`. Idempotent; safe to run repeatedly.
 *
 * Tooling script (not application code): reads .env directly and only needs
 * DATABASE_URL, so it does not require auth configuration.
 */
import { existsSync } from "node:fs";
import { z } from "zod";
import { createDb } from "../client";
import { ISO_4217_CURRENCIES, ISO_4217_SOURCE } from "./currencies";
import { upsertCurrencies } from "./seed-currencies";

async function main() {
  if (existsSync(".env")) process.loadEnvFile(".env");

  // The data is canonical now, but production seeding stays a deliberate,
  // controlled step (ARCHITECTURE §75) until the deployment milestone defines it.
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed with NODE_ENV=production; production seeding is not set up.");
  }

  const parsed = z.url().safeParse(process.env.DATABASE_URL);
  if (!parsed.success) {
    throw new Error("DATABASE_URL is missing or invalid. See .env.example.");
  }

  const { db, pool } = createDb(parsed.data);
  try {
    const result = await upsertCurrencies(db, ISO_4217_CURRENCIES);
    console.log(
      `Seeded ${result.upserted} ISO 4217 currencies (List One, published ${ISO_4217_SOURCE.publishedOn}).` +
        (result.deactivated.length ? ` Deactivated: ${result.deactivated.join(", ")}.` : ""),
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
