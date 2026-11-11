import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./columns";

/**
 * TripMate users (DATABASE §10). Better Auth's user model is mapped onto this
 * table (ROADMAP D1), so the Better Auth user id IS users.id. Domain tables
 * reference users.id only.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email").notNull(),
    displayName: varchar("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    emailVerified: boolean("email_verified").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    // Case-insensitive uniqueness (DATABASE §10). Emails are stored lowercase:
    // Better Auth 1.7 lowercases on every create/update and looks users up by
    // equality on the lowercased value. The CHECK guards any other writer, and the
    // plain unique index then gives both uniqueness and fast equality lookups.
    check("users_email_lowercase", sql`${t.email} = lower(${t.email})`),
    uniqueIndex("users_email_key").on(t.email),
  ],
);
