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
  /** TMDB's recommended movies, at most 12, adult ones left out; empty when there are none. */
  recommendations: TitleSummary[];
}

/** Whether a summary is a movie (`/title`) or a TV show (`/tv`). A movie and a show can share an id. */
export type TitleKind = "movie" | "tv";

/** The person page's career filter (`?credits=`): every credit, or one kind. */
export type CreditsFilter = "all" | TitleKind;

/** The fields a title card needs. Identity is `kind` + `id`, never the id alone. */
export interface TitleSummary {
  kind: TitleKind;
  id: number;
  slug: string;
  name: string;
  year?: number;
  rating?: number;
  /** Grid-size poster URL. */
  posterUrl?: string;
}

/** A TV show as a card shows it. */
export interface ShowSummary extends TitleSummary {
  kind: "tv";
}

/** A TV show as the TV page shows it. Fields TMDB may omit are optional. */
export interface Show {
  id: number;
  slug: string;
  name: string;
  /** The first air year. */
  year?: number;
  /** "2008–2013", "2019–" while running, or "2019" for a single year; undefined without a first air date. */
  years?: string;
  seasonCount?: number;
  episodeCount?: number;
  genres: Genre[];
  /** Average rating from 0 to 10; undefined when nobody has voted. */
  rating?: number;
  synopsis?: string;
  /** Detail-size poster URL. */
  posterUrl?: string;
  /** TMDB's poster path, kept so snapshots can build any poster size later. */
  posterPath?: string;
  /** The show's creators, in TMDB order, once each; empty when there are none. */
  creators: PersonLink[];
  /** Top-billed cast, at most 10. */
  cast: PersonLink[];
  /** Every season for the picker, in order with Specials (season 0) last; empty when TMDB lists none. */
  seasons: SeasonSummary[];
  /** The selected season with its episodes; undefined when the show has no seasons. */
  season?: Season;
}

/** A season as the picker lists it. */
export interface SeasonSummary {
  number: number;
  /** TMDB's name, e.g. "Season 1" or "Specials". */
  name: string;
  episodeCount: number;
}

/** A season of a show, with its episodes in order. */
export interface Season {
  number: number;
  name: string;
  episodes: Episode[];
}

/** An episode as the episode list shows it. Fields TMDB may omit are optional. */
export interface Episode {
  number: number;
  name: string;
  /** "YYYY-MM-DD"; the list marks an episode dated after today as upcoming. */
  airDate?: string;
  /** Minutes. */
  runtime?: number;
  synopsis?: string;
  /** Still-size (w185) image URL. */
  stillUrl?: string;
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
  /** Movie and TV credits, one entry per film or show, grouped by year. */
  career: CareerYear[];
}

/** One film or show in a person's career, with every role they had in it. */
export interface CareerEntry {
  /** The film or show (by `kind`), with a thumbnail-size (w92) poster URL; `year` is its release or first air year. */
  title: TitleSummary;
  /**
   * "YYYY-MM-DD": a film's release date; for a show, when the person first appeared in it, else its
   * first air date. Undefined when TMDB has no date.
   */
  releaseDate?: string;
  /** Dated after today. */
  upcoming: boolean;
  /** "Director" first, then "as <character>" (or "Actor") in billing order; on a show, " · <n> episode(s)" follows. */
  roles: string[];
  /** The title's synopsis, for the preview card. The card's rating is `title.rating`. */
  synopsis?: string;
  /** Preview-card-size (w185) poster URL. */
  previewPosterUrl?: string;
}

/** A year of a person's career, by entry date; undated titles form a "TBA" group with no year. */
export interface CareerYear {
  year?: number;
  /** The heading: the year, or "TBA". */
  label: string;
  entries: CareerEntry[];
}
