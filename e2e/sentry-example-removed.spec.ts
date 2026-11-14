import { expect, test } from "@playwright/test";

test.describe("Sentry example scaffolding", () => {
  test("the example page is gone", async ({ request }) => {
    const response = await request.get("/sentry-example-page");
    expect(response.status()).toBe(404);
  });

  test("the example API route is gone", async ({ request }) => {
    const response = await request.get("/api/sentry-example-api");
    expect(response.status()).toBe(404);
  });
});
