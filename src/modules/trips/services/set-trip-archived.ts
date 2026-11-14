import { eq } from "drizzle-orm";
import type { DbExecutor } from "@/db/client";
import { trips } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/types";
import { requireTripOwner } from "../access";

/**
 * Archive or unarchive a trip (ROADMAP D16, D22). OWNER only. Archiving sets
 * archived_at; unarchiving clears it. Idempotent: archiving an archived trip
 * keeps its original archived_at.
 *
 * This is the one trip write that does not ask for write access: unarchive must
 * work on an archived (read-only) trip.
 */
export async function setTripArchived(
  db: DbExecutor,
  user: AuthenticatedUser,
  tripId: string,
  archived: boolean,
): Promise<void> {
  await db.transaction(async (tx) => {
    const { trip } = await requireTripOwner(tx, user, tripId);
    if (archived === (trip.archivedAt !== null)) return;
    await tx
      .update(trips)
      .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
      .where(eq(trips.id, trip.id));
  });
}
