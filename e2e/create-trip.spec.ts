import { expect, test, type Page } from "@playwright/test";
import {
  expectNoHorizontalScroll,
  expectTouchTargets,
  fieldErrors,
  gotoPage,
  loadWithoutHydration,
  newAccount,
  signIn,
  signOut,
  signUp,
} from "./helpers";

/** YYYY-MM-DD, `days` from today (UTC). Far enough ahead to be PLANNING in every timezone. */
function daysFromToday(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function fillTrip(
  page: Page,
  trip: { name: string; destination: string; start: string; end: string; tz: string; ccy: string },
) {
  await page.getByLabel("Trip name").fill(trip.name);
  await page.getByLabel("Destination").fill(trip.destination);
  await page.getByLabel("Start date").fill(trip.start);
  await page.getByLabel("End date").fill(trip.end);
  await page.getByLabel("Trip timezone").fill(trip.tz);
  await page.getByLabel("Base currency").selectOption(trip.ccy);
}

const TOKYO = {
  name: "Tokyo Autumn Trip",
  destination: "Tokyo, Japan",
  start: daysFromToday(60),
  end: daysFromToday(66),
  tz: "Asia/Tokyo",
  ccy: "JPY",
};

test.describe("Create Trip (Slice 1.3)", () => {
  test("creates a trip from the empty state and lists it in My Trips", async ({ page }) => {
    await signUp(page, newAccount());
    await page.getByRole("link", { name: "Create a trip" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Create a trip" })).toBeVisible();

    // No timezone or currency is preselected (D15).
    await expect(page.getByLabel("Trip timezone")).toHaveValue("");
    await expect(page.getByLabel("Base currency")).toHaveValue("");

    await fillTrip(page, TOKYO);
    await page.getByRole("button", { name: "Create trip" }).click();
    await expect(page).toHaveURL(/\/trips\/[0-9a-f-]{36}$/);

    await gotoPage(page, "/trips");
    const card = page.getByRole("article").filter({ hasText: "Tokyo Autumn Trip" });
    await expect(card).toContainText("Tokyo, Japan");
    await expect(card).toContainText("Planning · 1 traveler");
    await expect(page.getByRole("region", { name: "No trips yet" })).toHaveCount(0);
  });

  test("the trip is still there after signing out and back in", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    await gotoPage(page, "/trips/new");
    await fillTrip(page, { ...TOKYO, name: "Seoul Weekend", tz: "Asia/Seoul", ccy: "KRW" });
    await page.getByRole("button", { name: "Create trip" }).click();
    await expect(page).toHaveURL(/\/trips\/[0-9a-f-]{36}$/);

    await gotoPage(page, "/trips");
    await signOut(page);
    await signIn(page, account);
    await expect(page.getByRole("article").filter({ hasText: "Seoul Weekend" })).toBeVisible();
  });

  test("shows accessible errors and keeps the input", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/trips/new");
    await fillTrip(page, { ...TOKYO, start: daysFromToday(66), end: daysFromToday(60), tz: "" });
    await page.getByRole("button", { name: "Create trip" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText("Check the highlighted");
    await expect(page.getByLabel("End date")).toHaveAccessibleDescription(
      /can’t be before the start date/,
    );
    await expect(page.getByLabel("Trip timezone")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Trip timezone")).toHaveAccessibleDescription(/Choose a timezone/);
    // What the traveler typed is still there.
    await expect(page.getByLabel("Trip name")).toHaveValue(TOKYO.name);
    await expect(page.getByLabel("Base currency")).toHaveValue("JPY");
  });

  test("keeps every value after a server round-trip without hydration", async ({ page }) => {
    await signUp(page, newAccount());
    const expectUnhydrated = await loadWithoutHydration(page);
    await gotoPage(page, "/trips/new");
    await expectUnhydrated();

    await fillTrip(page, { ...TOKYO, tz: "" });
    await page.getByRole("button", { name: "Create trip" }).click();

    // A native POST: the server re-renders the form with its state.
    await expect(page.getByLabel("Trip timezone")).toHaveAccessibleDescription(/Choose a timezone/);
    await expectUnhydrated();
    await expect(page).toHaveURL(/\/trips\/new$/);
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Check the highlighted");
    expect(await fieldErrors(page)).toEqual(["Choose a timezone"]);
    await expect(page.getByLabel("Trip name")).toHaveValue(TOKYO.name);
    await expect(page.getByLabel("Destination")).toHaveValue(TOKYO.destination);
    await expect(page.getByLabel("Start date")).toHaveValue(TOKYO.start);
    await expect(page.getByLabel("End date")).toHaveValue(TOKYO.end);
    await expect(page.getByLabel("Trip timezone")).toHaveValue("");
    await expect(page.getByLabel("Base currency")).toHaveValue(TOKYO.ccy);
  });

  test("rejects a timezone that is not in the list", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/trips/new");
    await fillTrip(page, { ...TOKYO, tz: "Tokyo" });
    await page.getByRole("button", { name: "Create trip" }).click();
    await expect(page.getByLabel("Trip timezone")).toHaveAccessibleDescription(/from the list/);
    await expect(page).toHaveURL(/\/trips\/new$/);
  });

  test("fits the viewport with usable touch targets", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/trips/new");
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);
  });

  test("no field is wider than its card, empty or filled", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/trips/new");
    const form = page.getByRole("main").locator("form");

    const overflowing = () =>
      form.evaluate((element) => {
        const card = element.parentElement!.getBoundingClientRect();
        return [...element.querySelectorAll("input:not([type=hidden]), select")]
          .filter((control) => {
            const box = control.getBoundingClientRect();
            return box.left < card.left - 0.5 || box.right > card.right + 0.5;
          })
          .map((control) => (control as HTMLInputElement).name);
      });

    expect(await overflowing()).toEqual([]);
    // Date inputs are drawn differently once they hold a value.
    await fillTrip(page, TOKYO);
    expect(await overflowing()).toEqual([]);
  });

  test("requires sign-in", async ({ page }) => {
    await page.goto("/trips/new");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Ftrips%2Fnew$/);
  });
});
