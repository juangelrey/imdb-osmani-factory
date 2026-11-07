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
  /** The TMDB person id. */
  id: number;
  name: string;
  order: number;
}

export interface TmdbCrewMember {
  /** The TMDB person id. */
  id: number;
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

/** A film in a person's `movie_credits`, carrying the movie's own fields. */
export interface TmdbPersonMovieCredit extends TmdbMovieListItem {
  adult: boolean;
  /** Present on live responses next to `adult`; softcore films are excluded like adult ones. */
  softcore?: boolean;
}

export interface TmdbPersonCastCredit extends TmdbPersonMovieCredit {
  /** May be "" or join several roles with " / ". */
  character?: string;
  order?: number;
}

export interface TmdbPersonCrewCredit extends TmdbPersonMovieCredit {
  job: string;
  department: string;
}

export interface TmdbPersonMovieCredits {
  cast: TmdbPersonCastCredit[];
  crew: TmdbPersonCrewCredit[];
}

/** `GET /person/{id}?append_to_response=movie_credits`. */
export interface TmdbPersonDetails {
  id: number;
  name: string;
  adult: boolean;
  biography: string;
  /** "YYYY-MM-DD", or null when unknown. */
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  known_for_department: string | null;
  profile_path: string | null;
  movie_credits: TmdbPersonMovieCredits;
}
