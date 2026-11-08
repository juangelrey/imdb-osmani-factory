import type {
  TmdbCastMember,
  TmdbCrewMember,
  TmdbGenre,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonDetails,
  TmdbPersonMovieCredit,
  TmdbPersonMovieCredits,
  TmdbTvDetails,
  TmdbTvListItem,
} from "@/lib/tmdb/schema";
import { ageOn, formatDate } from "./format";
import type {
  CareerEntry,
  CareerYear,
  Genre,
  Paged,
  Person,
  PersonLink,
  Show,
  ShowSummary,
  Title,
  TitleSummary,
} from "./types";

/** TMDB serves at most this many pages for discover and search. */
export const MAX_PAGES = 500;

const CAST_LIMIT = 10;

export type PosterSize = "w92" | "w185" | "w342" | "w500";
export type ProfileSize = "h632";

/** URL slug for a name; `fallback` is used when nothing Latin is left, e.g. "千と千尋の神隠し". */
export function slugify(name: string, fallback = "movie"): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function titleHref({ id, slug }: { id: number; slug: string }): string {
  return `/title/${id}-${slug}`;
}

export function showHref({ id, slug }: { id: number; slug: string }): string {
  return `/tv/${id}-${slug}`;
}

export function personHref({ id, slug }: { id: number; slug: string }): string {
  return `/person/${id}-${slug}`;
}

/** Parse a route param shaped "<id>-<slug>" or "<id>". */
function parseIdSlugParam(param: string): { id: number; slug: string } | undefined {
  const match = /^([1-9]\d*)(?:-(.*))?$/.exec(param);
  if (!match) return undefined;
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id)) return undefined;
  return { id, slug: match[2] ?? "" };
}

/** Parse a `/title/[id]` route param shaped "<id>-<slug>" or "<id>". */
export const parseTitleParam = parseIdSlugParam;

/** Parse a `/tv/[id]` route param shaped "<id>-<slug>" or "<id>". */
export const parseShowParam = parseIdSlugParam;

/** Parse a `/person/[id]` route param shaped "<id>-<slug>" or "<id>". */
export const parsePersonParam = parseIdSlugParam;

function imageUrl(path: string | null | undefined, size: string): string | undefined {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

export function posterUrl(path: string | null | undefined, size: PosterSize): string | undefined {
  return imageUrl(path, size);
}

export function profileUrl(path: string | null | undefined, size: ProfileSize): string | undefined {
  return imageUrl(path, size);
}

/** TMDB reports 0 for films nobody has rated; that is unknown, not zero. */
function rating({ vote_average, vote_count }: { vote_average: number; vote_count: number }): number | undefined {
  return vote_count > 0 ? vote_average : undefined;
}

function releaseYear(date: string | null | undefined): number | undefined {
  const match = /^(\d{4})-/.exec(date ?? "");
  return match ? Number(match[1]) : undefined;
}

export function toPersonLink({ id, name }: { id: number; name: string }): PersonLink {
  return { id, slug: slugify(name, "person"), name };
}

/** Every crew member with job "Director", in TMDB order, once each. Co-Director and other jobs are left out. */
function directors(crew: TmdbCrewMember[]): PersonLink[] {
  const byId = new Map<number, PersonLink>();
  for (const person of crew) {
    if (person.job === "Director" && !byId.has(person.id)) byId.set(person.id, toPersonLink(person));
  }
  return [...byId.values()];
}

/** The top-billed cast, at most `CAST_LIMIT`, in billing order. */
function topCast(cast: TmdbCastMember[]): PersonLink[] {
  return [...cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, CAST_LIMIT)
    .map(toPersonLink);
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
    rating: rating(movie),
    synopsis: movie.overview || undefined,
    posterUrl: posterUrl(movie.poster_path, "w500"),
    posterPath: movie.poster_path || undefined,
    directors: directors(movie.credits.crew),
    cast: topCast(movie.credits.cast),
  };
}

/** "2008–2013" for an ended show, "2019–" while running, "2019" for a single year; undefined without a first air date. */
function airYears(show: TmdbTvDetails): string | undefined {
  const first = releaseYear(show.first_air_date);
  if (first === undefined) return undefined;
  if (show.in_production) return `${first}–`;
  const last = releaseYear(show.last_air_date);
  return last !== undefined && last > first ? `${first}–${last}` : String(first);
}

