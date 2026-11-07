import type { Title } from "@/lib/catalog/types";
import { TitleCard } from "./title-card";

interface TitleGridProps {
  titles: Title[];
  emptyMessage: string;
}

export function TitleGrid({ titles, emptyMessage }: TitleGridProps) {
  if (titles.length === 0) {
    return <p className="rounded-lg border border-dashed border-zinc-700 p-8 text-center text-zinc-400">{emptyMessage}</p>;
  }
  return (
    <ul aria-label="Titles" className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {titles.map((title) => (
        <li key={title.slug}>
          <TitleCard title={title} />
        </li>
      ))}
    </ul>
  );
}
