import { MAX_PAGES } from "./map";
import type { TitleKind } from "./types";

export type SearchParamValue = string | string[] | undefined;

export const SORT_KEYS = ["popularity", "rating", "release", "title"] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT: SortKey = "popularity";

export interface BrowseState {
  /** Movies or TV series; `type=tv` in the URL, movies when absent. */
  kind: TitleKind;
  /**
   * TMDB genre ids from the genre list of `kind` (movie and TV genre ids differ), ascending and without
   * duplicates; empty for all genres. A title must match every one. `genre=28,35` in the URL.
   */
  genres: number[];
  sort: SortKey;
  page: number;
}

export function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The `type` param: "tv", else movie (the default, so links without `type` behave as before). */
export function parseKind(value: SearchParamValue): TitleKind {
  return firstParam(value) === "tv" ? "tv" : "movie";
}

function isSortKey(value: string | undefined): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value ?? "");
}

/** A page number from 1 to TMDB's limit; anything else reads as 1. */
export function parsePage(value: SearchParamValue): number {
  const raw = firstParam(value) ?? "";
  if (!/^[1-9]\d*$/.test(raw)) return 1;
  const page = Number(raw);
  return page <= MAX_PAGES ? page : 1;
}

/** Known genre ids from a comma-separated `genre` param, ascending, each once. */
export function parseGenres(value: SearchParamValue, knownGenreIds: ReadonlySet<number>): number[] {
  const ids = (firstParam(value) ?? "")
    .split(",")
    .filter((part) => /^[1-9]\d*$/.test(part))
    .map(Number)
    .filter((id) => knownGenreIds.has(id));
  return [...new Set(ids)].sort((a, b) => a - b);
}

/**
 * The browse state from the URL. `knownGenreIds` is the genre list for the kind in `type` (read it with
 * `parseKind` first), so a genre id from the other kind's list is dropped.
 */
export function parseBrowseParams(
  params: Record<string, SearchParamValue>,
  knownGenreIds: ReadonlySet<number>,
): BrowseState {
  const sort = firstParam(params.sort);
  return {
    kind: parseKind(params.type),
    genres: parseGenres(params.genre, knownGenreIds),
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
    page: parsePage(params.page),
  };
}

/**
 * A home page URL. `type` is set only for TV, so movie links stay as they were before TV browse. List
 * separators stay literal commas (`genre=28,35`), not `%2C`, so links read as the spec writes them.
 */
export function browseHref({ kind, genres, sort, page }: BrowseState): string {
  const query = new URLSearchParams();
  if (kind === "tv") query.set("type", "tv");
  if (genres.length > 0) query.set("genre", genres.join(","));
  if (sort !== DEFAULT_SORT) query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const search = query.toString().replaceAll("%2C", ",");
  return search ? `/?${search}` : "/";
}
