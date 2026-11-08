import { DEFAULT_SEARCH_SORT, type SearchKind, type SearchSortKey } from "@/lib/catalog/search-params";
import type { Paged, PersonSummary, TitleKind, TitleSummary } from "@/lib/catalog/types";
import { cardFromSummary } from "./card-title";
import { Pagination } from "./pagination";
import { PersonGrid } from "./person-grid";
import { TitleGrid } from "./title-grid";

type SearchResultsProps = {
  query: string;
  /** The sort the results are in, kept by the pagination links. Defaults to Recency; people have none. */
  sort?: SearchSortKey;
} & (
  | {
      /** Which kind the results are; decides the empty message and the pagination links. Defaults to movie. */
      kind?: TitleKind;
      results: Paged<TitleSummary>;
    }
  | { kind: "person"; results: Paged<PersonSummary> }
);

/**
 * A search URL. `type` is set only for TV and people, and `sort` only when it is not the default (Recency)
 * and the search is not for people (they have no sort), so movie links in the default sort stay as they
 * were before TV search and sorting.
 */
export function searchHref(
  query: string,
  page: number,
  kind: SearchKind = "movie",
  sort: SearchSortKey = DEFAULT_SEARCH_SORT,
): string {
  const params = new URLSearchParams({ q: query });
  if (kind !== "movie") params.set("type", kind);
  if (kind !== "person" && sort !== DEFAULT_SEARCH_SORT) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
}

const EMPTY_NOUN: Record<SearchKind, string> = { movie: "titles", tv: "series", person: "people" };

export function SearchResults(props: SearchResultsProps) {
  const { query, sort = DEFAULT_SEARCH_SORT } = props;
  const kind = props.kind ?? "movie";
  const trimmed = query.trim();
  if (!trimmed) {
    return (
      <p className="text-zinc-400">
        {kind === "person" ? "Type a name in the search box to find people." : "Type a title name in the search box to find it."}
      </p>
    );
  }

  const { totalResults } = props.results;
  const emptyMessage = `No ${EMPTY_NOUN[kind]} match “${trimmed}”.`;
  return (
    <div className="space-y-4">
      {props.results.results.length > 0 && (
        <p className="text-sm text-zinc-400">
          {totalResults} {totalResults === 1 ? "result" : "results"} for “{trimmed}”
        </p>
      )}
      {props.kind === "person" ? (
        <PersonGrid people={props.results.results} emptyMessage={emptyMessage} />
      ) : (
        <TitleGrid titles={props.results.results.map(cardFromSummary)} emptyMessage={emptyMessage} />
      )}
      <Pagination
        page={props.results.page}
        totalPages={props.results.totalPages}
        hrefForPage={(page) => searchHref(trimmed, page, kind, sort)}
      />
    </div>
  );
}
