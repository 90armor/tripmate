import { betterAuth } from "better-auth";
import { describe, expect, it } from "vitest";
import { authRelativePath, httpAllowList, routerBasePath } from "./http-allow-list";

/*
 * The allow-list must resolve paths against the same base path as Better Auth's
 * router (the resolved baseURL's path). A test-only allow-list with the
 * harmless GET /ok endpoint proves allowed paths still route; the real list is
 * empty. No database is needed for /ok.
 */
function authAt(baseURL: string) {
  return betterAuth({
    baseURL,
    secret: "unit-test-secret-not-used-anywhere-else-0123456789",
    plugins: [httpAllowList(new Set(["/ok"]))],
    telemetry: { enabled: false },
    logger: { disabled: true },
  });
}

async function status(baseURL: string, url: string, method = "GET") {
  const response = await authAt(baseURL).handler(new Request(url, { method }));
  return response.status;
}

describe("routerBasePath / authRelativePath", () => {
  it("takes the base path from the resolved baseURL", () => {
    expect(routerBasePath("http://localhost:3000/api/auth")).toBe("/api/auth");
    expect(routerBasePath("https://example.test/app")).toBe("/app");
    expect(routerBasePath("not a url")).toBeNull();
  });

  it("strips the base path and trailing slashes", () => {
    expect(authRelativePath("http://h/api/auth/sign-in/email/", "/api/auth")).toBe(
      "/sign-in/email",
    );
    expect(authRelativePath("http://h/api/auth", "/api/auth")).toBe("/");
    expect(authRelativePath("http://h/app/ok?x=1", "/app/")).toBe("/ok");
    expect(authRelativePath("http://h/other/ok", "/api/auth")).toBe("/other/ok");
  });
});

describe("httpAllowList with the router's base path", () => {
  it("default BETTER_AUTH_URL (no path): allowed path routes, others 404", async () => {
    const base = "http://localhost:3000";
    expect(await status(base, `${base}/api/auth/ok`)).toBe(200);
    expect(await status(base, `${base}/api/auth/ok`, "POST")).toBe(404);
    expect(await status(base, `${base}/api/auth/get-session`)).toBe(404);
    expect(await status(base, `${base}/api/auth/OK`)).toBe(404);
  });

  it("BETTER_AUTH_URL with a path: matches the router, which serves under that path", async () => {
    const base = "http://localhost:3000/app";
    expect(await status(base, "http://localhost:3000/app/ok")).toBe(200);
    expect(await status(base, "http://localhost:3000/app/get-session")).toBe(404);
    expect(await status(base, "http://localhost:3000/api/auth/ok")).toBe(404);
  });
});
