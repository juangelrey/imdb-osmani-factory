import { render, screen, within } from "@testing-library/react";
import { listTitles } from "@/lib/seed-catalog/queries";
import { STORAGE_KEY } from "@/lib/watchlist/watchlist";
import { WatchlistView } from "./watchlist-view";

const titles = listTitles().map(({ slug, name, year, rating }) => ({ slug, name, year, rating }));

beforeEach(() => {
  localStorage.clear();
});

describe("WatchlistView", () => {
  it("shows an empty state with a link back to browse", () => {
    render(<WatchlistView titles={titles} />);
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse titles" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("list", { name: "Titles" })).not.toBeInTheDocument();
  });

  it("lists saved titles in the order they were saved", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["saltwind-overture", "the-lantern-keepers-of-varro"]));
    render(<WatchlistView titles={titles} />);
    const grid = screen.getByRole("list", { name: "Titles" });
    expect(within(grid).getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "Saltwind Overture",
      "The Lantern Keepers of Varro",
    ]);
  });

  it("shows the empty state for corrupt storage", () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    render(<WatchlistView titles={titles} />);
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
  });

  it("drops slugs that are no longer in the catalogue", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["gone-for-good", "saltwind-overture"]));
    render(<WatchlistView titles={titles} />);
    const grid = screen.getByRole("list", { name: "Titles" });
    expect(within(grid).getAllByRole("listitem")).toHaveLength(1);
  });
});
