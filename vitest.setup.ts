import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// `server-only` throws outside a React Server Components bundle; tests import server modules directly.
vi.mock("server-only", () => ({}));
