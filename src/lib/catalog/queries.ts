import "server-only";
import { TmdbError, tmdbFetch, type TmdbParams } from "@/lib/tmdb/client";
import type {
  TmdbGenreList,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonDetails,
  TmdbSeason,
  TmdbTvDetails,
  TmdbTvListItem,
} from "@/lib/tmdb/schema";
import type { BrowseState, SortKey } from "./browse-params";
import { defaultSeason, toGenre, toPaged, toPerson, toShow, toShowSummary, toSummary, toTitle } from "./map";
import type { Genre, Paged, Person, Show, ShowSummary, Title, TitleKind, TitleSummary } from "./types";

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
 * A TV show with credits and the episodes of season `season` (default 1) in one request, or undefined when
 * TMDB does not know the id or flags the show adult or softcore. When the show has no such season, one more
 * request fetches its default season (season 1, else the first listed). Other failures throw.
 */
export async function getShow(id: number, season = 1): Promise<Show | undefined> {
  let show: TmdbTvDetails;
  try {
    show = await tmdbFetch<TmdbTvDetails>(`/tv/${id}`, { append_to_response: `credits,season/${season}` });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return undefined;
    throw error;
  }
  if (show.adult || show.softcore) return undefined;
  const requested = show[`season/${season}`];
  if (requested) return toShow(show, requested);
  const fallback = defaultSeason(toShow(show).seasons);
  if (fallback === undefined || fallback === season) return toShow(show);
  return toShow(show, await tmdbFetch<TmdbSeason>(`/tv/${id}/season/${fallback}`));
}

/**
 * A person with their movie credits in one request, or undefined when TMDB does not know the id
 * or flags the person adult. Other failures throw.
 */
/** `today` is "YYYY-MM-DD"; it decides which titles in the career are upcoming. */
export async function getPerson(id: number, today: string): Promise<Person | undefined> {
  let person: TmdbPersonDetails;
  try {
    person = await tmdbFetch<TmdbPersonDetails>(`/person/${id}`, { append_to_response: "combined_credits" });
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return undefined;
    throw error;
  }
  return person.adult ? undefined : toPerson(person, today);
}

/** TMDB's genres for movies or for TV; the two lists use different ids for some genres. */
export async function listGenres(kind: TitleKind = "movie"): Promise<Genre[]> {
  const { genres } = await tmdbFetch<TmdbGenreList>(`/genre/${kind}/list`);
  return genres.map(toGenre);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * TMDB discover params per sort and kind. Release date skips unreleased titles and near-empty placeholder
 * entries; for TV it is the first air date, and the title sort is by name.
 */
function sortParams(sort: SortKey, kind: TitleKind): TmdbParams {
  const releaseField = kind === "tv" ? "first_air_date" : "primary_release_date";
  switch (sort) {
    case "popularity":
      return { sort_by: "popularity.desc" };
    case "rating":
      return { sort_by: "vote_average.desc", "vote_count.gte": 200 };
    case "release":
      return { sort_by: `${releaseField}.desc`, [`${releaseField}.lte`]: today(), "vote_count.gte": 50 };
    case "title":
      return { sort_by: kind === "tv" ? "name.asc" : "title.asc" };
  }
}

export async function discoverTitles({ genre, sort, page }: BrowseState): Promise<Paged<TitleSummary>> {
  const response = await tmdbFetch<TmdbPaged<TmdbMovieListItem>>("/discover/movie", {
    include_adult: false,
    with_genres: genre,
    page,
    ...sortParams(sort, "movie"),
  });
  return toPaged(response, toSummary);
}

/** A page of TV series by TV genre and sort. */
export async function discoverShows({ genre, sort, page }: BrowseState): Promise<Paged<ShowSummary>> {
  const response = await tmdbFetch<TmdbPaged<TmdbTvListItem>>("/discover/tv", {
    include_adult: false,
    with_genres: genre,
    page,
    ...sortParams(sort, "tv"),
  });
  return toPaged(response, toShowSummary);
}

const NO_RESULTS: Paged<never> = { results: [], page: 1, totalPages: 0, totalResults: 0 };

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

/** Search TV series by name. A blank query returns no results without calling TMDB. */
export async function searchShows(query: string, page: number): Promise<Paged<ShowSummary>> {
  const trimmed = query.trim();
  if (!trimmed) return NO_RESULTS;
  const response = await tmdbFetch<TmdbPaged<TmdbTvListItem>>("/search/tv", {
    query: trimmed,
    include_adult: false,
    page,
  });
  return toPaged(response, toShowSummary);
}
