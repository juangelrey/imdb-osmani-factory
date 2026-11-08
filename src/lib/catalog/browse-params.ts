import { MAX_PAGES } from "./map";
import type { TitleKind } from "./types";

export type SearchParamValue = string | string[] | undefined;

export const SORT_KEYS = ["popularity", "rating", "release", "title"] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT: SortKey = "popularity";

export interface BrowseState {
  /** A TMDB genre id. */
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

export function parseBrowseParams(
  params: Record<string, SearchParamValue>,
  knownGenreIds: ReadonlySet<number>,
): BrowseState {
  const genre = Number(firstParam(params.genre) || NaN);
  const sort = firstParam(params.sort);
  return {
    genre: knownGenreIds.has(genre) ? genre : undefined,
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
    page: parsePage(params.page),
  };
}

export function browseHref({ genre, sort, page }: BrowseState): string {
  const query = new URLSearchParams();
  if (genre !== undefined) query.set("genre", String(genre));
  if (sort !== DEFAULT_SORT) query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `/?${search}` : "/";
}
