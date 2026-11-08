import { render, screen, within } from "@testing-library/react";
import { STORAGE_KEY, type WatchlistEntry } from "@/lib/watchlist/watchlist";
import { WatchlistView } from "./watchlist-view";

const matrix: WatchlistEntry = { kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.2, posterPath: "/m.jpg" };
const inception: WatchlistEntry = { kind: "movie", id: 27205, slug: "inception", name: "Inception", rating: 8.4 };
const breakingBad: WatchlistEntry = { kind: "tv", id: 1396, slug: "breaking-bad", name: "Breaking Bad", year: 2008, posterPath: "/b.jpg" };
/** A show sharing The Matrix's TMDB id. */
const matrixShow: WatchlistEntry = { kind: "tv", id: 603, slug: "matrix-show", name: "Matrix Show" };

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

  it("lists saved movies and shows together from their snapshots, newest saved first", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([inception, breakingBad, matrix]));
    render(<WatchlistView />);
    const grid = screen.getByRole("list", { name: "Titles" });
    expect(within(grid).getAllByRole("heading").map((h) => h.textContent)).toEqual([
      "The Matrix",
      "Breaking Bad",
      "Inception",
    ]);
  });

  it("links each show to its TV page and each movie to its title page", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([breakingBad, matrix]));
    render(<WatchlistView />);
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/tv/1396-breaking-bad");
    expect(screen.getByRole("link", { name: /The Matrix/ })).toHaveAttribute("href", "/title/603-the-matrix");
  });

  it("shows a movie and a show with the same id as two cards", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([matrix, matrixShow]));
    render(<WatchlistView />);
    expect(screen.getByRole("link", { name: /The Matrix/ })).toHaveAttribute("href", "/title/603-the-matrix");
    expect(screen.getByRole("link", { name: /Matrix Show/ })).toHaveAttribute("href", "/tv/603-matrix-show");
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

  it("ignores the old v1 and v2 watchlists", () => {
    localStorage.setItem("reelbase:watchlist:v1", JSON.stringify(["saltwind-overture"]));
    localStorage.setItem("reelbase:watchlist:v2", JSON.stringify([{ id: 603, slug: "the-matrix", name: "The Matrix" }]));
    render(<WatchlistView />);
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
  });
});
