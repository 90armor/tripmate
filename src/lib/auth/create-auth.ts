import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "@/db/client";
import { account, session, users, verification } from "@/db/schema";

/**
 * Better Auth configuration (ROADMAP D1, ARCHITECTURE §25-26).
 *
 * Better Auth handles authentication only. TripMate trip authorization never
 * lives in Better Auth hooks or callbacks (CURRENT_TASK §25).
 *
 * M1 scope (ROADMAP D14): email + password only, minimum length 8. No email
 * verification, password reset, or social login until an email provider exists.
 *
 * Built by a factory so integration tests can bind it to the test database;
 * the app instance lives in ./auth.ts, which adds the Next.js cookie plugin
 * (kept out of here so Vitest can import this file without Next.js).
 */
export function createAuth(config: {
  db: Database;
  secret: string;
  baseURL: string;
  plugins?: BetterAuthPlugin[];
}) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    plugins: config.plugins,
    database: drizzleAdapter(config.db, {
      provider: "pg",
      schema: { user: users, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    // Better Auth's user model is mapped onto TripMate's users table (DATABASE §10).
    // Keys are Drizzle schema property names. id, email, emailVerified, createdAt and
    // updatedAt already match.
    user: {
      fields: {
        name: "displayName",
        image: "avatarUrl",
      },
    },
    advanced: {
      database: {
        // With the pg Drizzle adapter (supportsUUIDs), "uuid" makes Better Auth omit
        // the id on insert so PostgreSQL's gen_random_uuid() default generates it,
        // and rejects any explicitly supplied id that is not a UUID.
        generateId: "uuid",
      },
    },
    // Off by default in 1.7; stated explicitly so no auth metadata leaves the app.
    telemetry: { enabled: false },
  });
}

export type Auth = ReturnType<typeof createAuth>;
