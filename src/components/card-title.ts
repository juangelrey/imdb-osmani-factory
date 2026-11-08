import { posterUrl, showHref, titleHref } from "@/lib/catalog/map";
import type { TitleSummary } from "@/lib/catalog/types";
import type { WatchlistEntry } from "@/lib/watchlist/watchlist";

/** What a title card renders. Every data source adapts to this shape. */
export interface CardTitle {
  /** `<kind>-<id>`, unique within a grid even when a movie and a show share an id; also seeds the fallback poster colours. */
  key: string;
  href: string;
  name: string;
  year?: number;
  rating?: number;
  posterUrl?: string;
}

export function cardFromSummary(title: TitleSummary): CardTitle {
  return {
    key: `${title.kind}-${title.id}`,
    href: title.kind === "tv" ? showHref(title) : titleHref(title),
    name: title.name,
    year: title.year,
    rating: title.rating,
    posterUrl: title.posterUrl,
  };
}

export function cardFromEntry(entry: WatchlistEntry): CardTitle {
  return cardFromSummary({ ...entry, kind: "movie", posterUrl: posterUrl(entry.posterPath, "w342") });
}
