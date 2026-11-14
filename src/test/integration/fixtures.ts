import { randomUUID } from "node:crypto";
import type { Transaction } from "@/db/client";
import { currencies, tripDestinations, tripMembers, trips, users } from "@/db/schema";
import type { MemberRole, MemberStatus, TripStatus } from "@/db/schema";

/*
 * Row builders for integration tests. They write directly with Drizzle (no
 * application services) so tests can set up states the UI cannot create yet,
 * such as MEMBER, LEFT or placeholder rows. Use inside withRollback().
 */

// XTS is the ISO 4217 code reserved for testing.
export const TEST_CURRENCY = { code: "XTS", name: "Test currency", symbol: null, minorUnits: 2 };

export async function insertTestCurrency(tx: Transaction) {
  await tx.insert(currencies).values(TEST_CURRENCY).onConflictDoNothing();
}

export async function insertUser(tx: Transaction, displayName = "Test Traveler") {
  const [user] = await tx
    .insert(users)
    .values({ email: `user.${randomUUID()}@example.com`, displayName })
    .returning();
  return user!;
}

export type TripFixture = {
  name?: string;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  statusOverride?: TripStatus | null;
  archivedAt?: Date | null;
  destination?: string | null;
};

/** A trip with its primary destination (sort_order 0) and an OWNER membership. */
export async function insertTrip(tx: Transaction, ownerId: string, fixture: TripFixture = {}) {
  await insertTestCurrency(tx);
  const [trip] = await tx
    .insert(trips)
    .values({
      name: fixture.name ?? "Tokyo Autumn Trip",
      startDate: fixture.startDate ?? "2026-11-15",
      endDate: fixture.endDate ?? "2026-11-21",
      timezone: fixture.timezone ?? "Asia/Tokyo",
      baseCurrencyCode: TEST_CURRENCY.code,
      statusOverride: fixture.statusOverride ?? null,
      archivedAt: fixture.archivedAt ?? null,
      createdBy: ownerId,
    })
    .returning();
  if (fixture.destination !== null) {
    await tx
      .insert(tripDestinations)
      .values({ tripId: trip!.id, name: fixture.destination ?? "Tokyo, Japan", sortOrder: 0 });
  }
  await insertMember(tx, trip!.id, { userId: ownerId, role: "OWNER" });
  return trip!;
}

/** One trip_members row per INSERT (ROADMAP D9). */
export async function insertMember(
  tx: Transaction,
  tripId: string,
  member: {
    userId?: string | null;
    displayName?: string;
    role?: MemberRole;
    status?: MemberStatus;
  },
) {
  const [row] = await tx
    .insert(tripMembers)
    .values({
      tripId,
      userId: member.userId ?? null,
      displayName: member.displayName ?? null,
      role: member.role ?? "MEMBER",
      status: member.status ?? "ACTIVE",
      joinedAt: member.userId ? new Date() : null,
    })
    .returning();
  return row!;
}
