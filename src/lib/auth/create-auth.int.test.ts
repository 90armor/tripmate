import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { account, session, users } from "@/db/schema";
import { createTestDb } from "@/test/integration/test-database";
import { createAuth } from "./create-auth";
import { HTTP_ENABLED_AUTH_PATHS } from "./http-allow-list";

/*
 * Proves the Better Auth configuration against real PostgreSQL: the internal
 * adapter writes and reads TripMate's users table through the field mapping, and
 * email + password sign-up / sign-in / sessions work with the session, account and
 * verification tables.
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

    // Better Auth fields land in TripMate columns (name -> display_name). The
    // image -> avatar_url mapping stays, but the user hooks drop every image (D18).
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row).toMatchObject({
      email: mixedCaseEmail.toLowerCase(),
      displayName: "Test Traveler",
      avatarUrl: null,
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

  describe("email + password (ROADMAP D14)", () => {
    const PASSWORD = "correct-horse-battery";

    async function signUp(email: string, name = "New Traveler") {
      const result = await auth.api.signUpEmail({ body: { email, password: PASSWORD, name } });
      createdUserIds.push(result.user.id);
      return result;
    }

    it("signs up with a lowercase email, display name, and a stored password hash only", async () => {
      const email = `Sign.Up.${randomUUID()}@Example.COM`;
      const { user, token } = await signUp(email, "Phyo");

      expect(user.email).toBe(email.toLowerCase());
      expect(token).toBeTruthy();
      const [row] = await db.select().from(users).where(eq(users.id, user.id));
      expect(row).toMatchObject({ email: email.toLowerCase(), displayName: "Phyo" });
      // users has no password column; the credential hash lives in account only.
      expect(Object.keys(row!)).not.toContain("password");
      const [credential] = await db.select().from(account).where(eq(account.userId, user.id));
      expect(credential?.providerId).toBe("credential");
      expect(credential?.password).toBeTruthy();
      expect(credential?.password).not.toContain(PASSWORD);
    });

    it("rejects a duplicate email regardless of case", async () => {
      const email = `dup.${randomUUID()}@example.com`;
      await signUp(email);
      await expect(
        auth.api.signUpEmail({
          body: { email: email.toUpperCase(), password: PASSWORD, name: "Second" },
        }),
      ).rejects.toThrow();
    });

    it("rejects passwords shorter than 8 characters", async () => {
      await expect(
        auth.api.signUpEmail({
          body: { email: `short.${randomUUID()}@example.com`, password: "1234567", name: "Short" },
        }),
      ).rejects.toThrow();
    });

    it("signs in, resolves the session from request headers, and signs out", async () => {
      const email = `flow.${randomUUID()}@example.com`;
      const { user } = await signUp(email);

      const signedIn = await auth.api.signInEmail({
        body: { email: email.toUpperCase(), password: PASSWORD },
        returnHeaders: true,
      });
      const cookie = signedIn.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");
      expect(cookie).toContain("session_token");

      const headers = new Headers({ cookie });
      const current = await auth.api.getSession({ headers });
      expect(current?.user.id).toBe(user.id);

      await auth.api.signOut({ headers });
      expect(await auth.api.getSession({ headers })).toBeNull();
      const remaining = await db.select().from(session).where(eq(session.userId, user.id));
      // Sign-up auto-signed in once; only the sign-in session was removed.
      expect(remaining).toHaveLength(1);
    });

    it("rejects a wrong password", async () => {
      const email = `wrong.${randomUUID()}@example.com`;
      await signUp(email);
      await expect(
        auth.api.signInEmail({ body: { email, password: "not-the-password" } }),
      ).rejects.toThrow();
    });

    it("updates the display name through the users mapping", async () => {
      const email = `rename.${randomUUID()}@example.com`;
      const { user } = await signUp(email, "Before");
      const signedIn = await auth.api.signInEmail({
        body: { email, password: PASSWORD },
        returnHeaders: true,
      });
      const cookie = signedIn.headers
        .getSetCookie()
        .map((c) => c.split(";")[0])
        .join("; ");

      await auth.api.updateUser({ headers: new Headers({ cookie }), body: { name: "After" } });

      const [row] = await db.select().from(users).where(eq(users.id, user.id));
      expect(row?.displayName).toBe("After");
    });
  });
});

describe("every write path validates profile fields (ROADMAP D18)", () => {
  const PASSWORD = "correct-horse-battery";
  const ORIGIN = "http://localhost:3000";

  /** A raw HTTP request to /api/auth/*, as a client could send without our forms. */
  function http(path: string, init: { body?: unknown; cookie?: string; method?: string } = {}) {
    const headers = new Headers({ origin: ORIGIN });
    if (init.body !== undefined) headers.set("content-type", "application/json");
    if (init.cookie) headers.set("cookie", init.cookie);
    return auth.handler(
      new Request(`${ORIGIN}/api/auth${path}`, {
        method: init.method ?? "POST",
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      }),
    );
  }

  async function userByEmail(email: string) {
    const [row] = await db.select().from(users).where(eq(users.email, email));
    if (row) createdUserIds.push(row.id);
    return row;
  }

  /** Signs up in-process, as the Sign Up Server Action does, and returns the session cookie. */
  async function signedInUser() {
    const email = `guard.${randomUUID()}@example.com`;
    const { headers } = await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name: "Guarded" },
      returnHeaders: true,
    });
    const cookie = headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    return { user: (await userByEmail(email))!, cookie };
  }

  const BAD_NAMES = [
    ["empty", ""],
    ["blank", "   "],
    ["too long", "x".repeat(101)],
    ["padded with spaces", " Padded "],
  ] as const;

  it("answers 404 for every Better Auth endpoint over HTTP", async () => {
    // Every endpoint this Better Auth version defines, so an upgrade that adds
    // one is covered too. TripMate calls auth.api in-process only.
    expect(HTTP_ENABLED_AUTH_PATHS.size).toBe(0);
    const paths = Object.values(auth.api as Record<string, { path?: unknown }>)
      .map((endpoint) => endpoint.path)
      .filter((path): path is string => typeof path === "string")
      .map((path) => path.replace(/:[^/]+/g, "x"));
    expect(paths).toContain("/sign-in/email");
    expect(paths.length).toBeGreaterThan(20);

    // GET as well as POST: for GET-only endpoints (/ok, /list-sessions,
    // /reset-password/:token…) a POST-only probe would get 404 from the router
    // even without the allow-list. /ok answers 200 when allowed
    // (http-allow-list.test.ts), so its 404 here comes from the allow-list.
    expect(paths).toContain("/ok");
    const probes = [
      ...paths,
      "/sign-up/email/",
      "/Sign-In/Email",
      "/update%2Duser",
      "/callback/google",
    ];
    for (const path of probes) {
      expect((await http(path, { method: "GET" })).status, `GET ${path}`).toBe(404);
      expect((await http(path, { body: {} })).status, `POST ${path}`).toBe(404);
    }
  });

  it("creates no user through HTTP sign-up, whatever the name", async () => {
    for (const name of ["Valid Name", ...BAD_NAMES.map(([, bad]) => bad)]) {
      const email = `http-sign-up.${randomUUID()}@example.com`;
      const response = await http("/sign-up/email", { body: { email, password: PASSWORD, name } });
      expect(response.status).toBe(404);
      expect(await userByEmail(email)).toBeUndefined();
    }
  });

  it.each(BAD_NAMES)(
    "rejects in-process sign-up with a %s name and creates no user",
    async (_case, name) => {
      const email = `bad-name.${randomUUID()}@example.com`;
      // Rejected by our user hook, not by Better Auth's own (looser) body schema.
      await expect(
        auth.api.signUpEmail({ body: { email, password: PASSWORD, name } }),
      ).rejects.toMatchObject({ body: { code: "INVALID_DISPLAY_NAME" } });
      expect(await userByEmail(email)).toBeUndefined();
    },
  );

  it("ignores an image sent with sign-up: avatar_url stays NULL", async () => {
    const email = `avatar.${randomUUID()}@example.com`;
    await auth.api.signUpEmail({
      body: { email, password: PASSWORD, name: "Avatar", image: "https://evil.example/a.png" },
    });
    expect(await userByEmail(email)).toMatchObject({ displayName: "Avatar", avatarUrl: null });
  });

  it("does not expose /update-user over HTTP, even with a valid session", async () => {
    const { user, cookie } = await signedInUser();
    for (const body of [
      { name: "" },
      { image: "https://evil.example/a.png" },
      { name: "Hacked" },
    ]) {
      expect((await http("/update-user", { body, cookie })).status).toBe(404);
    }
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row).toMatchObject({ displayName: "Guarded", avatarUrl: null });
  });

  it("validates in-process updates too: bad names rejected, image dropped", async () => {
    const { user, cookie } = await signedInUser();
    const headers = new Headers({ cookie });

    for (const [, name] of BAD_NAMES) {
      await expect(auth.api.updateUser({ headers, body: { name } })).rejects.toMatchObject({
        body: { code: "INVALID_DISPLAY_NAME" },
      });
    }
    await auth.api.updateUser({
      headers,
      body: { name: "Renamed", image: "https://evil.example/a.png" },
    });

    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row).toMatchObject({ displayName: "Renamed", avatarUrl: null });
  });
});
