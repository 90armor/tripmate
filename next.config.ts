import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do not advertise the framework in response headers.
  poweredByHeader: false,
  // Do not let `next dev` write AGENTS.md: agent instructions for this repo live in
  // CLAUDE.md and AGENT_RULES.md, maintained by the project owner.
  agentRules: false,
};

export default nextConfig;
