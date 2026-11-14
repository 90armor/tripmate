import { defineConfig, devices } from "@playwright/test";
import { getTestDatabaseUrl } from "./src/test/integration/test-database";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = Boolean(process.env.CI);

/*
 * E2E across the minimum responsive matrix (ARCHITECTURE §65): small phone,
 * large phone, desktop.
 *
 * The dev server runs against the guarded integration database (tripmate_test,
 * never the development database) so test sign-ups do not pile up in local data.
 * Next.js does not override variables already set in the environment, so these
 * win over .env. BETTER_AUTH_URL must match the test origin, or Better Auth's
 * origin check rejects form posts from port 3100.
 *
 * Each test signs up its own random user, so tests never share accounts.
 */
const testDatabaseUrl = getTestDatabaseUrl();

export default defineConfig({
  testDir: "e2e",
  // Applies committed migrations to the test database before the run.
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "small-phone",
      use: { ...devices["Pixel 5"], viewport: { width: 360, height: 640 } },
    },
    {
      name: "large-phone",
      use: { ...devices["Pixel 7"], viewport: { width: 430, height: 932 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    // Safari's engine on iPhone-sized screens, for the form-heavy flows. This is
    // Playwright's desktop WebKit with iPhone emulation: close to iOS Safari, but
    // it does not draw iOS's native date control, so check those on a real phone.
    {
      name: "iphone-small",
      testMatch: "create-trip.spec.ts",
      use: { ...devices["iPhone 13 Mini"], viewport: { width: 360, height: 640 } },
    },
    {
      name: "iphone-large",
      testMatch: "create-trip.spec.ts",
      use: { ...devices["iPhone 15 Pro Max"], viewport: { width: 430, height: 739 } },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `${BASE_URL}/sign-in`,
    // A server already on this port may be using the development database, so
    // never reuse one: start a fresh server bound to the test database.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      BETTER_AUTH_URL: BASE_URL,
    },
  },
});
