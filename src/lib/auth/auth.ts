import "server-only";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { getEnv } from "@/lib/env";
import { createAuth, type Auth } from "./create-auth";

let instance: Auth | undefined;

/**
 * Application Better Auth instance. Server-only. Created on first use so
 * `next build` can import route modules without configuration (see getEnv()).
 * nextCookies() lets Server Actions that call auth.api.* set the session cookie.
 */
export function getAuth(): Auth {
  if (!instance) {
    const env = getEnv();
    instance = createAuth({
      db: getDb(),
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
      plugins: [nextCookies()],
    });
  }
  return instance;
}
