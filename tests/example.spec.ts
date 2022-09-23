import { test, expect } from "@playwright/test";

test("basic test", async ({ page }) => {
  await page.goto("/");
  const title = page.locator("main h1");
  await expect(title).toHaveText("astro.new");
});
