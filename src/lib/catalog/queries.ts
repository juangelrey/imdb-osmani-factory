import "server-only";
import { TmdbError, tmdbFetch, type TmdbParams } from "@/lib/tmdb/client";
import type {
  TmdbGenreList,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonDetails,
} from "@/lib/tmdb/schema";
import type { BrowseState, SortKey } from "./browse-params";
import { toGenre, toPaged, toPerson, toSummary, toTitle } from "./map";
import type { Genre, Paged, Person, Title, TitleSummary } from "./types";

/** A movie with credits, or undefined when TMDB does not know the id. Other failures throw. */
export async function getTitle(id: number): Promise<Title | undefined> {
  try {
    return toTitle(await tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: "credits" }));
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return undefined;
    throw error;
  }
}

/**
 * A person with their movie credits in one request, or undefined when TMDB does not know the id
 * or flags the person adult. Other failures throw.
 */
export async function getPerson(id: number): Promise<Person | undefined> {
  let person: TmdbPersonDetails;
  try {
    person = await tmdbFetch<TmdbPersonDetails>(`/person/${id}`, { append_to_response: "movie_credits" });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return undefined;
    throw error;
  }
  return person.adult ? undefined : toPerson(person);
}

export async function listGenres(): Promise<Genre[]> {
  const { genres } = await tmdbFetch<TmdbGenreList>("/genre/movie/list");
  return genres.map(toGenre);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** TMDB discover params per sort. Release date skips unreleased films and near-empty placeholder entries. */
function sortParams(sort: SortKey): TmdbParams {
  switch (sort) {
    case "popularity":
      return { sort_by: "popularity.desc" };
    case "rating":
      return { sort_by: "vote_average.desc", "vote_count.gte": 200 };
    case "release":
      return { sort_by: "primary_release_date.desc", "primary_release_date.lte": today(), "vote_count.gte": 50 };
    case "title":
      return { sort_by: "title.asc" };
  }
}

export async function discoverTitles({ genre, sort, page }: BrowseState): Promise<Paged<TitleSummary>> {
  const response = await tmdbFetch<TmdbPaged<TmdbMovieListItem>>("/discover/movie", {
    include_adult: false,
    with_genres: genre,
    page,
    ...sortParams(sort),
  });
  return toPaged(response, toSummary);
}

const NO_RESULTS: Paged<TitleSummary> = { results: [], page: 1, totalPages: 0, totalResults: 0 };

/** Search movies by title. A blank query returns no results without calling TMDB. */
export async function searchTitles(query: string, page: number): Promise<Paged<TitleSummary>> {
  const trimmed = query.trim();
  if (!trimmed) return NO_RESULTS;
  const response = await tmdbFetch<TmdbPaged<TmdbMovieListItem>>("/search/movie", {
    query: trimmed,
    include_adult: false,
    page,
  });
  return toPaged(response, toSummary);
}
