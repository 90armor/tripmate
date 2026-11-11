import { expect, test } from "@playwright/test";

test.describe("foundation smoke", () => {
  test("renders the main heading and labelled form controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "TripMate" })).toBeVisible();
    await expect(page.getByLabel("Trip name")).toBeVisible();
    await expect(page.getByLabel("Notes")).toBeVisible();
  });

  test("has no horizontal scrolling", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("every button meets the 44×44 px touch target minimum", async ({ page }) => {
    await page.goto("/");
    // Scoped to the page content: the dev server injects its own (smaller) Next.js
    // Dev Tools button outside <main>, which is not part of TripMate's UI.
    const buttons = await page.getByRole("main").getByRole("button").all();
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      const box = await button.boundingBox();
      const name = (await button.getAttribute("aria-label")) ?? (await button.innerText());
      expect(box, `bounding box for "${name}"`).not.toBeNull();
      expect.soft(box!.width, `width of "${name}"`).toBeGreaterThanOrEqual(44);
      expect.soft(box!.height, `height of "${name}"`).toBeGreaterThanOrEqual(44);
    }
  });

  test("keyboard focus shows the visible focus ring", async ({ page }) => {
    await page.goto("/");
    // Tab until focus lands in TripMate's content (the dev server may add its own
    // focusable controls before it).
    const focused = page.getByRole("main").locator(":focus");
    for (let i = 0; i < 5 && (await focused.count()) === 0; i++) {
      await page.keyboard.press("Tab");
    }
    await expect(focused).toHaveCount(1);
    await expect(focused).toHaveAccessibleName("More options (preview)");
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
