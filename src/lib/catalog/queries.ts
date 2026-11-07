import seed from "@/data/titles.json";
import type { Genre, SortKey, Title } from "./types";

// The seed file's shape is checked by seed.test.ts, which backs this cast.
const catalogue = seed as Title[];

export function listTitles(): Title[] {
  return [...catalogue];
}

export function getTitleBySlug(titles: Title[], slug: string): Title | undefined {
  return titles.find((title) => title.slug === slug);
}

export function filterByGenre(titles: Title[], genre: Genre | undefined): Title[] {
  if (!genre) return titles;
  return titles.filter((title) => title.genres.includes(genre));
}

const byName = (a: Title, b: Title) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base" });

const comparators: Record<SortKey, (a: Title, b: Title) => number> = {
  rating: (a, b) => b.rating - a.rating || byName(a, b),
  year: (a, b) => b.year - a.year || byName(a, b),
  name: byName,
};

export function sortTitles(titles: Title[], key: SortKey): Title[] {
  return [...titles].sort(comparators[key]);
}

export function searchTitles(titles: Title[], query: string): Title[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return titles.filter((title) => title.name.toLowerCase().includes(needle));
}

export function listGenres(titles: Title[]): Genre[] {
  const used = new Set(titles.flatMap((title) => title.genres));
  return [...used].sort((a, b) => a.localeCompare(b));
}
