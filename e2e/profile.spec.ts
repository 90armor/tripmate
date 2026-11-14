import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalScroll,
  expectTouchTargets,
  gotoPage,
  newAccount,
  signIn,
  signOut,
  signUp,
} from "./helpers";

test.describe("profile (Slice 1.1, D18)", () => {
  test("display name is editable and persists; email is read-only", async ({ page }) => {
    const account = newAccount("Before Name");
    await signUp(page, account);
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Profile" })).toBeVisible();

    await expect(page.getByText(account.email)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);

    const name = page.getByLabel("Display name");
    await expect(name).toHaveValue("Before Name");
    await name.fill("  After Name  ");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Profile saved." })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Display name")).toHaveValue("After Name");
    await page.goto("/trips");
    await expect(page.getByText("Signed in as After Name.")).toBeVisible();
  });

  test("a blank display name shows a field error and changes nothing", async ({ page }) => {
    await signUp(page, newAccount("Keep Me"));
    await gotoPage(page, "/profile");
    await page.getByLabel("Display name").fill("   ");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByLabel("Display name")).toHaveAccessibleDescription(/Enter your name/);

    await page.reload();
    await expect(page.getByLabel("Display name")).toHaveValue("Keep Me");
  });

  test("fits small screens with usable touch targets", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/profile");
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);
  });

  test("requires sign-in and returns to Profile", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    await signOut(page);
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fprofile$/);
    await signIn(page, account);
    await expect(page).toHaveURL(/\/profile$/);
  });
});
