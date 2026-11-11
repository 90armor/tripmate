/**
 * Safety guard for integration tests (CURRENT_TASK §29-30, ARCHITECTURE §73).
 * Tests must never touch the development or production database, so the test URL
 * must name a database ending in `_test` and must not be the same database as
 * DATABASE_URL. Pure function so the rules themselves are unit tested.
 */
export function assertSafeTestDatabaseUrl(
  testUrl: string | undefined,
  appUrl: string | undefined,
): string {
  if (!testUrl) {
    throw new Error("TEST_DATABASE_URL is not set. See .env.example.");
  }

  const test = parsePostgresUrl(testUrl, "TEST_DATABASE_URL");
  if (!test.database.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests: TEST_DATABASE_URL database "${test.database}" must end in "_test".`,
    );
  }

  if (appUrl) {
    const app = parsePostgresUrl(appUrl, "DATABASE_URL");
    if (app.host === test.host && app.port === test.port && app.database === test.database) {
      throw new Error(
        "Refusing to run integration tests: TEST_DATABASE_URL points at the same database as DATABASE_URL.",
      );
    }
  }

  return testUrl;
}

// Only host, port and database name are extracted; credentials are never echoed.
function parsePostgresUrl(value: string, name: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL.`);
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${name} must use the postgres:// or postgresql:// scheme.`);
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) {
    throw new Error(`${name} must include a database name.`);
  }
  return { host: url.hostname, port: url.port || "5432", database };
}
