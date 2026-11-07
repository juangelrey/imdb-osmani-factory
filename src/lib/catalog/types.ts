export interface Genre {
  id: number;
  name: string;
}

/** A movie as the title page shows it. Fields TMDB may omit are optional. */
export interface Title {
  id: number;
  slug: string;
  name: string;
  year?: number;
  /** Runtime in minutes. */
  runtime?: number;
  genres: Genre[];
  /** Average rating from 0 to 10. */
  rating: number;
  synopsis?: string;
  /** Detail-size poster URL. */
  posterUrl?: string;
  /** TMDB's poster path, kept so snapshots can build any poster size later. */
  posterPath?: string;
  director?: string;
  /** Top-billed cast, at most 10. */
  cast: string[];
}

/** The fields a title card needs. */
export interface TitleSummary {
  id: number;
  slug: string;
  name: string;
  year?: number;
  rating: number;
  /** Grid-size poster URL. */
  posterUrl?: string;
}

export interface Paged<T> {
  results: T[];
  page: number;
  /** Capped at TMDB's page limit. */
  totalPages: number;
  totalResults: number;
}
