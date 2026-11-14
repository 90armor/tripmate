import "server-only";
import { parseServerEnv, type ServerEnv } from "./env-schema";

let cached: ServerEnv | undefined;

/**
 * Validated server configuration. The only module that reads process.env for
 * application config (AGENT_RULES §73).
 *
 * Parsed on first use rather than at import: `next build` imports every route
 * module, and the build must not need runtime configuration or secrets (CI
 * builds without them). Startup still fails fast, because src/instrumentation.ts
 * calls getEnv() when the server boots.
 *
 * `server-only` makes any import from a Client Component a build error, keeping
 * secrets out of client bundles.
 */
export function getEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
