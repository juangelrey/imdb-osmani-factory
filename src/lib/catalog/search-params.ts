import { firstParam, type SearchParamValue } from "./browse-params";

/**
 * The `sort` param on movie and TV search, in the order the sort control lists them. Browse (`/`) keeps
 * its own `SortKey`. Relevance is TMDB's own order and paging; every other key sorts a window of results
 * on the server (see `search-sort.ts`).
 */
export const SEARCH_SORT_KEYS = ["recency", "rating", "relevance"] as const;

export type SearchSortKey = (typeof SEARCH_SORT_KEYS)[number];

/** The default search sort; search URLs leave it out. */
export const DEFAULT_SEARCH_SORT: SearchSortKey = "recency";

/** The `sort` param on search: a search sort key, else Recency. */
export function parseSearchSort(value: SearchParamValue): SearchSortKey {
  const sort = firstParam(value) ?? "";
  return (SEARCH_SORT_KEYS as readonly string[]).includes(sort) ? (sort as SearchSortKey) : DEFAULT_SEARCH_SORT;
}
