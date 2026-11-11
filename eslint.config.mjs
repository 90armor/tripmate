import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Domain code (src/domain) must stay framework- and infrastructure-free so the
// same business rules can serve web, API, and future native clients
// (CLAUDE.md non-negotiables, ARCHITECTURE §30/§34).
const domainForbiddenImports = {
  paths: [
    { name: "react", message: "src/domain must not depend on React." },
    { name: "react-dom", message: "src/domain must not depend on React." },
    { name: "next", message: "src/domain must not depend on Next.js." },
    { name: "drizzle-orm", message: "src/domain must not depend on Drizzle." },
    { name: "pg", message: "src/domain must not depend on the database driver." },
  ],
  patterns: [
    { group: ["react/*", "react-dom/*"], message: "src/domain must not depend on React." },
    { group: ["next/*"], message: "src/domain must not depend on Next.js." },
    { group: ["drizzle-orm/*"], message: "src/domain must not depend on Drizzle." },
    {
      group: ["better-auth", "better-auth/*"],
      message: "src/domain must not depend on auth infrastructure.",
    },
    { group: ["@/db", "@/db/*"], message: "src/domain must not depend on the database layer." },
    {
      group: ["@/lib/auth", "@/lib/auth/*"],
      message: "src/domain must not depend on auth infrastructure.",
    },
  ],
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", domainForbiddenImports],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "next-env.d.ts",
  ]),
]);
