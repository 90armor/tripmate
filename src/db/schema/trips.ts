import { sql } from "drizzle-orm";
import {
  char,
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { TRIP_STATUSES } from "../../domain/trips/status";
import { inList, timestamps } from "./columns";
import { currencies } from "./currencies";
import { users } from "./users";

// Lifecycle statuses are owned by the domain; the schema reuses them for the CHECK.
// Relative import: drizzle-kit loads this file without the "@/" path alias.
export { TRIP_STATUSES, type TripStatus } from "../../domain/trips/status";

/**
 * Trips (DATABASE §11). Status is derived from dates in the trip timezone;
 * only the optional manual override is stored (ROADMAP D7).
 */
export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name").notNull(),
    description: text("description"),
    // DATE in "string" mode ("2026-11-18"): calendar dates must never pass through
    // JS Date, which would shift them by the server/viewer timezone (DATABASE §6).
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    timezone: varchar("timezone").notNull(),
    baseCurrencyCode: char("base_currency_code", { length: 3 })
      .notNull()
      .references(() => currencies.code, { onDelete: "restrict" }),
    statusOverride: varchar("status_override", { enum: TRIP_STATUSES }),
    coverUrl: text("cover_url"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    check("trips_date_range", sql`${t.startDate} <= ${t.endDate}`),
    check(
      "trips_status_override_valid",
      sql`${t.statusOverride} IS NULL OR ${inList(t.statusOverride, TRIP_STATUSES)}`,
    ),
    index("trips_start_date_end_date_idx").on(t.startDate, t.endDate),
  ],
);
