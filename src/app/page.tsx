import { BrowseControls } from "@/components/browse-controls";
import { TitleGrid } from "@/components/title-grid";
import { parseBrowseParams, type SearchParamValue } from "@/lib/catalog/browse-params";
import { filterByGenre, listGenres, listTitles, sortTitles } from "@/lib/seed-catalog/queries";

interface HomeProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const state = parseBrowseParams(await searchParams);
  const all = listTitles();
  const titles = sortTitles(filterByGenre(all, state.genre), state.sort);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{state.genre ? `${state.genre} titles` : "All titles"}</h1>
      <BrowseControls genres={listGenres(all)} state={state} />
      <TitleGrid titles={titles} emptyMessage="No titles match this genre. Try another one, or show all titles." />
    </div>
  );
}
