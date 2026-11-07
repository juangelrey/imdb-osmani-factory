import { titleHref } from "@/lib/catalog/map";
import type { TitleSummary } from "@/lib/catalog/types";

/** What a title card renders. Every data source adapts to this shape. */
export interface CardTitle {
  /** Unique within a grid; also seeds the fallback poster colours. */
  key: string;
  href: string;
  name: string;
  year?: number;
  rating: number;
  posterUrl?: string;
}

export function cardFromSummary(title: TitleSummary): CardTitle {
  return {
    key: String(title.id),
    href: titleHref(title),
    name: title.name,
    year: title.year,
    rating: title.rating,
    posterUrl: title.posterUrl,
  };
}

/** Temporary: seed titles still link by slug until every page reads TMDB. */
export function cardFromSeed(title: { slug: string; name: string; year: number; rating: number }): CardTitle {
  return { key: title.slug, href: `/title/${title.slug}`, name: title.name, year: title.year, rating: title.rating };
}
