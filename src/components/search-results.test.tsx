import { render, screen, within } from "@testing-library/react";
import type { Paged, TitleSummary } from "@/lib/catalog/types";
import { SearchResults, searchHref } from "./search-results";

const matrix: TitleSummary = { kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.2 };
const reloaded: TitleSummary = { kind: "movie", id: 604, slug: "the-matrix-reloaded", name: "The Matrix Reloaded", year: 2003, rating: 7.1 };

function paged(results: TitleSummary[], extra: Partial<Paged<TitleSummary>> = {}): Paged<TitleSummary> {
  return { results, page: 1, totalPages: results.length ? 1 : 0, totalResults: results.length, ...extra };
}

const breakingBad: TitleSummary = { kind: "tv", id: 1396, slug: "breaking-bad", name: "Breaking Bad", year: 2008 };

describe("searchHref", () => {
  it("adds type=tv only for TV, and the page only past 1", () => {
    expect(searchHref("the matrix", 1)).toBe("/search?q=the+matrix");
    expect(searchHref("the matrix", 2, "movie")).toBe("/search?q=the+matrix&page=2");
    expect(searchHref("breaking", 1, "tv")).toBe("/search?q=breaking&type=tv");
    expect(searchHref("breaking", 3, "tv")).toBe("/search?q=breaking&type=tv&page=3");
  });

  it("adds the sort only when it is not the default Recency", () => {
    expect(searchHref("batman", 1, "movie", "recency")).toBe("/search?q=batman");
    expect(searchHref("batman", 1, "movie", "relevance")).toBe("/search?q=batman&sort=relevance");
    expect(searchHref("batman", 2, "tv", "relevance")).toBe("/search?q=batman&type=tv&sort=relevance&page=2");
  });
});

describe("SearchResults", () => {
  it("asks for a query when it is blank", () => {
    render(<SearchResults query="   " results={paged([])} />);
    expect(screen.getByText("Type a title name in the search box to find it.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("says so when nothing matches", () => {
    render(<SearchResults query="zzz" results={paged([])} />);
    expect(screen.getByText("No titles match “zzz”.")).toBeInTheDocument();
  });

  it("lists matches with TMDB's total count", () => {
    render(<SearchResults query="matrix" results={paged([matrix, reloaded], { totalResults: 72 })} />);
    expect(screen.getByText("72 results for “matrix”")).toBeInTheDocument();
    const grid = screen.getByRole("list", { name: "Titles" });
    expect(within(grid).getByRole("link", { name: /The Matrix Reloaded/ })).toHaveAttribute("href", "/title/604-the-matrix-reloaded");
  });

  it("uses the singular for one result", () => {
    render(<SearchResults query="matrix" results={paged([matrix])} />);
    expect(screen.getByText("1 result for “matrix”")).toBeInTheDocument();
  });

  it("paginates, keeping the query", () => {
    render(<SearchResults query="the matrix" results={paged([matrix], { page: 2, totalPages: 4, totalResults: 72 })} />);
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(pagination).toHaveTextContent("Page 2 of 4");
    expect(within(pagination).getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/search?q=the+matrix");
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/search?q=the+matrix&page=3");
  });

  it("links TV results to their TV page and paginates keeping the type", () => {
    render(<SearchResults query="breaking" kind="tv" results={paged([breakingBad], { totalPages: 6, totalResults: 117 })} />);
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/tv/1396-breaking-bad");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/search?q=breaking&type=tv&page=2");
  });

  it("paginates keeping the sort", () => {
    render(
      <SearchResults query="batman" kind="tv" sort="relevance" results={paged([breakingBad], { totalPages: 6, totalResults: 117 })} />,
    );
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute(
      "href",
      "/search?q=batman&type=tv&sort=relevance&page=2",
    );
  });

  it("says no series match when a TV search finds nothing", () => {
    render(<SearchResults query="zzz" kind="tv" results={paged([])} />);
    expect(screen.getByText("No series match “zzz”.")).toBeInTheDocument();
  });
});
