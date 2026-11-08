import { MAX_PAGES } from "./map";
import type { TitleKind } from "./types";

export type SearchParamValue = string | string[] | undefined;

export const SORT_KEYS = ["popularity", "rating", "release", "title"] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT: SortKey = "popularity";

export interface BrowseState {
  /** Movies or TV series; `type=tv` in the URL, movies when absent. */
  kind: TitleKind;
  /** A TMDB genre id from the genre list of `kind` (movie and TV genre ids differ). */
  genre: number | undefined;
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

/**
 * The browse state from the URL. `knownGenreIds` is the genre list for the kind in `type` (read it with
 * `parseKind` first), so a genre id from the other kind's list is dropped.
 */
export function parseBrowseParams(
  params: Record<string, SearchParamValue>,
  knownGenreIds: ReadonlySet<number>,
): BrowseState {
  const genre = Number(firstParam(params.genre) || NaN);
  const sort = firstParam(params.sort);
  return {
    kind: parseKind(params.type),
    genre: knownGenreIds.has(genre) ? genre : undefined,
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
    page: parsePage(params.page),
  };
}

/** A home page URL. `type` is set only for TV, so movie links stay as they were before TV browse. */
export function browseHref({ kind, genre, sort, page }: BrowseState): string {
  const query = new URLSearchParams();
  if (kind === "tv") query.set("type", "tv");
  if (genre !== undefined) query.set("genre", String(genre));
  if (sort !== DEFAULT_SORT) query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `/?${search}` : "/";
}
