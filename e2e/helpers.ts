import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";

/**
 * `test` with the Next.js Dev Tools button hidden. `next dev` floats it in the
 * bottom-left corner, where it covers the mobile bottom navigation and blocks
 * clicks; production builds do not render it. Test-only, so the owner's own dev
 * server keeps its dev tools.
 */
export const test = base.extend({
  // The fixture callback is positional; not named `use`, which the React hooks lint rule claims.
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      const hide = () => {
        const style = document.createElement("style");
        style.textContent = "nextjs-portal { display: none !important; }";
        document.head.append(style);
      };
      if (document.head) hide();
      else document.addEventListener("DOMContentLoaded", hide);
    });
    await provide(page);
  },
});

/**
 * Loads later pages without hydrating them: the client JS chunks are blocked,
 * while the inline scripts that reveal streamed content still run. This is what
 * a phone sees when the bundle fails to load, so forms must still work as plain
 * HTML forms (progressive enhancement). Returns a check that the page really is
 * unhydrated, so a test cannot pass by accident with React attached.
 */
export async function loadWithoutHydration(page: Page) {
  await page.route(/\/_next\/static\/chunks\/.*\.js(\?.*)?$/, (route) => route.abort());
  return async () => {
    const hydrated = await page
      .locator("main form")
      .first()
      .evaluate((form) => Object.keys(form).some((key) => key.startsWith("__react")));
    expect(hydrated, "the form should not be hydrated").toBe(false);
  };
}

/** Text of every inline field error in the page's main form. */
export async function fieldErrors(page: Page): Promise<string[]> {
  return page.getByRole("main").locator("form [id$='-error']").allInnerTexts();
}

/** YYYY-MM-DD, `days` from today (UTC). 60+ days ahead is PLANNING in every timezone. */
export function daysFromToday(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Creates a trip through the UI as the signed-in user and returns its path. */
export async function createTrip(page: Page, name = "Tokyo Autumn Trip"): Promise<string> {
  await page.goto("/trips/new");
  await page.getByLabel("Trip name").fill(name);
  await page.getByLabel("Destination").fill("Tokyo, Japan");
  await page.getByLabel("Start date").fill(daysFromToday(60));
  await page.getByLabel("End date").fill(daysFromToday(66));
  await page.getByLabel("Trip timezone").fill("Asia/Tokyo");
  await page.getByLabel("Base currency").selectOption("JPY");
  await page.getByRole("button", { name: "Create trip" }).click();
  await expect(page).toHaveURL(/\/trips\/[0-9a-f-]{36}$/);
  return new URL(page.url()).pathname;
}

export const TEST_PASSWORD = "e2e-password-123";

export type TestAccount = { displayName: string; email: string; password: string };

/** A fresh account per test, so parallel tests never share data. */
export function newAccount(displayName = "E2E Traveler"): TestAccount {
  return { displayName, email: `e2e.${randomUUID()}@example.com`, password: TEST_PASSWORD };
}

export async function signUp(page: Page, account: TestAccount) {
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(account.displayName);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/trips$/);
}

export async function signIn(page: Page, account: Pick<TestAccount, "email" | "password">) {
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
}

/**
 * Navigates and waits for the page's own h1. Dynamic pages stream in behind the
 * root loading fallback, so checks that run right after goto() could otherwise
 * inspect the fallback instead of the page.
 */
export async function gotoPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

/**
 * Every visible button, link and control in <main> meets the 44×44 px minimum
 * (DESIGN_SYSTEM §22). Closed dialogs and collapsed sections are skipped.
 */
export async function expectTouchTargets(page: Page) {
  const targets = await page
    .getByRole("main")
    .locator("button, a[href], input:not([type=hidden]), select")
    .filter({ visible: true })
    .all();
  expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    const box = await target.boundingBox();
    const name = (await target.getAttribute("aria-label")) ?? (await target.innerText());
    expect(box, `bounding box for "${name}"`).not.toBeNull();
    expect.soft(box!.height, `height of "${name}"`).toBeGreaterThanOrEqual(44);
  }
}
