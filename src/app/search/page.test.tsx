import { render, screen } from "@testing-library/react";
import SearchPage from "./page";

describe("Search page", () => {
  it("searches the catalogue with the q param", async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ q: "LANTERN" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /The Lantern Keepers of Varro/ })).toBeInTheDocument();
  });

  it("treats a missing q as blank", async () => {
    render(await SearchPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Type a title name in the search box to find it.")).toBeInTheDocument();
  });
});
