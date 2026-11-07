import { render, screen, within } from "@testing-library/react";
import Home from "./page";

async function renderHome(params: Record<string, string> = {}) {
  render(await Home({ searchParams: Promise.resolve(params) }));
}

function gridNames() {
  const grid = screen.getByRole("list", { name: "Titles" });
  return within(grid)
    .getAllByRole("listitem")
    .map((item) => within(item).getByRole("heading").textContent);
}

describe("Home page", () => {
  it("lists every title by default", async () => {
    await renderHome();
    expect(screen.getByRole("heading", { level: 1, name: "All titles" })).toBeInTheDocument();
    expect(gridNames()).toHaveLength(50);
  });

  it("filters by genre and marks the active controls", async () => {
    await renderHome({ genre: "Western", sort: "name" });
    expect(screen.getByRole("heading", { level: 1, name: "Western titles" })).toBeInTheDocument();
    expect(gridNames()).toHaveLength(4);
    const genres = screen.getByRole("navigation", { name: "Genre" });
    expect(within(genres).getByRole("link", { name: "Western" })).toHaveAttribute("aria-current", "page");
    expect(within(genres).getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Name" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the genre when changing the sort", async () => {
    await renderHome({ genre: "Drama" });
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Year" })).toHaveAttribute("href", "/?genre=Drama&sort=year");
  });

  it("sorts by name when asked", async () => {
    await renderHome({ sort: "name" });
    const names = gridNames() as string[];
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
  });
});
