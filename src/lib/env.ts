import "server-only";
import { parseServerEnv } from "./env-schema";

/**
 * Validated server configuration. The only module that reads process.env for
 * application config (AGENT_RULES §73). Importing it validates immediately, so
 * misconfiguration fails at startup (see src/instrumentation.ts), not mid-request.
 *
 * `server-only` makes any import from a Client Component a build error, keeping
 * secrets out of client bundles.
 */
export const env = parseServerEnv(process.env);
