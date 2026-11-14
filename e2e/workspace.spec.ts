import { expect, type Page } from "@playwright/test";
import {
  createTrip,
  expectNoHorizontalScroll,
  expectTouchTargets,
  newAccount,
  signOut,
  signUp,
  test,
} from "./helpers";

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

test.describe("Trip Workspace (Slice 1.4)", () => {
  test("creating a trip opens its Overview", async ({ page }) => {
    await signUp(page, newAccount());
    await createTrip(page);

    await expect(page.getByRole("heading", { level: 1, name: "Tokyo Autumn Trip" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("Tokyo, Japan");
    await expect(page.getByRole("main")).toContainText("Planning");
    await expect(page.getByRole("main")).toContainText(/Starts in \d+ days/);
    await expect(page.getByRole("main")).toContainText("7 days");
    await expect(page.getByRole("main")).toContainText("JPY — Yen");
    await expect(page.getByRole("main")).toContainText("Asia/Tokyo");
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);
  });

  test("every navigation destination opens an intentional page", async ({ page }) => {
    await signUp(page, newAccount());
    const base = await createTrip(page);
    const nav = page
      .getByRole("navigation", { name: "Trip", exact: true })
      .filter({ visible: true });

    const destinations = isMobile(page)
      ? [
          ["Today", "Today"],
          ["Plan", "Plan"],
          ["Add", "Add to trip"],
          ["Expenses", "Expenses"],
          ["Trip", "Tokyo Autumn Trip"],
        ]
      : [
          ["Today", "Today"],
          ["Plan", "Plan"],
          ["Expenses", "Expenses"],
          ["Trip", "Tokyo Autumn Trip"],
          ["Members", "Members"],
          ["Bookings", "Bookings"],
          ["Checklist", "Checklist"],
          ["Settings", "Trip settings"],
        ];

    for (const [label, heading] of destinations) {
      const link = nav.getByRole("link", { name: label!, exact: true });
      await link.click();
      await expect(page.getByRole("heading", { level: 1, name: heading! })).toBeVisible();
      await expect(link).toHaveAttribute("aria-current", "page");
      expect(new URL(page.url()).pathname.startsWith(base)).toBe(true);
      await expectNoHorizontalScroll(page);
    }

    // Trip-section pages reachable from the Overview on every screen size. Only
    // Settings is built in M1; the rest are intentional empty states.
    for (const [label, heading, built] of [
      ["Members", "Members", false],
      ["Bookings", "Bookings", false],
      ["Checklist", "Checklist", false],
      ["Trip settings", "Trip settings", true],
    ] as const) {
      await page.goto(base);
      await page
        .getByRole("navigation", { name: "Trip sections" })
        .getByRole("link", { name: label })
        .click();
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(page.getByText("Coming soon")).toHaveCount(built ? 0 : 1);
    }
  });

  test("Today shows a lifecycle headline before the trip starts", async ({ page }) => {
    await signUp(page, newAccount());
    const base = await createTrip(page);
    await page.goto(`${base}/today`);
    await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Trip status" })).toContainText(
      /Starts in \d+ days/,
    );
  });

  test("switching trips: back to My Trips and into another trip", async ({ page }) => {
    await signUp(page, newAccount());
    const first = await createTrip(page, "Tokyo Autumn Trip");
    const second = await createTrip(page, "Bangkok Weekend");

    if (isMobile(page)) {
      await page.getByRole("link", { name: "Trips" }).click();
      await expect(page).toHaveURL(/\/trips$/);
      await page.getByRole("link", { name: /Tokyo Autumn Trip/ }).click();
    } else {
      await page.locator("aside summary").click();
      await page.getByRole("link", { name: "Tokyo Autumn Trip" }).click();
    }
    await expect(page).toHaveURL(new RegExp(`${first}$`));
    await expect(page.getByRole("heading", { level: 1, name: "Tokyo Autumn Trip" })).toBeVisible();
    expect(first).not.toBe(second);
  });

  test("another user's trip URL shows Trip not found", async ({ page, browser }) => {
    await signUp(page, newAccount("Owner"));
    const base = await createTrip(page);

    const other = await browser.newPage();
    await signUp(other, newAccount("Someone else"));
    for (const path of [base, `${base}/settings`, `${base}/today`]) {
      await other.goto(path);
      await expect(other.getByRole("heading", { level: 1, name: "Trip not found" })).toBeVisible();
      await expect(other.getByText("Tokyo Autumn Trip")).toHaveCount(0);
    }
    // A trip id that does not exist looks exactly the same.
    await other.goto("/trips/00000000-0000-4000-8000-000000000000");
    await expect(other.getByRole("heading", { level: 1, name: "Trip not found" })).toBeVisible();
    await other.close();
  });

  test("an unauthenticated visit to a trip URL redirects to Sign In and back", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    const base = await createTrip(page);
    await page.goto("/trips");
    await signOut(page);

    await page.goto(`${base}/plan`);
    await expect(page).toHaveURL(/\/sign-in\?next=/);
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password").fill(account.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(new RegExp(`${base}/plan$`));
    await expect(page.getByRole("heading", { level: 1, name: "Plan" })).toBeVisible();
  });
});
