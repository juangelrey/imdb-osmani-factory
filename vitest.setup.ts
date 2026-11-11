import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// `server-only` throws outside a React Server Components bundle; tests import server modules directly.
vi.mock("server-only", () => ({}));

// Next's compiler replaces `next/font` calls at build time; outside it the font functions do not exist.
vi.mock("next/font/google", () => ({ Anton: () => ({ className: "font-anton", variable: "font-anton-variable" }) }));
