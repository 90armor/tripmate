import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";
import {
  createTrip,
  daysFromToday,
  expectNoHorizontalScroll,
  expectTouchTargets,
  fieldErrors,
  gotoPage,
  loadWithoutHydration,
  newAccount,
  signIn,
  signOut,
  signUp,
  test,
} from "./helpers";

const KYOTO = {
  name: "Kyoto & Osaka",
  destination: "Kyoto, Japan",
  start: daysFromToday(70),
  end: daysFromToday(73),
  tz: "Asia/Tokyo",
  ccy: "USD",
};

async function openSettings(page: Page, tripPath: string) {
  await gotoPage(page, `${tripPath}/settings`);
  await expect(page.getByRole("heading", { level: 1, name: "Trip settings" })).toBeVisible();
}

/** The "Archived (n)" summary of the collapsed section in My Trips. */
const archivedSection = (page: Page) => page.getByRole("main").locator("details");

test.describe("Trip Settings (Slice 1.5)", () => {
  test("the owner's edits persist after reload", async ({ page }) => {
    await signUp(page, newAccount());
    const trip = await createTrip(page);
    await openSettings(page, trip);

    // Prefilled with the trip as created; status follows the dates.
    await expect(page.getByLabel("Trip name")).toHaveValue("Tokyo Autumn Trip");
    await expect(page.getByLabel("Base currency")).toHaveValue("JPY");
    await expect(page.getByLabel("Trip status")).toHaveValue("");
    await expect(page.getByLabel("Trip status").locator("option").first()).toHaveText(
      "Automatic (Planning)",
    );

    await page.getByLabel("Trip name").fill(KYOTO.name);
    await page.getByLabel("Destination").fill(KYOTO.destination);
    await page.getByLabel("Start date").fill(KYOTO.start);
    await page.getByLabel("End date").fill(KYOTO.end);
    await page.getByLabel("Base currency").selectOption(KYOTO.ccy);
    await page.getByLabel("Trip status").selectOption("COMPLETED");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Trip settings saved." }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Trip name")).toHaveValue(KYOTO.name);
    await expect(page.getByLabel("Destination")).toHaveValue(KYOTO.destination);
    await expect(page.getByLabel("Start date")).toHaveValue(KYOTO.start);
    await expect(page.getByLabel("End date")).toHaveValue(KYOTO.end);
    await expect(page.getByLabel("Trip timezone")).toHaveValue(KYOTO.tz);
    await expect(page.getByLabel("Base currency")).toHaveValue(KYOTO.ccy);
    await expect(page.getByLabel("Trip status")).toHaveValue("COMPLETED");

    // The rest of the workspace shows the new details too.
    await gotoPage(page, trip);
    await expect(page.getByRole("heading", { level: 1, name: KYOTO.name })).toBeVisible();
    await expect(page.getByRole("main")).toContainText(KYOTO.destination);
    await expect(page.getByRole("main")).toContainText("Completed (set manually)");

    // Back to automatic clears the override.
    await openSettings(page, trip);
    await page.getByLabel("Trip status").selectOption("");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Trip settings saved." }),
    ).toBeVisible();
    await gotoPage(page, trip);
    await expect(page.getByRole("main")).not.toContainText("set manually");
  });

  test("shows accessible errors and saves nothing", async ({ page }) => {
    await signUp(page, newAccount());
    const trip = await createTrip(page);
    await openSettings(page, trip);

    await page.getByLabel("Trip name").fill("");
    await page.getByLabel("End date").fill(daysFromToday(50));
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText("Check the highlighted");
    await expect(page.getByLabel("Trip name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Trip name")).toHaveAccessibleDescription(/Enter a trip name/);
    await expect(page.getByLabel("End date")).toHaveAccessibleDescription(
      /can’t be before the start date/,
    );
    await page.reload();
    await expect(page.getByLabel("Trip name")).toHaveValue("Tokyo Autumn Trip");
  });

  test("keeps every value after a server round-trip without hydration", async ({ page }) => {
    await signUp(page, newAccount());
    const trip = await createTrip(page);
    const expectUnhydrated = await loadWithoutHydration(page);
    await openSettings(page, trip);
    await expectUnhydrated();

    await page.getByLabel("Trip name").fill(KYOTO.name);
    await page.getByLabel("Destination").fill(KYOTO.destination);
    await page.getByLabel("Start date").fill(KYOTO.start);
    await page.getByLabel("End date").fill(KYOTO.end);
    await page.getByLabel("Trip timezone").fill("");
    await page.getByLabel("Base currency").selectOption(KYOTO.ccy);
    await page.getByLabel("Trip status").selectOption("UPCOMING");
    await page.getByRole("button", { name: "Save changes" }).click();

    // A native POST: the server re-renders the form with its state.
    await expect(page.getByLabel("Trip timezone")).toHaveAccessibleDescription(/Choose a timezone/);
    await expectUnhydrated();
    await expect(page).toHaveURL(new RegExp(`${trip}/settings$`));
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Check the highlighted");
    expect(await fieldErrors(page)).toEqual(["Choose a timezone"]);
    await expect(page.getByLabel("Trip name")).toHaveValue(KYOTO.name);
    await expect(page.getByLabel("Destination")).toHaveValue(KYOTO.destination);
    await expect(page.getByLabel("Start date")).toHaveValue(KYOTO.start);
    await expect(page.getByLabel("End date")).toHaveValue(KYOTO.end);
    await expect(page.getByLabel("Trip timezone")).toHaveValue("");
    await expect(page.getByLabel("Base currency")).toHaveValue(KYOTO.ccy);
    await expect(page.getByLabel("Trip status")).toHaveValue("UPCOMING");
  });

  test("archive moves the trip to Archived; unarchive brings it back", async ({ page }) => {
    await signUp(page, newAccount());
    const trip = await createTrip(page);
    await openSettings(page, trip);
    const main = page.getByRole("main");

    // Cancel keeps the trip active.
    await main.getByRole("button", { name: "Archive trip", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Archive this trip?" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await expectNoHorizontalScroll(page);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    // Escape closes it too.
    await main.getByRole("button", { name: "Archive trip", exact: true }).click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await main.getByRole("button", { name: "Archive trip", exact: true }).click();
    await dialog.getByRole("button", { name: "Archive trip", exact: true }).click();
    await expect(page.getByRole("heading", { name: "This trip is archived" })).toBeVisible();
    // Read-only now (ROADMAP D22): no form, no archive action.
    await expect(main.getByRole("button", { name: "Save changes" })).toHaveCount(0);
    await expect(main.getByRole("button", { name: "Archive trip", exact: true })).toHaveCount(0);
    await expect(main).toContainText("Tokyo Autumn Trip");

    // My Trips: only in the collapsed Archived section.
    await gotoPage(page, "/trips");
    await expect(archivedSection(page).locator("summary")).toHaveText("Archived (1)");
    const card = page.getByRole("article").filter({ hasText: "Tokyo Autumn Trip" });
    await expect(card).toBeHidden();
    await archivedSection(page).locator("summary").click();
    await expect(card).toBeVisible();

    // Open it from the Archived section and unarchive.
    await card.getByRole("link").click();
    await expect(page.getByRole("main")).toContainText("This trip is archived");
    await openSettings(page, trip);
    await main.getByRole("button", { name: "Unarchive trip" }).click();
    await expect(main.getByRole("button", { name: "Save changes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "This trip is archived" })).toHaveCount(0);

    await gotoPage(page, "/trips");
    await expect(archivedSection(page)).toHaveCount(0);
    await expect(page.getByRole("article").filter({ hasText: "Tokyo Autumn Trip" })).toBeVisible();
  });

  test("after signing out and back in, the edited trip opens", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    const trip = await createTrip(page);
    await openSettings(page, trip);
    await page.getByLabel("Trip name").fill(KYOTO.name);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Trip settings saved." }),
    ).toBeVisible();

    await gotoPage(page, "/trips");
    await signOut(page);
    await signIn(page, account);
    await expect(page).toHaveURL(/\/trips$/);
    await page.getByRole("article").filter({ hasText: KYOTO.name }).getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`${trip}$`));
    await expect(page.getByRole("heading", { level: 1, name: KYOTO.name })).toBeVisible();
  });

  test("fits the viewport with usable touch targets", async ({ page }) => {
    await signUp(page, newAccount());
    const trip = await createTrip(page);
    await openSettings(page, trip);
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);
  });

  test("requires sign-in and hides other users' trips", async ({ page }) => {
    await signUp(page, newAccount("Owner"));
    const trip = await createTrip(page);
    await gotoPage(page, "/trips");
    await signOut(page);

    await page.goto(`${trip}/settings`);
    await expect(page).toHaveURL(
      new RegExp(`/sign-in\\?next=${encodeURIComponent(`${trip}/settings`)}$`),
    );

    await signUp(page, newAccount("Someone else"));
    await page.goto(`${trip}/settings`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/not found/i);

    await page.goto(`/trips/${randomUUID()}/settings`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/not found/i);
  });
});
