import type { TmdbGenre, TmdbMovieDetails, TmdbMovieListItem, TmdbPaged } from "@/lib/tmdb/schema";
import type { Genre, Paged, Title, TitleSummary } from "./types";

/** TMDB serves at most this many pages for discover and search. */
export const MAX_PAGES = 500;

const CAST_LIMIT = 10;

export type PosterSize = "w342" | "w500";

export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "movie";
}

export function titleHref({ id, slug }: { id: number; slug: string }): string {
  return `/title/${id}-${slug}`;
}

/** Parse a `/title/[id]` route param shaped "<id>-<slug>" or "<id>". */
export function parseTitleParam(param: string): { id: number; slug: string } | undefined {
  const match = /^([1-9]\d*)(?:-(.*))?$/.exec(param);
  if (!match) return undefined;
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id)) return undefined;
  return { id, slug: match[2] ?? "" };
}

export function posterUrl(path: string | null | undefined, size: PosterSize): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

function releaseYear(date: string | undefined): number | undefined {
  const match = /^(\d{4})-/.exec(date ?? "");
  return match ? Number(match[1]) : undefined;
}

export function toGenre({ id, name }: TmdbGenre): Genre {
  return { id, name };
}

export function toTitle(movie: TmdbMovieDetails): Title {
  return {
    id: movie.id,
    slug: slugify(movie.title),
    name: movie.title,
    year: releaseYear(movie.release_date),
    runtime: movie.runtime || undefined,
    genres: movie.genres.map(toGenre),
    rating: movie.vote_average,
    synopsis: movie.overview || undefined,
    posterUrl: posterUrl(movie.poster_path, "w500"),
    posterPath: movie.poster_path || undefined,
    director: movie.credits.crew.find((person) => person.job === "Director")?.name,
    cast: [...movie.credits.cast]
      .sort((a, b) => a.order - b.order)
      .slice(0, CAST_LIMIT)
      .map((person) => person.name),
  };
}

export function toSummary(movie: TmdbMovieListItem): TitleSummary {
  return {
    id: movie.id,
    slug: slugify(movie.title),
    name: movie.title,
    year: releaseYear(movie.release_date),
    rating: movie.vote_average,
    posterUrl: posterUrl(movie.poster_path, "w342"),
  };
}

export function toPaged<T, U>(page: TmdbPaged<T>, map: (item: T) => U): Paged<U> {
  return {
    results: page.results.map(map),
    page: page.page,
    totalPages: Math.min(page.total_pages, MAX_PAGES),
    totalResults: page.total_results,
  };
}
