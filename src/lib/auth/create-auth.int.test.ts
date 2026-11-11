import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import { createTestDb } from "@/test/integration/test-database";
import { createAuth } from "./create-auth";

/*
 * Proves the M0 Better Auth configuration against real PostgreSQL without the
 * M1 session/account/verification tables: Better Auth's internal adapter writes
 * and reads TripMate's users table through the configured field mapping.
 *
 * Better Auth uses its own connection, so these rows cannot sit inside a
 * rolled-back transaction; each test deletes what it created.
 */
const queries: string[] = [];
const { db, pool } = createTestDb({ logger: { logQuery: (query) => queries.push(query) } });
const auth = createAuth({
  db,
  secret: "integration-test-secret-not-used-anywhere-else-0123",
  baseURL: "http://localhost:3000",
});

const createdUserIds: string[] = [];
afterEach(async () => {
  for (const id of createdUserIds.splice(0)) await db.delete(users).where(eq(users.id, id));
  queries.length = 0;
});
afterAll(() => pool.end());

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("Better Auth foundation (better-auth users mapping)", () => {
  it("creates users with a PostgreSQL-generated UUID, lowercase email, and mapped columns", async () => {
    const ctx = await auth.$context;
    const mixedCaseEmail = `Traveler.${randomUUID()}@Example.COM`;

    const user = await ctx.internalAdapter.createUser(
      {
        email: mixedCaseEmail,
        name: "Test Traveler",
        image: "https://example.com/avatar.png",
        emailVerified: false,
      },
      { method: "email-password" },
    );
    createdUserIds.push(user.id);

    expect(user.id).toMatch(UUID);
    expect(user.email).toBe(mixedCaseEmail.toLowerCase());

    // generateId "uuid" + pg adapter: Better Auth must not supply an id. Drizzle lists
    // every column and sends DEFAULT for unset ones, so the id slot must be `default`,
    // i.e. PostgreSQL's gen_random_uuid() generated it.
    const insert = queries.find((q) => q.toLowerCase().startsWith('insert into "users"'));
    expect(insert).toMatch(/^insert into "users" \("id", [^)]*\) values \(default, /);

    // Better Auth fields land in TripMate columns (name -> display_name, image -> avatar_url).
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row).toMatchObject({
      email: mixedCaseEmail.toLowerCase(),
      displayName: "Test Traveler",
      avatarUrl: "https://example.com/avatar.png",
      emailVerified: false,
    });
  });

  it("finds users by email regardless of the case used at lookup", async () => {
    const ctx = await auth.$context;
    const email = `lookup.${randomUUID()}@example.com`;
    const user = await ctx.internalAdapter.createUser(
      { email, name: "Lookup Traveler" },
      { method: "email-password" },
    );
    createdUserIds.push(user.id);

    const found = await ctx.internalAdapter.findUserByEmail(email.toUpperCase());
    expect(found?.user.id).toBe(user.id);
  });
});
