import { searchTitles } from "@/lib/catalog/queries";
import type { Title } from "@/lib/catalog/types";
import { TitleGrid } from "./title-grid";

interface SearchResultsProps {
  titles: Title[];
  query: string;
}

export function SearchResults({ titles, query }: SearchResultsProps) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <p className="text-zinc-400">Type a title name in the search box to find it.</p>;
  }

  const matches = searchTitles(titles, trimmed);
  return (
    <div className="space-y-4">
      {matches.length > 0 && (
        <p className="text-sm text-zinc-400">
          {matches.length} {matches.length === 1 ? "result" : "results"} for “{trimmed}”
        </p>
      )}
      <TitleGrid titles={matches} emptyMessage={`No titles match “${trimmed}”.`} />
    </div>
  );
}
