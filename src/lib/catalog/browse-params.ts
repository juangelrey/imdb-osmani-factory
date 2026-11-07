import { GENRES, SORT_KEYS, type Genre, type SortKey } from "@/lib/seed-catalog/types";

export type SearchParamValue = string | string[] | undefined;

export interface BrowseState {
  genre: Genre | undefined;
  sort: SortKey;
}

export const DEFAULT_SORT: SortKey = "rating";

export function firstParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isGenre(value: string | undefined): value is Genre {
  return (GENRES as readonly string[]).includes(value ?? "");
}

function isSortKey(value: string | undefined): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value ?? "");
}

export function parseBrowseParams(params: Record<string, SearchParamValue>): BrowseState {
  const genre = firstParam(params.genre);
  const sort = firstParam(params.sort);
  return {
    genre: isGenre(genre) ? genre : undefined,
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
  };
}

export function browseHref({ genre, sort }: BrowseState): string {
  const query = new URLSearchParams();
  if (genre) query.set("genre", genre);
  if (sort !== DEFAULT_SORT) query.set("sort", sort);
  const search = query.toString();
  return search ? `/?${search}` : "/";
}
