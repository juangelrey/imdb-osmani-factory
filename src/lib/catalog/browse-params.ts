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
  /** The watch-provider region that applies (ISO 3166-1, e.g. "ES"), from `resolveRegion`. */
  region: string;
  /**
   * Whether `?region=` named the applied region. Only then do links carry `region`, so an explicit
   * `?region=` keeps beating the cookie on later clicks, while cookie and language defaults stay out of URLs.
   */
  regionFromUrl: boolean;
  /**
   * TMDB watch-provider ids from the top 12 of `region` and `kind`, ascending and without duplicates; empty for
   * any service. A title must stream on at least one. `providers=8,337` in the URL. Links that change the kind or
   * region carry them all, and the target page's parse drops any its own top 12 does not list.
   */
  providers: number[];
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

/** Known ids from a comma-separated list param, ascending, each once. */
function parseIdList(value: SearchParamValue, knownIds: ReadonlySet<number>): number[] {
  const ids = (firstParam(value) ?? "")
    .split(",")
    .filter((part) => /^[1-9]\d*$/.test(part))
    .map(Number)
    .filter((id) => knownIds.has(id));
  return [...new Set(ids)].sort((a, b) => a - b);
}

/** Known genre ids from a comma-separated `genre` param, ascending, each once. */
export function parseGenres(value: SearchParamValue, knownGenreIds: ReadonlySet<number>): number[] {
  return parseIdList(value, knownGenreIds);
}

/** Listed provider ids from a comma-separated `providers` param, ascending, each once. */
export function parseProviders(value: SearchParamValue, listedProviderIds: ReadonlySet<number>): number[] {
  return parseIdList(value, listedProviderIds);
}

/**
 * A pill's target selection: `selected` with `id` removed if present, else added. Ascending, as
 * `BrowseState.genres` and `BrowseState.providers` are, so equal selections share a URL. Returns a new array.
 */
export function toggleId(selected: readonly number[], id: number): number[] {
  return selected.includes(id) ? selected.filter((other) => other !== id) : [...selected, id].sort((a, b) => a - b);
}

const NO_PROVIDERS: ReadonlySet<number> = new Set();

/**
 * The browse state from the URL. `knownGenreIds` is the genre list for the kind in `type` (read it with
 * `parseKind` first), so a genre id from the other kind's list is dropped. `region` is the region that
 * applies, from `resolveRegion` over the `region` param, the cookie and `Accept-Language`.
 * `listedProviderIds` is that region's top 12 for the kind, from `listProviders`; any other id in
 * `providers` is dropped, which is how services fall away after a kind or region change. Without it, no
 * service applies.
 */
export function parseBrowseParams(
  params: Record<string, SearchParamValue>,
  knownGenreIds: ReadonlySet<number>,
  region: string,
  listedProviderIds: ReadonlySet<number> = NO_PROVIDERS,
): BrowseState {
  const sort = firstParam(params.sort);
  return {
    kind: parseKind(params.type),
    genres: parseGenres(params.genre, knownGenreIds),
    sort: isSortKey(sort) ? sort : DEFAULT_SORT,
    page: parsePage(params.page),
    region,
    // An unlisted `?region=` falls through to the cookie or language, so it does not count as from the URL.
    regionFromUrl: firstParam(params.region) === region,
    providers: parseProviders(params.providers, listedProviderIds),
  };
}

/**
 * A home page URL. `type` is set only for TV, so movie links stay as they were before TV browse, and
 * `region` only when it came from the URL. List separators stay literal commas (`genre=28,35`,
 * `providers=8,337`), not `%2C`, so links read as the spec writes them.
 */
export function browseHref({ kind, genres, sort, page, region, regionFromUrl, providers }: BrowseState): string {
  const query = new URLSearchParams();
  if (kind === "tv") query.set("type", "tv");
  if (genres.length > 0) query.set("genre", genres.join(","));
  if (providers.length > 0) query.set("providers", providers.join(","));
  if (regionFromUrl) query.set("region", region);
  if (sort !== DEFAULT_SORT) query.set("sort", sort);
  if (page > 1) query.set("page", String(page));
  const search = query.toString().replaceAll("%2C", ",");
  return search ? `/?${search}` : "/";
}
