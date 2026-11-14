import { expect, test } from "@playwright/test";
import {
  expectNoHorizontalScroll,
  expectTouchTargets,
  gotoPage,
  newAccount,
  signUp,
} from "./helpers";

test.describe("My Trips (Slice 1.2)", () => {
  test("a new user sees the empty state with a Create a trip action", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/trips");

    const empty = page.getByRole("region", { name: "No trips yet" });
    await expect(empty).toBeVisible();
    await expect(empty.getByRole("link", { name: "Create a trip" })).toHaveAttribute(
      "href",
      "/trips/new",
    );
    // No archived section when nothing is archived.
    await expect(page.getByText(/^Archived/)).toHaveCount(0);
  });

  test("fits the viewport with usable touch targets", async ({ page }) => {
    await signUp(page, newAccount());
    await gotoPage(page, "/trips");
    await expectNoHorizontalScroll(page);
    await expectTouchTargets(page);
  });
});
