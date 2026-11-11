import type { Auth } from "./create-auth";

/** Better Auth's inferred session shape. Transport/infrastructure use only. */
export type AuthSession = Auth["$Infer"]["Session"];

/**
 * What application services receive once the transport layer has authenticated a
 * request: a TripMate users.id, never a cookie or Better Auth session object.
 * This keeps services reusable by future native/API clients (ARCHITECTURE §71).
 */
export type AuthenticatedUser = { readonly id: string };