export function toShow(show: TmdbTvDetails): Show {
  const creators = new Map<number, PersonLink>();
  for (const creator of show.created_by) if (!creators.has(creator.id)) creators.set(creator.id, toPersonLink(creator));
  return {
    id: show.id,
    slug: slugify(show.name, "show"),
    name: show.name,
    year: releaseYear(show.first_air_date),
    years: airYears(show),
    seasonCount: show.number_of_seasons || undefined,
    episodeCount: show.number_of_episodes || undefined,
    genres: show.genres.map(toGenre),
    rating: rating(show),
    synopsis: show.overview?.trim() || undefined,
    posterUrl: posterUrl(show.poster_path, "w500"),
    posterPath: show.poster_path || undefined,
    creators: [...creators.values()],
    cast: topCast(show.credits.cast),
  };
}

/** A date with an age in brackets, e.g. "May 31, 1930 (age 96)"; the age is left off when unknown. */
function dateWithAge(date: string | undefined, age: string | undefined): string | undefined {
  return date && (age ? `${date} (${age})` : date);
}

/** `today` is "YYYY-MM-DD"; it decides which films are upcoming and how old a living person is. */
export function toPerson(person: TmdbPersonDetails, today: string): Person {
  const birthday = person.birthday ?? "";
  const deathday = person.deathday ?? "";
  const died = formatDate(deathday);
  const ageAtDeath = died ? ageOn(birthday, deathday) : undefined;
  const ageToday = died ? undefined : ageOn(birthday, today);
  return {
    id: person.id,
    slug: slugify(person.name, "person"),
    name: person.name,
    profileUrl: profileUrl(person.profile_path, "h632"),
    knownFor: person.known_for_department?.trim() || undefined,
    born: dateWithAge(formatDate(birthday), ageToday === undefined ? undefined : `age ${ageToday}`),
    died: dateWithAge(died, ageAtDeath === undefined ? undefined : `aged ${ageAtDeath}`),
    birthplace: person.place_of_birth?.trim() || undefined,
    biography: person.biography?.trim() || undefined,
    career: toCareer(person.movie_credits, today),
  };
}

/**
 * Merge acting and directing credits into one entry per film, grouped by year, newest first.
 * `today` is "YYYY-MM-DD"; films dated after it are flagged upcoming.
 */
export function toCareer(credits: TmdbPersonMovieCredits, today: string): CareerYear[] {
  const byFilm = new Map<number, CareerEntry>();
  const add = (film: TmdbPersonMovieCredit, role: string) => {
    if (film.adult || film.softcore) return;
    const entry = byFilm.get(film.id) ?? {
      title: { ...toSummary(film), posterUrl: posterUrl(film.poster_path, "w92") },
      releaseDate: film.release_date || undefined,
      upcoming: Boolean(film.release_date && film.release_date > today),
      roles: [],
      synopsis: film.overview?.trim() || undefined,
      previewPosterUrl: posterUrl(film.poster_path, "w185"),
    };
    if (!entry.roles.includes(role)) entry.roles.push(role);
    byFilm.set(film.id, entry);
  };
  credits.crew.filter((credit) => credit.job === "Director").forEach((credit) => add(credit, "Director"));
  [...credits.cast]
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .forEach((credit) => add(credit, credit.character ? `as ${credit.character}` : "Actor"));
  return groupByYearDesc([...byFilm.values()]);
}

/** Undated films first, under "TBA"; then years newest first, each sorted by date (newest first), then title. */
function groupByYearDesc(entries: CareerEntry[]): CareerYear[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.releaseDate === b.releaseDate) return a.title.name.localeCompare(b.title.name);
    if (!a.releaseDate) return -1;
    if (!b.releaseDate) return 1;
    return a.releaseDate < b.releaseDate ? 1 : -1;
  });
  const years: CareerYear[] = [];
  for (const entry of sorted) {
    const year = entry.title.year;
    const label = year === undefined ? "TBA" : String(year);
    const last = years.at(-1);
    if (last?.label === label) last.entries.push(entry);
    else years.push({ year, label, entries: [entry] });
  }
  return years;
}

export function toSummary(movie: TmdbMovieListItem): TitleSummary {
  return {
    kind: "movie",
    id: movie.id,
    slug: slugify(movie.title),
    name: movie.title,
    year: releaseYear(movie.release_date),
    rating: rating(movie),
    posterUrl: posterUrl(movie.poster_path, "w342"),
  };
}

export function toShowSummary(show: TmdbTvListItem): ShowSummary {
  return {
    kind: "tv",
    id: show.id,
    slug: slugify(show.name, "show"),
    name: show.name,
    year: releaseYear(show.first_air_date),
    rating: rating(show),
    posterUrl: posterUrl(show.poster_path, "w342"),
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
