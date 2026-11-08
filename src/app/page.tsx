import { redirect } from "next/navigation";
import { BrowseControls } from "@/components/browse-controls";
import { cardFromSummary } from "@/components/card-title";
import { MediaSwitch } from "@/components/media-switch";
import { Pagination } from "@/components/pagination";
import { TitleGrid } from "@/components/title-grid";
import { browseHref, parseBrowseParams, parseKind, type SearchParamValue } from "@/lib/catalog/browse-params";
import { discoverShows, discoverTitles, listGenres } from "@/lib/catalog/queries";

/** Browse has no People: TMDB's discover lists only movies and shows. */
const BROWSE_KINDS = ["movie", "tv"] as const;

interface HomeProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function Home({ searchParams }: HomeProps) {
  // Read the request first: it makes the page render per request, so the build never calls TMDB.
  const params = await searchParams;
  // Movie and TV genre ids differ, so the genre is checked against the list for the chosen kind.
  const genres = await listGenres(parseKind(params.type));
  const state = parseBrowseParams(params, new Set(genres.map(({ id }) => id)));
  const { results, page, totalPages } = state.kind === "tv" ? await discoverShows(state) : await discoverTitles(state);
  // A page past the last one (a stale or edited link) falls back to page 1.
  if (results.length === 0 && state.page > 1) redirect(browseHref({ ...state, page: 1 }));
  const genreName = genres.find(({ id }) => id === state.genre)?.name;
  const noun = state.kind === "tv" ? "series" : "titles";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{genreName ? `${genreName} ${noun}` : `All ${noun}`}</h1>
      {/* Switching kind resets the genre (the lists differ) and the page, and keeps the sort. */}
      <MediaSwitch kinds={BROWSE_KINDS} current={state.kind} hrefForKind={(kind) => browseHref({ kind, genre: undefined, sort: state.sort, page: 1 })} />
      <BrowseControls genres={genres} state={state} />
      <TitleGrid
        titles={results.map(cardFromSummary)}
        emptyMessage={`No ${noun} match this genre. Try another one, or show all ${noun}.`}
      />
      <Pagination page={page} totalPages={totalPages} hrefForPage={(n) => browseHref({ ...state, page: n })} />
    </div>
  );
}
