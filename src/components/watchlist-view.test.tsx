import { render, screen, within } from "@testing-library/react";
import { STORAGE_KEY, type WatchlistEntry } from "@/lib/watchlist/watchlist";
import { WatchlistView } from "./watchlist-view";

const matrix: WatchlistEntry = { id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.2, posterPath: "/m.jpg" };
const inception: WatchlistEntry = { id: 27205, slug: "inception", name: "Inception", rating: 8.4 };

beforeEach(() => {
  localStorage.clear();
});

describe("WatchlistView", () => {
  it("shows an empty state with a link back to browse", () => {
    render(<WatchlistView />);
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse titles" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("list", { name: "Titles" })).not.toBeInTheDocument();
  });

  it("lists saved movies from their snapshots in the order they were saved", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([inception, matrix]));
    render(<WatchlistView />);
    const grid = screen.getByRole("list", { name: "Titles" });
    expect(within(grid).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Inception", "The Matrix"]);
  });

  it("links to each title page and shows the grid-size poster", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([matrix]));
    const { container } = render(<WatchlistView />);
    expect(screen.getByRole("link", { name: /The Matrix/ })).toHaveAttribute("href", "/title/603-the-matrix");
    expect(container.querySelector("img")).toHaveAttribute("src", "https://image.tmdb.org/t/p/w342/m.jpg");
  });

  it("shows the empty state for corrupt storage", () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    render(<WatchlistView />);
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
  });

  it("ignores the old v1 watchlist", () => {
    localStorage.setItem("reelbase:watchlist:v1", JSON.stringify(["saltwind-overture"]));
    render(<WatchlistView />);
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
  });
});
