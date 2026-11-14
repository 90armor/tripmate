import "server-only";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { env } from "@/lib/env";
import { createAuth } from "./create-auth";

/**
 * Application Better Auth instance. Server-only.
 * nextCookies() lets Server Actions that call auth.api.* set the session cookie.
 */
export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  plugins: [nextCookies()],
});
