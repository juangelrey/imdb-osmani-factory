import type { TmdbMovieListItem, TmdbTvListItem } from "@/lib/tmdb/schema";
import { SEARCH_PAGE_SIZE, SEARCH_WINDOW_PAGES, sortSearchItems, windowPage } from "./search-sort";

function movie(id: number, release_date?: string): TmdbMovieListItem {
  return { id, title: `Movie ${id}`, release_date, vote_average: 7, vote_count: 100, poster_path: null };
}

function show(id: number, first_air_date?: string): TmdbTvListItem {
  return { id, name: `Show ${id}`, first_air_date, vote_average: 7, vote_count: 100, poster_path: null };
}

const ids = (items: { id: number }[]) => items.map(({ id }) => id);

describe("sortSearchItems by recency", () => {
  it("puts the newest release date first, including upcoming titles", () => {
    const items = [movie(1, "1999-03-31"), movie(2, "2031-01-01"), movie(3, "2003-11-05"), movie(4, "2003-05-15")];
    expect(ids(sortSearchItems(items, "recency"))).toEqual([2, 3, 4, 1]);
  });

  it("puts undated titles last, in TMDB order", () => {
    const items = [movie(1, ""), movie(2, "2001-01-01"), movie(3), movie(4, "2010-01-01")];
    expect(ids(sortSearchItems(items, "recency"))).toEqual([4, 2, 1, 3]);
  });

  it("keeps TMDB order for titles on the same date", () => {
    const items = [movie(1, "2005-06-15"), movie(2, "2010-01-01"), movie(3, "2005-06-15"), movie(4, "2005-06-15")];
    expect(ids(sortSearchItems(items, "recency"))).toEqual([2, 1, 3, 4]);
  });

  it("sorts TV by first air date", () => {
    const items = [show(1, "2008-01-20"), show(2, ""), show(3, "2011-04-06")];
    expect(ids(sortSearchItems(items, "recency"))).toEqual([3, 1, 2]);
  });

  it("does not change the input", () => {
    const items = [movie(1, "1999-01-01"), movie(2, "2020-01-01")];
    sortSearchItems(items, "recency");
    expect(ids(items)).toEqual([1, 2]);
  });
});

describe("windowPage", () => {
  const items = Array.from({ length: 87 }, (_, index) => index + 1);

  it("pages the window 20 at a time", () => {
    expect(SEARCH_PAGE_SIZE).toBe(20);
    expect(windowPage(items, 1)).toEqual({ results: items.slice(0, 20), page: 1, totalPages: 5, totalResults: 87 });
    expect(windowPage(items, 5).results).toEqual(items.slice(80, 87));
  });

  it("caps the window at 100 results and 5 pages", () => {
    expect(SEARCH_WINDOW_PAGES).toBe(5);
    const many = Array.from({ length: 120 }, (_, index) => index);
    expect(windowPage(many, 5)).toEqual({ results: many.slice(80, 100), page: 5, totalPages: 5, totalResults: 100 });
    expect(windowPage(many, 6).results).toEqual([]);
  });

  it("returns an empty page past the window", () => {
    expect(windowPage([1, 2, 3], 2)).toEqual({ results: [], page: 2, totalPages: 1, totalResults: 3 });
    expect(windowPage([], 1)).toEqual({ results: [], page: 1, totalPages: 0, totalResults: 0 });
  });
});
