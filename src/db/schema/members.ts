import { sql } from "drizzle-orm";
import { check, index, pgTable, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { inList, timestamps } from "./columns";
import { trips } from "./trips";
import { users } from "./users";

export const MEMBER_ROLES = ["OWNER", "MEMBER"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

/** Membership states (ROADMAP D8). Outstanding invitations live in trip_invitations, not here. */
export const MEMBER_STATUSES = ["ACTIVE", "LEFT", "REMOVED"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

/**
 * Trip memberships (DATABASE §13). Financial records reference trip_members.id,
 * so rows are never hard-deleted and deletes are RESTRICTed (DATABASE §46).
 *
 * Placeholder members (ROADMAP D2) have user_id NULL and a display_name; they can
 * never be OWNER. Postgres treats NULLs as distinct in UNIQUE, so a trip may have
 * several placeholders while a real user can only be a member once.
 */
export const tripMembers = pgTable(
  "trip_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "restrict" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "restrict" }),
    displayName: varchar("display_name"),
    role: varchar("role", { enum: MEMBER_ROLES }).notNull(),
    status: varchar("status", { enum: MEMBER_STATUSES }).notNull().default("ACTIVE"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
    ...timestamps,
    // Overrides the shared default. created_at is the primary key of the D4
    // remainder ordering (created_at ASC, id ASC). now() is the transaction start
    // time, so members inserted in one transaction (owner + placeholders at trip
    // creation) would tie and D4 would fall back to random UUID order.
    // clock_timestamp() advances within a transaction, preserving insert order.
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    // Same clock as created_at so a fresh row never has updated_at < created_at.
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique("trip_members_trip_id_user_id_key").on(t.tripId, t.userId),
    check("trip_members_role_valid", inList(t.role, MEMBER_ROLES)),
    check("trip_members_status_valid", inList(t.status, MEMBER_STATUSES)),
    check(
      "trip_members_user_or_display_name",
      sql`${t.userId} IS NOT NULL OR ${t.displayName} IS NOT NULL`,
    ),
    check("trip_members_owner_has_user", sql`${t.role} <> 'OWNER' OR ${t.userId} IS NOT NULL`),
    index("trip_members_user_id_status_idx").on(t.userId, t.status),
  ],
);
