import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { currencies, tripDestinations, tripMembers, trips } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { ValidationError } from "@/lib/errors";
import { firstFieldErrors } from "@/lib/form-state";
import { tripDetailsSchema } from "../schemas";

/**
 * Create Trip (CURRENT_TASK §4.3, ROADMAP Slice 1.3). One transaction:
 *
 *   insert trip
 *   insert OWNER trip_member (user = creator, joined now)
 *   insert primary trip_destination (sort_order 0, ROADMAP D11)
 *
 * Any failure rolls back all three. `input` is untrusted and parsed here, so
 * every caller (Server Action today, /api/v1 later) gets the same validation.
 */
export async function createTrip(
  db: DbExecutor,
  user: AuthenticatedUser,
  input: unknown,
): Promise<{ tripId: string }> {
  const parsed = tripDetailsSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(firstFieldErrors(parsed.error));
  const trip = parsed.data;

  return db.transaction(async (tx) => {
    const [currency] = await tx
      .select({ code: currencies.code })
      .from(currencies)
      .where(and(eq(currencies.code, trip.baseCurrency), eq(currencies.active, true)));
    if (!currency) {
      throw new ValidationError({ baseCurrency: "Choose a currency from the list" });
    }

    const [created] = await tx
      .insert(trips)
      .values({
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        timezone: trip.timezone,
        baseCurrencyCode: currency.code,
        createdBy: user.id,
      })
      .returning({ id: trips.id });
    const tripId = created!.id;

    // One trip_members row per INSERT (ROADMAP D9). The creator is the first
    // OWNER (FEATURES §5).
    await tx.insert(tripMembers).values({
      tripId,
      userId: user.id,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: new Date(),
    });

    await tx.insert(tripDestinations).values({ tripId, name: trip.destination, sortOrder: 0 });

    return { tripId };
  });
}
