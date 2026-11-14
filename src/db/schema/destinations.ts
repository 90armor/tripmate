import { sql } from "drizzle-orm";
import {
  char,
  check,
  index,
  integer,
  numeric,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { trips } from "./trips";

/**
 * Trip destinations (DATABASE §12, ROADMAP D11). The primary destination is the
 * row with sort_order = 0; there is no is_primary column. M1 creates exactly one
 * row per trip; more destinations later need no schema change.
 */
export const tripDestinations = pgTable(
  "trip_destinations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "restrict" }),
    name: varchar("name").notNull(),
    countryCode: char("country_code", { length: 2 }),
    // Optional IANA timezone for a destination in a different zone from the trip.
    timezone: varchar("timezone"),
    // NUMERIC(9,6) per DATABASE §18; pg returns strings, never parsed as floats here.
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    sortOrder: integer("sort_order").notNull(),
    ...timestamps,
  },
  (t) => [
    unique("trip_destinations_trip_id_sort_order_key").on(t.tripId, t.sortOrder),
    check("trip_destinations_sort_order_nonnegative", sql`${t.sortOrder} >= 0`),
    check(
      "trip_destinations_country_code_format",
      sql`${t.countryCode} IS NULL OR ${t.countryCode} ~ '^[A-Z]{2}$'`,
    ),
    check(
      "trip_destinations_latitude_range",
      sql`${t.latitude} IS NULL OR ${t.latitude} BETWEEN -90 AND 90`,
    ),
    check(
      "trip_destinations_longitude_range",
      sql`${t.longitude} IS NULL OR ${t.longitude} BETWEEN -180 AND 180`,
    ),
    // The unique constraint's index leads with trip_id, but CURRENT_TASK §5 asks
    // for an explicit trip_id index; it keeps FK checks on trips deletes cheap even
    // if the unique constraint changes later.
    index("trip_destinations_trip_id_idx").on(t.tripId),
  ],
);
