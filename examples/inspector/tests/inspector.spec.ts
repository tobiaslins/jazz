import { expect, test } from "@playwright/test";
import { FileStream } from "jazz-tools";
import { createOrganization } from "./data";
import { createAccount, initializeKvStore } from "./lib";

initializeKvStore();
const { account, accountID, accountSecret } = await createAccount();

const organization = createOrganization();

test("should add and delete account in dropdown", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Account ID").fill(accountID);
  await page.getByLabel("Account secret").fill(accountSecret);
  await page.getByRole("button", { name: "Add account" }).click();

  await expect(page.getByText("Jazz CoValue Inspector")).toBeVisible();
  await page
    .getByLabel("Account to inspect")
    .selectOption(`Inspector test account <${accountID}>`);

  await page.getByRole("button", { name: "Remove account" }).click();
  await expect(page.getByText("Jazz CoValue Inspector")).not.toBeVisible();
  await expect(page.getByText("Add an account to inspect")).toBeVisible();
  await expect(
    page.getByText(`Inspector test account <${accountID}>`),
  ).not.toBeVisible();
});

test("should inspect account", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Account ID").fill(accountID);
  await page.getByLabel("Account secret").fill(accountSecret);
  await page.getByRole("button", { name: "Add account" }).click();
  await page.getByRole("button", { name: "Inspect my account" }).click();

  await expect(page.getByRole("heading", { name: accountID })).toBeVisible();
  await expect(page.getByText("👤 Account")).toBeVisible();

  await page.getByRole("button", { name: "profile {} CoMap name:" }).click();
  await expect(page.getByText("Role: admin")).toBeVisible();
});

test("should inspect CoValue", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Account ID").fill(accountID);
  await page.getByLabel("Account secret").fill(accountSecret);
  await page.getByRole("button", { name: "Add account" }).click();

  await account.waitForAllCoValuesSync(); // Ensures that the organization is uploaded

  await page.getByLabel("CoValue ID").fill(organization.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();

  await expect(page.getByText(/Garden Computing/)).toHaveCount(2);
  await expect(
    page.getByRole("heading", { name: organization.id }),
  ).toBeVisible();
  await expect(page.getByText("Role: admin")).toBeVisible();

  await page.getByRole("button", { name: /projects/ }).click();
  await expect(page.getByText("Showing 4 of 4")).toBeVisible();

  await page.getByRole("button", { name: "View" }).first().click();
  await expect(
    page.getByText("Jazz is a framework for building collaborative apps."),
  ).toBeVisible();

  await page.getByRole("button", { name: /issues/ }).click();
  await expect(page.getByText("Showing 3 of 3")).toBeVisible();
  await page.getByRole("button", { name: "View" }).first().click();

  await page.getByRole("button", { name: /labels/ }).click();
  // currently broken:
  // await expect(page.getByText("Showing 10 of 10")).toBeVisible();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(11);

  await page.getByRole("button", { name: "issues" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(4);

  await page.getByRole("button", { name: "projects" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(5);
});

test("should show CoValue type", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Account ID").fill(accountID);
  await page.getByLabel("Account secret").fill(accountSecret);
  await page.getByRole("button", { name: "Add account" }).click();

  await account.waitForAllCoValuesSync(); // Ensures that the organization is uploaded

  // Test FileStream
  const file = FileStream.create();
  file.start({ mimeType: "image/jpeg" });
  file.push(new Uint8Array([1, 2, 3]));
  file.end();
  await page.goto("/");
  await page.getByLabel("CoValue ID").fill(file.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("📃 FileStream")).toBeVisible();

  // Test ImageDefinition
  await page.goto("/");
  await page.getByLabel("CoValue ID").fill(organization.image.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("🖼️ Image")).toBeVisible();

  // Test CoMap
  await page.goto("/");
  await page.getByLabel("CoValue ID").fill(organization.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("{} CoMap")).toBeVisible();

  // Test CoList
  await page.goto("/");
  await page.getByLabel("CoValue ID").fill(organization.projects.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("☰ CoList")).toBeVisible();

  // Test CoFeed
  await page.goto("/");
  await page
    .getByLabel("CoValue ID")
    .fill(organization.projects[0].issues[0].reactions.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("≋ CoFeed")).toBeVisible();

  // Test Account
  await page.goto("/");
  await page.getByLabel("CoValue ID").fill(account.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("👤 Account")).toBeVisible();

  // Test Group
  await page.goto("/");
  await page.getByLabel("CoValue ID").fill(organization._owner.id);
  await page.getByRole("button", { name: "Inspect CoValue" }).click();
  await expect(page.getByText("👥 Group")).toBeVisible();
});
