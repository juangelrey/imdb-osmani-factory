import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BrowseControls } from "@/components/browse-controls";
import { cardFromSummary } from "@/components/card-title";
import { MediaSwitch } from "@/components/media-switch";
import { Pagination } from "@/components/pagination";
import { TitleGrid } from "@/components/title-grid";
import { browseHref, firstParam, parseBrowseParams, parseKind, type SearchParamValue } from "@/lib/catalog/browse-params";
import { discoverShows, discoverTitles, listGenres } from "@/lib/catalog/queries";
import { REGION_COOKIE, listRegions, resolveRegion } from "@/lib/catalog/regions";

/** Browse has no People: TMDB's discover lists only movies and shows. */
const BROWSE_KINDS = ["movie", "tv"] as const;

interface HomeProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function Home({ searchParams }: HomeProps) {
  // Read the request first: it makes the page render per request, so the build never calls TMDB.
  // Only this page reads the region cookie and headers, so other pages keep their caching.
  const [params, cookieStore, requestHeaders] = await Promise.all([searchParams, cookies(), headers()]);
  // Movie and TV genre ids differ, so the genre is checked against the list for the chosen kind.
  const [genres, regions] = await Promise.all([listGenres(parseKind(params.type)), listRegions()]);
  const region = resolveRegion(
    {
      param: firstParam(params.region),
      cookie: cookieStore.get(REGION_COOKIE)?.value,
      acceptLanguage: requestHeaders.get("accept-language") ?? undefined,
    },
    regions.map(({ code }) => code),
  );
  const state = parseBrowseParams(params, new Set(genres.map(({ id }) => id)), region);
  const { results, page, totalPages } = state.kind === "tv" ? await discoverShows(state) : await discoverTitles(state);
  // A page past the last one (a stale or edited link) falls back to page 1.
  if (results.length === 0 && state.page > 1) redirect(browseHref({ ...state, page: 1 }));
  // Names follow the ids' order in the URL, e.g. "Action + Comedy" for genre=28,35.
  const genreNames = state.genres.map((id) => genres.find((genre) => genre.id === id)?.name).join(" + ");
  const noun = state.kind === "tv" ? "series" : "titles";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{genreNames ? `${genreNames} ${noun}` : `All ${noun}`}</h1>
      {/* Switching kind resets the genre (the lists differ) and the page, and keeps the sort and region. */}
      <MediaSwitch kinds={BROWSE_KINDS} current={state.kind} hrefForKind={(kind) => browseHref({ ...state, kind, genres: [], page: 1 })} />
      <BrowseControls genres={genres} state={state} />
      <TitleGrid
        titles={results.map(cardFromSummary)}
        emptyMessage={`No ${noun} match this genre. Try another one, or show all ${noun}.`}
      />
      <Pagination page={page} totalPages={totalPages} hrefForPage={(n) => browseHref({ ...state, page: n })} />
    </div>
  );
}
