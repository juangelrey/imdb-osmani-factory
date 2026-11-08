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
import type { SearchSortKey } from "./search-params";
import { SEARCH_WINDOW_PAGES, sortSearchItems, windowPage, type SearchItem } from "./search-sort";
import type { Genre, Paged, Person, Show, ShowSummary, Title, TitleKind, TitleSummary } from "./types";

/** A movie with credits and recommendations in one request, or undefined when TMDB does not know the id. Other failures throw. */
export async function getTitle(id: number): Promise<Title | undefined> {
  try {
    return toTitle(await tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: "credits,recommendations" }));
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
 * A person with their combined credits (movies and TV) in one request, or undefined when TMDB does not
 * know the id or flags the person adult. Other failures throw. `today` is "YYYY-MM-DD"; it decides which
 * titles in the career are upcoming.
 */
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

/**
 * One page of a TMDB search. Relevance is TMDB's own page: one call. Any other sort fetches page 1, then
 * the rest of the first `SEARCH_WINDOW_PAGES` pages in parallel, sorts the raw items (they carry the full
 * date, which summaries reduce to a year) and pages through that window: at most 5 calls. A blank query,
 * or a sorted page past the window, returns no results without calling TMDB.
 */
async function search<T extends SearchItem, U>(
  path: string,
  query: string,
  page: number,
  sort: SearchSortKey,
  map: (item: T) => U,
): Promise<Paged<U>> {
  const trimmed = query.trim();
  if (!trimmed) return NO_RESULTS;
  const fetchPage = (number: number) =>
    tmdbFetch<TmdbPaged<T>>(path, { query: trimmed, include_adult: false, page: number });
  if (sort === "relevance") return toPaged(await fetchPage(page), map);
  if (page > SEARCH_WINDOW_PAGES) return { ...NO_RESULTS, page };

  const first = await fetchPage(1);
  const lastPage = Math.min(first.total_pages, SEARCH_WINDOW_PAGES);
  const rest = await Promise.all(Array.from({ length: Math.max(lastPage - 1, 0) }, (_, index) => fetchPage(index + 2)));
  const items = sortSearchItems([first, ...rest].flatMap(({ results }) => results), sort);
  const window = windowPage(items, page);
  return { ...window, results: window.results.map(map) };
}

/** Search movies by title, in the given sort. */
export async function searchTitles(query: string, page: number, sort: SearchSortKey): Promise<Paged<TitleSummary>> {
  return search<TmdbMovieListItem, TitleSummary>("/search/movie", query, page, sort, toSummary);
}

/** Search TV series by name, in the given sort (Recency is by first air date). */
export async function searchShows(query: string, page: number, sort: SearchSortKey): Promise<Paged<ShowSummary>> {
  return search<TmdbTvListItem, ShowSummary>("/search/tv", query, page, sort, toShowSummary);
}
