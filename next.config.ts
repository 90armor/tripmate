import type { NextConfig } from "next";
import { parseDevAllowedOrigins } from "./src/lib/dev-allowed-origins";

const nextConfig: NextConfig = {
  // Do not advertise the framework in response headers.
  poweredByHeader: false,
  // Do not let `next dev` write AGENTS.md: agent instructions for this repo live in
  // CLAUDE.md and AGENT_RULES.md, maintained by the project owner.
  agentRules: false,
  // Extra hosts allowed to use the dev server (e.g. a LAN IP for phone testing).
  // Optional; see src/lib/dev-allowed-origins.ts. Ignored by production builds.
  allowedDevOrigins: parseDevAllowedOrigins(process.env.DEV_ALLOWED_ORIGINS),
};

export default nextConfig;
