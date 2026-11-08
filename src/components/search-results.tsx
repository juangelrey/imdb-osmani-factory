import { DEFAULT_SEARCH_SORT, type SearchSortKey } from "@/lib/catalog/search-params";
import type { Paged, TitleKind, TitleSummary } from "@/lib/catalog/types";
import { cardFromSummary } from "./card-title";
import { Pagination } from "./pagination";
import { TitleGrid } from "./title-grid";

interface SearchResultsProps {
  query: string;
  results: Paged<TitleSummary>;
  /** Which kind the results are; decides the empty message and the pagination links. Defaults to movie. */
  kind?: TitleKind;
  /** The sort the results are in, kept by the pagination links. Defaults to Recency. */
  sort?: SearchSortKey;
}

/**
 * A search URL. `type` is set only for TV and `sort` only when it is not the default (Recency), so movie
 * links in the default sort stay as they were before TV search and sorting.
 */
export function searchHref(
  query: string,
  page: number,
  kind: TitleKind = "movie",
  sort: SearchSortKey = DEFAULT_SEARCH_SORT,
): string {
  const params = new URLSearchParams({ q: query });
  if (kind === "tv") params.set("type", "tv");
  if (sort !== DEFAULT_SEARCH_SORT) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
}

export function SearchResults({ query, results, kind = "movie", sort = DEFAULT_SEARCH_SORT }: SearchResultsProps) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <p className="text-zinc-400">Type a title name in the search box to find it.</p>;
  }

  const { totalResults } = results;
  return (
    <div className="space-y-4">
      {results.results.length > 0 && (
        <p className="text-sm text-zinc-400">
          {totalResults} {totalResults === 1 ? "result" : "results"} for “{trimmed}”
        </p>
      )}
      <TitleGrid titles={results.results.map(cardFromSummary)} emptyMessage={`No ${kind === "tv" ? "series" : "titles"} match “${trimmed}”.`} />
      <Pagination
        page={results.page}
        totalPages={results.totalPages}
        hrefForPage={(page) => searchHref(trimmed, page, kind, sort)}
      />
    </div>
  );
}
