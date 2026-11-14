import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

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

/** Every button and link in <main> meets the 44×44 px minimum (DESIGN_SYSTEM §22). */
export async function expectTouchTargets(page: Page) {
  const targets = await page
    .getByRole("main")
    .locator("button, a[href], input:not([type=hidden]), select")
    .all();
  expect(targets.length).toBeGreaterThan(0);
  for (const target of targets) {
    const box = await target.boundingBox();
    const name = (await target.getAttribute("aria-label")) ?? (await target.innerText());
    expect(box, `bounding box for "${name}"`).not.toBeNull();
    expect.soft(box!.height, `height of "${name}"`).toBeGreaterThanOrEqual(44);
  }
}
