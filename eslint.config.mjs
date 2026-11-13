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
    // Identifier naming (ROADMAP D20). Object and property names are deliberately not
    // enforced: they mirror DB columns, HTTP headers, and third-party config shapes.
    // PascalCase is allowed for variables/parameters/functions because React components
    // (and component-valued props such as `Icon`) are PascalCase. Destructured names keep
    // the casing of the source object.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        { selector: "parameter", format: ["camelCase", "PascalCase"], leadingUnderscore: "allow" },
        { selector: ["variable", "parameter"], modifiers: ["destructured"], format: null },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
      ],
    },
  },
  {
    // it.each tables name parameters after the env vars they feed (NODE_ENV, BETTER_AUTH_URL).
    // A later block replaces the whole rule config for matching files, so every selector is
    // repeated; only `parameter` differs (UPPER_CASE allowed).
    files: ["**/*.test.{ts,tsx}", "**/*.int.test.{ts,tsx}", "e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "parameter",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        { selector: ["variable", "parameter"], modifiers: ["destructured"], format: null },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
      ],
    },
  },
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
