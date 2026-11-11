import { expect, test } from "@playwright/test";

test.describe("home page marquee", () => {
  test("headlines the first result and numbers the rest from 2", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "All titles" })).toBeVisible();
    await expect(page.getByText("Most popular right now")).toBeVisible();

    const headline = page.getByRole("heading", { level: 2 }).first();
    await expect(headline).toBeVisible();
    await expect(headline.getByRole("link")).toHaveAttribute("href", /^\/title\/\d+/);

    const items = page.getByRole("list", { name: "Titles" }).getByRole("listitem");
    await expect(items).toHaveCount(19);
    await expect(items.first().getByTestId("rank")).toHaveText("2");
    await expect(items.last().getByTestId("rank")).toHaveText("20");
  });

  test("the headline is in the marquee face and spans the window", async ({ page }) => {
    await page.goto("/");
    const headline = page.getByRole("heading", { level: 2 }).first();
    await expect(headline).toHaveCSS("font-family", /Anton/);
    await expect(headline).toHaveCSS("text-transform", "uppercase");

    const hero = page.locator("section").filter({ has: page.getByRole("heading", { level: 1 }) });
    const box = await hero.boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeLessThanOrEqual(0);
    expect(box!.x + box!.width).toBeGreaterThanOrEqual(viewport.width - 20);
    // Nothing the hero does may make the page scroll sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("opens the headlined title", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("heading", { level: 2 }).first().getByRole("link");
    const name = (await link.textContent())!;
    await link.click();
    await expect(page).toHaveURL(/\/title\/\d+/);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  });

  test("switching to TV keeps the marquee and lists series", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Movies or TV" }).getByRole("link", { name: "TV" }).click();
    await expect(page).toHaveURL(/type=tv/);
    await expect(page.getByRole("heading", { level: 1, name: "All series" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 }).first().getByRole("link")).toHaveAttribute("href", /^\/tv\/\d+/);
  });

  test("a genre and a sort change the heading and the reason the title leads", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Genre" }).getByRole("link", { name: "Drama" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Drama titles" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Genre" }).getByRole("link", { name: "Drama" })).toHaveAttribute("aria-current", "true");

    await page.getByRole("navigation", { name: "Sort" }).getByRole("link", { name: "Top rated" }).click();
    await expect(page).toHaveURL(/sort=rating/);
    await expect(page.getByText("Highest rated")).toBeVisible();
  });

  test("the filter bar stays in view while the results scroll", async ({ page }) => {
    await page.goto("/");
    const sort = page.getByRole("navigation", { name: "Sort" });
    await page.getByRole("navigation", { name: "Pagination" }).scrollIntoViewIfNeeded();
    await expect(sort).toBeInViewport();
  });

  test("page 2 carries the numbering on and names the page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: /Next/ }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Page 2", { exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Titles" }).getByRole("listitem").first().getByTestId("rank")).toHaveText("22");
  });
});
