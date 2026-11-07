// TMDB v3 response shapes, limited to the fields Reelbase reads.

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbGenreList {
  genres: TmdbGenre[];
}

/** A movie as it appears in discover and search results. */
export interface TmdbMovieListItem {
  id: number;
  title: string;
  /** "YYYY-MM-DD", or "" when unknown. */
  release_date?: string;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  genre_ids?: number[];
}

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbCastMember {
  name: string;
  order: number;
}

export interface TmdbCrewMember {
  name: string;
  job: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  release_date?: string;
  runtime: number | null;
  genres: TmdbGenre[];
  vote_average: number;
  vote_count: number;
  overview: string | null;
  poster_path: string | null;
  credits: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
}
