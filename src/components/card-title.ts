import { posterUrl, summaryHref } from "@/lib/catalog/map";
import type { TitleSummary } from "@/lib/catalog/types";
import type { WatchlistEntry } from "@/lib/watchlist/watchlist";

/** What a title card renders. Every data source adapts to this shape. */
export interface CardTitle {
  /** `<kind>-<id>`, unique within a grid even when a movie and a show share an id. */
  key: string;
  /** Seeds the fallback poster colours: the id alone for movies (as before TV, so their colours stay), else the key. */
  colorKey: string;
  href: string;
  name: string;
  year?: number;
  rating?: number;
  posterUrl?: string;
}

export function cardFromSummary(title: TitleSummary): CardTitle {
  const key = `${title.kind}-${title.id}`;
  return {
    key,
    colorKey: title.kind === "movie" ? String(title.id) : key,
    href: summaryHref(title),
    name: title.name,
    year: title.year,
    rating: title.rating,
    posterUrl: title.posterUrl,
  };
}

export function cardFromEntry(entry: WatchlistEntry): CardTitle {
  return cardFromSummary({ ...entry, posterUrl: posterUrl(entry.posterPath, "w342") });
}
