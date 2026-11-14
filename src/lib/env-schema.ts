import { z } from "zod";
import { devAllowedOriginsProblems } from "./dev-allowed-origins";

/**
 * The BETTER_AUTH_SECRET value shipped in .env.example. Accepted for local
 * development so `cp .env.example .env` works, but rejected in production and
 * on any deployment whose BETTER_AUTH_URL is not localhost (staging, previews),
 * because the value is public. A unit test keeps this in sync with .env.example.
 */
export const EXAMPLE_AUTH_SECRET_PLACEHOLDER = "replace-me-with-openssl-rand-base64-32-output";

const LOCAL_AUTH_HOSTS: ReadonlySet<string> = new Set(["localhost", "127.0.0.1"]);

function isLocalAuthUrl(value: string): boolean {
  try {
    return LOCAL_AUTH_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

const postgresUrl = z
  .url({ message: "must be a valid URL" })
  .refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: "must use the postgres:// or postgresql:// scheme",
  });

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: postgresUrl,
    BETTER_AUTH_SECRET: z.string().min(32, { message: "must be at least 32 characters" }),
    BETTER_AUTH_URL: z.url({ message: "must be a valid URL" }),
    // Optional, development only: hostnames allowed to use `next dev` (phone testing).
    DEV_ALLOWED_ORIGINS: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.DEV_ALLOWED_ORIGINS !== undefined) {
      for (const message of devAllowedOriginsProblems(env.DEV_ALLOWED_ORIGINS)) {
        ctx.addIssue({ code: "custom", path: ["DEV_ALLOWED_ORIGINS"], message });
      }
    }
    const isLocalDevelopment = env.NODE_ENV !== "production" && isLocalAuthUrl(env.BETTER_AUTH_URL);
    if (env.BETTER_AUTH_SECRET === EXAMPLE_AUTH_SECRET_PLACEHOLDER && !isLocalDevelopment) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_SECRET"],
        message:
          "must not be the .env.example placeholder in production or when BETTER_AUTH_URL is not localhost",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(
      `Invalid server environment configuration:\n${problems.map((p) => `  - ${p}`).join("\n")}`,
    );
    this.name = "EnvValidationError";
    this.problems = problems;
  }
}

/**
 * Validates server configuration. Error messages name the variable and the rule
 * only — they never include the value, because values may be secrets.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (result.success) return result.data;

  const problems = result.error.issues.map((issue) => {
    const name = issue.path.join(".") || "(root)";
    const isMissing = issue.code === "invalid_type" && source[name] === undefined;
    return `${name}: ${isMissing ? "is required" : issue.message}`;
  });
  throw new EnvValidationError(problems);
}
