import type { TitleSummary } from "@/lib/catalog/types";
import { cardFromSummary } from "./card-title";
import { TitleGrid } from "./title-grid";

interface RecommendationsProps {
  /** The movie or show the page is about. */
  name: string;
  /** Movies for a movie page, shows for a show page; the section is hidden when empty. */
  titles: TitleSummary[];
}

/** "If you liked <name>, you might also like…" with a card per recommendation. */
export function Recommendations({ name, titles }: RecommendationsProps) {
  if (titles.length === 0) return null;
  return (
    <section aria-labelledby="recommendations-heading" className="space-y-4">
      <h2 id="recommendations-heading" className="text-xl font-semibold">
        If you liked <cite>{name}</cite>, you might also like…
      </h2>
      <TitleGrid titles={titles.map(cardFromSummary)} emptyMessage="" />
    </section>
  );
}
