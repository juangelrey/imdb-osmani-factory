import { render, screen, within } from "@testing-library/react";
import { BrowseControls } from "./browse-controls";
import type { BrowseState } from "@/lib/catalog/browse-params";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
];

function renderControls(state: Partial<BrowseState> = {}) {
  render(<BrowseControls genres={GENRES} state={{ kind: "movie", genres: [], sort: "popularity", page: 1, ...state }} />);
  return screen.getByRole("navigation", { name: "Genre" });
}

describe("BrowseControls genre pills", () => {
  it("marks every selected genre current and nothing else", () => {
    const nav = renderControls({ genres: [28, 35] });
    expect(within(nav).getByRole("link", { name: "Action" })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByRole("link", { name: "Comedy" })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByRole("link", { name: "Drama" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
  });

  it("removes a selected genre from the selection", () => {
    const nav = renderControls({ genres: [28, 35] });
    expect(within(nav).getByRole("link", { name: "Action" })).toHaveAttribute("href", "/?genre=35");
    expect(within(nav).getByRole("link", { name: "Comedy" })).toHaveAttribute("href", "/?genre=28");
  });

  it("adds an unselected genre in ascending order", () => {
    const nav = renderControls({ genres: [28, 35] });
    expect(within(nav).getByRole("link", { name: "Drama" })).toHaveAttribute("href", "/?genre=18,28,35");
  });

  it("links the last selected genre back to all genres", () => {
    const nav = renderControls({ genres: [28] });
    expect(within(nav).getByRole("link", { name: "Action" })).toHaveAttribute("href", "/");
  });

  it("clears every genre with All", () => {
    expect(within(renderControls({ genres: [28, 35] })).getByRole("link", { name: "All" })).toHaveAttribute("href", "/");
  });

  it("marks All current when no genre is selected", () => {
    expect(within(renderControls()).getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "true");
  });

  it("drops the page and keeps sort and type on every pill", () => {
    const nav = renderControls({ kind: "tv", genres: [28, 35], sort: "rating", page: 3 });
    const hrefs = within(nav).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([
      "/?type=tv&sort=rating",
      "/?type=tv&genre=35&sort=rating",
      "/?type=tv&genre=28&sort=rating",
      "/?type=tv&genre=18,28,35&sort=rating",
    ]);
  });
});
