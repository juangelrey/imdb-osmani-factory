export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Western",
] as const;

export type Genre = (typeof GENRES)[number];

export interface Title {
  slug: string;
  name: string;
  year: number;
  /** Runtime in minutes. */
  runtime: number;
  genres: Genre[];
  /** Average rating from 0 to 10. */
  rating: number;
  synopsis: string;
  director: string;
  cast: string[];
}

export const SORT_KEYS = ["rating", "year", "name"] as const;

export type SortKey = (typeof SORT_KEYS)[number];

/** The fields a title card needs; small enough to pass to client components. */
export type TitleSummary = Pick<Title, "slug" | "name" | "year" | "rating">;

export function toSummary({ slug, name, year, rating }: Title): TitleSummary {
  return { slug, name, year, rating };
}
