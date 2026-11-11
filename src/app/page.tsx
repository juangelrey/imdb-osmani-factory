import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BrowseControls } from "@/components/browse-controls";
import { BrowseHero } from "@/components/browse-hero";
import { cardFromSummary } from "@/components/card-title";
import { MediaSwitch } from "@/components/media-switch";
import { Pagination } from "@/components/pagination";
import { ProviderFilter } from "@/components/provider-filter";
import { RankedTitles } from "@/components/ranked-titles";
import { RegionSelect } from "@/components/region-select";
import {
  browseHref,
  firstParam,
  parseBrowseParams,
  parseKind,
  type BrowseState,
  type SearchParamValue,
} from "@/lib/catalog/browse-params";
import { listProviders } from "@/lib/catalog/providers";
import { discoverShows, discoverTitles, listGenres } from "@/lib/catalog/queries";
import { REGION_COOKIE, listRegions, resolveRegion } from "@/lib/catalog/regions";

/** TMDB's discover page size, which gives each result its place in the whole sorted list. */
const PAGE_SIZE = 20;

/** Browse has no People: TMDB's discover lists only movies and shows. */
const BROWSE_KINDS = ["movie", "tv"] as const;

/**
 * The empty grid's text, naming the filters in play: "No titles match these genres on this service. Try removing
 * one, or show all titles." With one filter it suggests another; with several, dropping one.
 */
function emptyMessage({ genres, providers }: BrowseState, noun: string): string {
  const genrePart = genres.length === 0 ? "" : genres.length === 1 ? "this genre" : "these genres";
  const servicePart = providers.length === 0 ? "" : providers.length === 1 ? "this service" : "these services";
  const hint = `${genres.length + providers.length > 1 ? "Try removing one" : "Try another one"}, or show all ${noun}.`;
  if (genrePart && servicePart) return `No ${noun} match ${genrePart} on ${servicePart}. ${hint}`;
  if (servicePart) return `No ${noun} stream on ${servicePart}. ${hint}`;
  if (genrePart) return `No ${noun} match ${genrePart}. ${hint}`;
  return `No ${noun} to show right now.`;
}

interface HomeProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function Home({ searchParams }: HomeProps) {
  // Read the request first: it makes the page render per request, so the build never calls TMDB.
  // Only this page reads the region cookie and headers, so other pages keep their caching.
  const [params, cookieStore, requestHeaders] = await Promise.all([searchParams, cookies(), headers()]);
  // Movie and TV genre ids differ, so the genre is checked against the list for the chosen kind.
  const kind = parseKind(params.type);
  const [genres, regions] = await Promise.all([listGenres(kind), listRegions()]);
  const region = resolveRegion(
    {
      param: firstParam(params.region),
      cookie: cookieStore.get(REGION_COOKIE)?.value,
      acceptLanguage: requestHeaders.get("accept-language") ?? undefined,
    },
    regions.map(({ code }) => code),
  );
  // The region's top 12 services for this kind; selected ids it doesn't list (carried over from another
  // kind or region) are dropped here, so changing kind or region needs no extra TMDB call. Four in all.
  const providers = await listProviders(kind, region);
  const state = parseBrowseParams(
    params,
    new Set(genres.map(({ id }) => id)),
    region,
    new Set(providers.map(({ id }) => id)),
  );
  const { results, page, totalPages } = state.kind === "tv" ? await discoverShows(state) : await discoverTitles(state);
  // A page past the last one (a stale or edited link) falls back to page 1.
  if (results.length === 0 && state.page > 1) redirect(browseHref({ ...state, page: 1 }));
  // Names follow ascending id order, e.g. "Action + Comedy" for genre=35,28.
  const genreNames = state.genres.map((id) => genres.find((genre) => genre.id === id)?.name).join(" + ");
  const noun = state.kind === "tv" ? "series" : "titles";
  const heading = genreNames ? `${genreNames} ${noun}` : `All ${noun}`;
  // The first result headlines the page; the rest follow it, numbered by their place in the sorted list.
  const [lead, ...rest] = results.map(cardFromSummary);

  return (
    <div className="space-y-6">
      {lead ? (
        <BrowseHero heading={heading} lead={lead} sort={state.sort} page={page} />
      ) : (
        <h1 className="text-2xl font-bold">{heading}</h1>
      )}
      <BrowseControls genres={genres} state={state}>
        {/* Switching kind resets the genre (the lists differ) and the page, and keeps the sort, region and services. */}
        <MediaSwitch marquee kinds={BROWSE_KINDS} current={state.kind} hrefForKind={(kind) => browseHref({ ...state, kind, genres: [], page: 1 })} />
      </BrowseControls>
      {/* Always shown; changing region keeps the other filters and returns to page 1 (via /region). */}
      <RegionSelect regions={regions} state={state} />
      {/* The region's services for this kind, with the JustWatch credit; pills keep every other filter. */}
      <ProviderFilter providers={providers} state={state} />
      {lead ? (
        <RankedTitles titles={rest} firstRank={(page - 1) * PAGE_SIZE + 2} />
      ) : (
        <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-zinc-400">{emptyMessage(state, noun)}</p>
      )}
      <Pagination page={page} totalPages={totalPages} hrefForPage={(n) => browseHref({ ...state, page: n })} />
    </div>
  );
}
