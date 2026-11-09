import "server-only";
import { tmdbFetch } from "@/lib/tmdb/client";

/** TMDB's `/watch/providers/regions` response. Kept here rather than in `schema.ts`. */
type TmdbWatchProviderRegions = {
  results: { iso_3166_1: string; english_name: string; native_name: string }[];
};

/** A country TMDB has watch-provider data for: its ISO 3166-1 code and English name. */
export type Region = { code: string; name: string };

/** The first-party cookie that remembers the visitor's chosen region code. Only the home page reads it. */
export const REGION_COOKIE = "reelbase-region";

/** The region used when the URL, the cookie and the browser language name none TMDB lists. */
export const DEFAULT_REGION = "US";

/** TMDB's watch-provider regions, sorted A-Z by English name. */
export async function listRegions(): Promise<Region[]> {
  const { results } = await tmdbFetch<TmdbWatchProviderRegions>("/watch/providers/regions");
  return results
    .map(({ iso_3166_1, english_name }) => ({ code: iso_3166_1, name: english_name }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

const REGION_CODE = /^[A-Z]{2}$/;

/** The country of each `Accept-Language` tag that names one, in header order, upper-cased (`es-ES` gives ES; `en` gives none). */
function acceptLanguageCountries(header: string): string[] {
  return header.split(",").flatMap((entry) => {
    const [, ...subtags] = entry.split(";")[0].trim().split("-");
    const country = subtags.find((subtag) => /^[A-Za-z]{2}$/.test(subtag));
    return country ? [country.toUpperCase()] : [];
  });
}

/**
 * The region that applies: the first of the `?region=` value, the remembered cookie, the countries in
 * `Accept-Language`, then US, that is an upper-case two-letter code in `knownCodes`. Lowercase, malformed
 * and unlisted values are skipped. Language tags are case-insensitive, so `en-gb` gives GB.
 */
export function resolveRegion(
  { param, cookie, acceptLanguage }: { param?: string; cookie?: string; acceptLanguage?: string },
  knownCodes: Iterable<string>,
): string {
  const known = new Set(knownCodes);
  const candidates = [param, cookie, ...acceptLanguageCountries(acceptLanguage ?? "")];
  return candidates.find((code) => code !== undefined && REGION_CODE.test(code) && known.has(code)) ?? DEFAULT_REGION;
}
