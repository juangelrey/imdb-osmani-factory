import type { TmdbMovieListItem, TmdbTvListItem } from "@/lib/tmdb/schema";
import type { SearchSortKey } from "./search-params";
import type { Paged } from "./types";

/**
 * TMDB's search endpoint can't sort, so a sorted search fetches up to this many TMDB pages (page 1 first,
 * to learn the page count), sorts the raw items on the server and pages through them. Matches past the
 * window are left out.
 */
export const SEARCH_WINDOW_PAGES = 5;

/** Results per page, as TMDB serves them. */
export const SEARCH_PAGE_SIZE = 20;

/** The search sorts done on the server; Relevance keeps TMDB's order and paging. */
export type ServerSortKey = Exclude<SearchSortKey, "relevance">;

export type SearchItem = TmdbMovieListItem | TmdbTvListItem;

/** The release date of a movie, or the first air date of a show; undefined when TMDB has none. */
function itemDate(item: SearchItem): string | undefined {
  return ("title" in item ? item.release_date : item.first_air_date) || undefined;
}

/** Newest first ("YYYY-MM-DD" compares as text), undated last. */
function byRecency(a: SearchItem, b: SearchItem): number {
  const left = itemDate(a);
  const right = itemDate(b);
  if (left === right) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return left < right ? 1 : -1;
}

const COMPARATORS: Record<ServerSortKey, (a: SearchItem, b: SearchItem) => number> = {
  recency: byRecency,
};

/** A sorted copy of raw TMDB search items. The sort is stable, so ties keep TMDB's order. */
export function sortSearchItems<T extends SearchItem>(items: readonly T[], sort: ServerSortKey): T[] {
  return [...items].sort(COMPARATORS[sort]);
}

/**
 * Page `page` of a sorted window, 20 results a page. The window holds at most 100 results (5 pages); a
 * page past it is empty, so the search page sends it back to page 1.
 */
export function windowPage<T>(items: readonly T[], page: number): Paged<T> {
  const window = items.slice(0, SEARCH_WINDOW_PAGES * SEARCH_PAGE_SIZE);
  const start = (page - 1) * SEARCH_PAGE_SIZE;
  return {
    results: window.slice(start, start + SEARCH_PAGE_SIZE),
    page,
    totalPages: Math.ceil(window.length / SEARCH_PAGE_SIZE),
    totalResults: window.length,
  };
}
