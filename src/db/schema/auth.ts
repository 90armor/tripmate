import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { users } from "./users";

/*
 * Better Auth infrastructure tables (ROADMAP D1, DATABASE §10). Property names
 * are Better Auth's field names; columns are snake_case like the rest of the
 * schema. Business entities never reference these tables, only users.id.
 *
 * user_id cascades: these rows are owned by the user and carry no history
 * (DATABASE §46 restricts cascades for financial/domain entities only).
 */

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: varchar("token").notNull().unique("session_token_key"),
    ipAddress: varchar("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: varchar("account_id").notNull(),
    providerId: varchar("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    // Password hash (scrypt) for the "credential" provider; never the password.
    password: text("password"),
    ...timestamps,
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: varchar("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
