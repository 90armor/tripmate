import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Tooling config (not application code): load .env for drizzle-kit commands.
// `generate` needs no database; `migrate` and `studio` do.
if (existsSync(".env")) process.loadEnvFile(".env");

const needsDatabase = process.argv.some((arg) => ["migrate", "studio"].includes(arg));
const url = process.env.DATABASE_URL;
if (needsDatabase && !url) {
  throw new Error("DATABASE_URL is required for drizzle-kit migrate/studio. See .env.example.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: { url: url ?? "" },
  strict: true,
  verbose: true,
});
