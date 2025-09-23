import { setTimeout } from "node:timers/promises";
import { expect, test } from "@playwright/test";

test.describe("Connection Status", () => {
  test("should show connected state when online", async ({ page }) => {
    await page.goto("/connection-status");

    await expect(page.getByTestId("connected")).toBeVisible();
    await expect(page.getByTestId("connected")).toHaveText("true");
  });

  test("should transition from connected to disconnected and back", async ({
    page,
  }) => {
    const context = page.context();

    await page.goto("/connection-status");

    // Initially should be connected
    await expect(page.getByTestId("connected")).toBeVisible();
    await expect(page.getByTestId("connected")).toHaveText("true");

    // Go offline and wait for the ping timeout
    await context.setOffline(true);
    await page.waitForTimeout(5000);

    // Should show disconnected after the ping timeout
    await expect(page.getByTestId("connected")).toHaveText("false");

    // Go back online
    await context.setOffline(false);

    // Should show connected again
    await expect(page.getByTestId("connected")).toHaveText("true");
  });
});
