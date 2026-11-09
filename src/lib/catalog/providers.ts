import "server-only";
import { tmdbFetch } from "@/lib/tmdb/client";
import type { TitleKind } from "./types";

/** How many streaming services the browse filter offers per region and kind. */
export const PROVIDER_LIMIT = 12;

/** The one TMDB image size used for provider logos (square, shown as small pills). */
export const LOGO_SIZE = "w92";

/**
 * Rent/buy stores, hand-kept. TMDB's `/watch/providers/{movie,tv}` mixes them into its display order and carries no
 * monetization field, so they are dropped by id. Free and ad-supported services (JustWatch TV Free, JustWatch TV Plus,
 * Pluto TV, Tubi) are not stores and stay in. Add an id here when a store shows up among a region's pills.
 */
export const STORE_PROVIDER_IDS: ReadonlySet<number> = new Set([
  2, // Apple TV Store
  3, // Google Play Movies
  7, // Fandango At Home (Vudu)
  10, // Amazon Video
  68, // Microsoft Store
  192, // YouTube
  2784, // JustWatch TV Store
]);

/** One item of TMDB's `/watch/providers/{movie,tv}` response. */
type TmdbWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
  /** TMDB's display order per region code; a region missing here does not show the provider. */
  display_priorities?: Record<string, number>;
};

type TmdbWatchProviderList = { results: TmdbWatchProvider[] };

export type Provider = {
  id: number;
  name: string;
  /** Logo URL at {@link LOGO_SIZE}, or undefined when TMDB has no logo. */
  logoUrl: string | undefined;
};

function logoUrl(path: string | null): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${LOGO_SIZE}${path}` : undefined;
}

/**
 * The region's top {@link PROVIDER_LIMIT} streaming services for `kind`, in TMDB's display order for that region,
 * with rent/buy stores left out. `region` is an ISO 3166-1 code such as "US".
 */
export async function listProviders(kind: TitleKind, region: string): Promise<Provider[]> {
  const { results } = await tmdbFetch<TmdbWatchProviderList>(`/watch/providers/${kind}`, { watch_region: region });
  return results
    .flatMap((provider) => {
      const priority = provider.display_priorities?.[region];
      return priority === undefined || STORE_PROVIDER_IDS.has(provider.provider_id) ? [] : [{ provider, priority }];
    })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, PROVIDER_LIMIT)
    .map(({ provider }) => ({ id: provider.provider_id, name: provider.provider_name, logoUrl: logoUrl(provider.logo_path) }));
}
