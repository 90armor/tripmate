import { expect, test } from "@playwright/test";
import { newAccount, signIn, signOut, signUp } from "./helpers";

test.describe("authentication (Slice 1.1)", () => {
  test("sign up lands on My Trips; sign out and sign back in", async ({ page }) => {
    const account = newAccount("Phyo");
    await signUp(page, account);
    await expect(page.getByRole("heading", { level: 1, name: "My Trips" })).toBeVisible();
    await expect(page.getByText("Signed in as Phyo.")).toBeVisible();

    await signOut(page);
    // Email case does not matter (D10).
    await signIn(page, { ...account, email: account.email.toUpperCase() });
    await expect(page).toHaveURL(/\/trips$/);
    await expect(page.getByRole("heading", { level: 1, name: "My Trips" })).toBeVisible();
  });

  test("protected pages redirect to Sign In and return afterwards", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    await signOut(page);

    await page.goto("/trips");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Ftrips$/);
    await signIn(page, account);
    await expect(page).toHaveURL(/\/trips$/);
  });

  test("an unsafe next parameter falls back to My Trips", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    await signOut(page);

    await page.goto("/sign-in?next=https%3A%2F%2Fevil.example%2F");
    await signIn(page, account);
    await expect(page).toHaveURL(/localhost:3100\/trips$/);
  });

  test("signed-in users visiting Sign In or Sign Up go to My Trips", async ({ page }) => {
    await signUp(page, newAccount());
    for (const path of ["/sign-in", "/sign-up", "/"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/trips$/);
    }
  });

  test("a wrong password shows an accessible error and keeps the email", async ({ page }) => {
    const account = newAccount();
    await signUp(page, account);
    await signOut(page);

    await signIn(page, { email: account.email, password: "not-the-password" });
    await expect(page.getByRole("main").getByRole("alert")).toContainText("don’t match");
    await expect(page.getByLabel("Email")).toHaveValue(account.email);
    await expect(page.getByLabel("Password")).toHaveValue("");
  });

  test("sign-up validation errors are linked to their fields", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Your name")).toHaveAccessibleDescription(/Enter your name/);
    await expect(page.getByLabel("Email")).toHaveAccessibleDescription(/valid email/);
    await expect(page.getByLabel("Password")).toHaveAccessibleDescription(/at least 8/i);
  });

  test("a duplicate email is rejected with neutral wording", async ({ page, browser }) => {
    const account = newAccount();
    await signUp(page, account);

    const other = await browser.newPage();
    await other.goto("/sign-up");
    await other.getByLabel("Your name").fill("Someone Else");
    await other.getByLabel("Email").fill(account.email);
    await other.getByLabel("Password").fill("another-password-1");
    await other.getByRole("button", { name: "Create account" }).click();
    await expect(other.getByRole("main").getByRole("alert")).toContainText(
      "couldn’t create an account",
    );
    await expect(other).toHaveURL(/\/sign-up/);
    await other.close();
  });
});
