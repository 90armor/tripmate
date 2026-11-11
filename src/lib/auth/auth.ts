import "server-only";
import { db } from "@/db";
import { env } from "@/lib/env";
import { createAuth } from "./create-auth";

/** Application Better Auth instance. Server-only. */
export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});
