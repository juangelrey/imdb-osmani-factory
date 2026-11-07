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
  /** Average rating from 0 to 10; undefined when nobody has voted. */
  rating?: number;
  synopsis?: string;
  /** Detail-size poster URL. */
  posterUrl?: string;
  /** TMDB's poster path, kept so snapshots can build any poster size later. */
  posterPath?: string;
  /** Every crew member with job "Director", in TMDB order; empty when there are none. */
  directors: PersonLink[];
  /** Top-billed cast, at most 10. */
  cast: PersonLink[];
}

/** The fields a title card needs. */
export interface TitleSummary {
  id: number;
  slug: string;
  name: string;
  year?: number;
  rating?: number;
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

/** A person as a link target: `/person/<id>-<slug>`. */
export interface PersonLink {
  id: number;
  slug: string;
  name: string;
}

/** A person as the person page shows it. Fields TMDB may omit are optional. */
export interface Person extends PersonLink {
  /** Profile-size (h632) photo URL. */
  profileUrl?: string;
  /** TMDB's department, e.g. "Acting" or "Directing". */
  knownFor?: string;
  /** Birth date, plus the age today for a living person: "May 31, 1930 (age 96)". */
  born?: string;
  /** Death date, plus the age at death when the birthday is known: "November 5, 2020 (aged 90)". */
  died?: string;
  birthplace?: string;
  /** TMDB's biography, with its paragraph breaks ("\n\n") kept. */
  biography?: string;
  /** Movie credits, one entry per film, grouped by year. */
  career: CareerYear[];
}

/** One film in a person's career, with every role they had in it. */
export interface CareerEntry {
  /** The film, with a thumbnail-size (w92) poster URL. */
  title: TitleSummary;
  /** "YYYY-MM-DD"; undefined when TMDB has no date. */
  releaseDate?: string;
  /** Dated after today. */
  upcoming: boolean;
  /** "Director" first, then "as <character>" (or "Actor") in billing order. */
  roles: string[];
}

/** A year of a person's career; undated films form a "TBA" group with no year. */
export interface CareerYear {
  year?: number;
  /** The heading: the year, or "TBA". */
  label: string;
  entries: CareerEntry[];
}
