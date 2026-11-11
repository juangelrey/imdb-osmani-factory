import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;

/**
 * End-to-end tests in `e2e/`, run with `pnpm e2e` against the dev server and the real TMDB API, so they need
 * `TMDB_READ_ACCESS_TOKEN` in `.env`. They assert structure (a headline, ranks, filters), never which titles TMDB
 * returns. CI does not run them: it has no token.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  // With one worker per core, page loads against `next dev` never finish; two run cleanly.
  workers: 2,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: `http://localhost:${PORT}`,
    // Next allows one dev server per project, so a running one is used as it is.
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
