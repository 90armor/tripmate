import { and, eq } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { currencies, tripDestinations, trips } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { ValidationError } from "@/lib/errors";
import { firstFieldErrors } from "@/lib/form-state";
import { requireTripOwner } from "../access";
import { tripSettingsSchema } from "../schemas";

/**
 * Trip Settings (CURRENT_TASK §4.5): OWNER only, same validation as Create
 * Trip, archived trips rejected (ROADMAP D22). Trip row and primary destination
 * (sort_order 0) change in one transaction.
 */
export async function updateTripSettings(
  db: DbExecutor,
  user: AuthenticatedUser,
  tripId: string,
  input: unknown,
): Promise<void> {
  const parsed = tripSettingsSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError(firstFieldErrors(parsed.error));
  const settings = parsed.data;

  await db.transaction(async (tx) => {
    // forWrite: rejects archived trips and locks the trip row until commit.
    const { trip } = await requireTripOwner(tx, user, tripId, { forWrite: true });

    // TODO(M5 Expenses): restrict changing the base currency once the trip has
    // expenses — base amounts and balances are stored in it. Allowed in M1
    // because no financial records exist yet (CURRENT_TASK §4.5).
    if (settings.baseCurrency !== trip.baseCurrencyCode) {
      const [currency] = await tx
        .select({ code: currencies.code })
        .from(currencies)
        .where(and(eq(currencies.code, settings.baseCurrency), eq(currencies.active, true)));
      // Keeping the current currency is always allowed, even if it has since been
      // deactivated in the reference data; switching requires an active one.
      if (!currency) {
        throw new ValidationError({ baseCurrency: "Choose a currency from the list" });
      }
    }

    await tx
      .update(trips)
      .set({
        name: settings.name,
        startDate: settings.startDate,
        endDate: settings.endDate,
        timezone: settings.timezone,
        baseCurrencyCode: settings.baseCurrency,
        // undefined (field omitted) leaves the override unchanged.
        ...(settings.statusOverride !== undefined && { statusOverride: settings.statusOverride }),
        updatedAt: new Date(),
      })
      .where(eq(trips.id, trip.id));

    // Primary destination = sort_order 0 (ROADMAP D11). Every trip gets one at
    // creation; insert it if an older row is somehow missing.
    const updated = await tx
      .update(tripDestinations)
      .set({ name: settings.destination, updatedAt: new Date() })
      .where(and(eq(tripDestinations.tripId, trip.id), eq(tripDestinations.sortOrder, 0)))
      .returning({ id: tripDestinations.id });
    if (updated.length === 0) {
      await tx
        .insert(tripDestinations)
        .values({ tripId: trip.id, name: settings.destination, sortOrder: 0 });
    }
  });
}
