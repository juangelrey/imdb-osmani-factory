import { redirect } from "next/navigation";
import { BrowseControls } from "@/components/browse-controls";
import { cardFromSummary } from "@/components/card-title";
import { Pagination } from "@/components/pagination";
import { TitleGrid } from "@/components/title-grid";
import { browseHref, parseBrowseParams, type SearchParamValue } from "@/lib/catalog/browse-params";
import { discoverTitles, listGenres } from "@/lib/catalog/queries";

interface HomeProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function Home({ searchParams }: HomeProps) {
  // Read the request first: it makes the page render per request, so the build never calls TMDB.
  const params = await searchParams;
  const genres = await listGenres();
  const state = parseBrowseParams(params, new Set(genres.map(({ id }) => id)));
  const { results, page, totalPages } = await discoverTitles(state);
  // A page past the last one (a stale or edited link) falls back to page 1.
  if (results.length === 0 && state.page > 1) redirect(browseHref({ ...state, page: 1 }));
  const genreName = genres.find(({ id }) => id === state.genre)?.name;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{genreName ? `${genreName} titles` : "All titles"}</h1>
      <BrowseControls genres={genres} state={state} />
      <TitleGrid
        titles={results.map(cardFromSummary)}
        emptyMessage="No titles match this genre. Try another one, or show all titles."
      />
      <Pagination page={page} totalPages={totalPages} hrefForPage={(n) => browseHref({ ...state, page: n })} />
    </div>
  );
}
