import { expect, test } from "@playwright/test";
import { expectNoHorizontalScroll, expectTouchTargets, gotoPage } from "./helpers";

// Baseline UI checks, now against Sign In (the M0 preview page at "/" was replaced
// by a redirect in M1).
test.describe("smoke", () => {
  test("/ sends signed-out visitors to Sign In", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("Sign In renders its heading and labelled form controls", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("has no horizontal scrolling", async ({ page }) => {
    for (const path of ["/sign-in", "/sign-up"]) {
      await gotoPage(page, path);
      await expectNoHorizontalScroll(page);
    }
  });

  test("controls meet the 44 px touch target minimum", async ({ page }) => {
    for (const path of ["/sign-in", "/sign-up"]) {
      await gotoPage(page, path);
      await expectTouchTargets(page);
    }
  });

  test("keyboard focus shows the visible focus ring", async ({ page }) => {
    await gotoPage(page, "/sign-in");
    // Tab until focus lands in TripMate's content (the dev server may add its own
    // focusable controls before it).
    const focused = page.getByRole("main").locator(":focus");
    for (let i = 0; i < 5 && (await focused.count()) === 0; i++) {
      await page.keyboard.press("Tab");
    }
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveAccessibleName("Email");
    const outline = await focused.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).toBe("solid");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test("unknown routes show the not-found page with a 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to TripMate home" })).toBeVisible();
  });
});
