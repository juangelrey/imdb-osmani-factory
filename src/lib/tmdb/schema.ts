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

/** Fields every row of a person's `combined_credits` carries, movie or TV. */
interface TmdbPersonCreditFields {
  adult: boolean;
  /** Present on live responses next to `adult`; softcore titles are excluded like adult ones. */
  softcore?: boolean;
  /** The title's synopsis; may be "" or missing. */
  overview?: string | null;
}

/** A film in a person's `combined_credits`, carrying the movie's own fields. */
export interface TmdbPersonMovieCredit extends TmdbMovieListItem, TmdbPersonCreditFields {
  media_type: "movie";
}

/** A show in a person's `combined_credits`, carrying the show's own fields. */
export interface TmdbPersonTvCredit extends TmdbTvListItem, TmdbPersonCreditFields {
  media_type: "tv";
  /** When this person first appeared in the show: "YYYY-MM-DD", or "" / null / missing when unknown. */
  first_credit_air_date?: string | null;
  /** How many episodes this credit covers. */
  episode_count?: number;
}

export type TmdbPersonCredit = TmdbPersonMovieCredit | TmdbPersonTvCredit;

export type TmdbPersonCastCredit = TmdbPersonCredit & {
  /** May be "" or join several roles with " / ". */
  character?: string;
  /** Billing order; TV rows have none. */
  order?: number;
};

export type TmdbPersonCrewCredit = TmdbPersonCredit & {
  job: string;
  department: string;
};

export interface TmdbPersonCombinedCredits {
  cast: TmdbPersonCastCredit[];
  crew: TmdbPersonCrewCredit[];
}

/** `GET /person/{id}?append_to_response=combined_credits`. */
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
  combined_credits: TmdbPersonCombinedCredits;
}

/** A TV show as it appears in TV discover and search results. */
export interface TmdbTvListItem {
  id: number;
  name: string;
  /** "YYYY-MM-DD", or "" when unknown. */
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  poster_path: string | null;
  genre_ids?: number[];
}

/** A creator in a show's `created_by`. */
export interface TmdbTvCreator {
  /** The TMDB person id. */
  id: number;
  name: string;
}

/** A season as listed in a show's `seasons`; season 0 is Specials. */
export interface TmdbSeasonSummary {
  season_number: number;
  name: string;
  episode_count: number;
}

/** An episode in a season's `episodes`. */
export interface TmdbEpisode {
  episode_number: number;
  name: string;
  /** "YYYY-MM-DD", or "" / null when unknown. */
  air_date?: string | null;
  /** Minutes, or null when unknown. */
  runtime?: number | null;
  overview?: string | null;
  still_path?: string | null;
}

/** `GET /tv/{id}/season/{n}`, also appended to the show as `season/{n}`. */
export interface TmdbSeason {
  season_number: number;
  name: string;
  episodes: TmdbEpisode[];
}

/**
 * `GET /tv/{id}?append_to_response=credits,season/{n}`. TMDB leaves `season/{n}` out when the show
 * has no season `n`.
 */
export interface TmdbTvDetails {
  id: number;
  name: string;
  adult: boolean;
  /** Present on live responses next to `adult`; softcore shows are excluded like adult ones. */
  softcore?: boolean;
  /** "YYYY-MM-DD", or "" / null when unknown. */
  first_air_date?: string | null;
  /** The latest aired episode's date, or null when nothing has aired. */
  last_air_date?: string | null;
  /** True while the show is still running. */
  in_production: boolean;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
  genres: TmdbGenre[];
  vote_average: number;
  vote_count: number;
  overview: string | null;
  poster_path: string | null;
  created_by: TmdbTvCreator[];
  /** Every season, Specials (season 0) included; TMDB may leave it out for a bare show. */
  seasons?: TmdbSeasonSummary[];
  credits: {
    cast: TmdbCastMember[];
  };
  [season: `season/${number}`]: TmdbSeason | undefined;
}
