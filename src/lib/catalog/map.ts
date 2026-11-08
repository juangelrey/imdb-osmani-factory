import type {
  TmdbCastMember,
  TmdbCrewMember,
  TmdbGenre,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonCastCredit,
  TmdbPersonCombinedCredits,
  TmdbPersonCredit,
  TmdbPersonDetails,
  TmdbPersonListItem,
  TmdbRecommendations,
  TmdbEpisode,
  TmdbSeason,
  TmdbSeasonSummary,
  TmdbTvDetails,
  TmdbTvListItem,
} from "@/lib/tmdb/schema";
import { ageOn, formatDate, truncateText } from "./format";
import type {
  CareerEntry,
  CareerYear,
  CreditsFilter,
  Episode,
  Genre,
  Paged,
  Person,
  PersonLink,
  PersonSummary,
  Season,
  SeasonSummary,
  Show,
  ShowSummary,
  Title,
  TitleKind,
  TitleSummary,
} from "./types";

/** TMDB serves at most this many pages for discover and search. */
export const MAX_PAGES = 500;

const CAST_LIMIT = 10;

/** How many recommendations a title or show page shows. */
export const RECOMMENDATIONS_LIMIT = 12;

export type PosterSize = "w92" | "w185" | "w342" | "w500";
export type ProfileSize = "w185" | "h632";

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

/** The page a summary links to: `/title/…` for a movie, `/tv/…` for a show. */
export function summaryHref(title: Pick<TitleSummary, "kind" | "id" | "slug">): string {
  return title.kind === "tv" ? showHref(title) : titleHref(title);
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

/** Parse `?season=N`: a whole number without leading zeros, or undefined. Repeated params use the first. */
export function parseSeasonParam(param: string | string[] | undefined): number | undefined {
  const value = Array.isArray(param) ? param[0] : param;
  if (value === undefined || !/^(0|[1-9]\d*)$/.test(value)) return undefined;
  const season = Number(value);
  return Number.isSafeInteger(season) ? season : undefined;
}

const CREDITS_FILTERS: readonly CreditsFilter[] = ["all", "movie", "tv"];

/** Parse `?credits=`; undefined when absent or unknown (the page then shows all credits). */
export function parseCreditsParam(param: string | string[] | undefined): CreditsFilter | undefined {
  const value = Array.isArray(param) ? param[0] : param;
  return CREDITS_FILTERS.find((filter) => filter === value);
}

/** The career with only one kind's credits, in the same order; years left empty are dropped. */
export function filterCareer(career: CareerYear[], credits: CreditsFilter): CareerYear[] {
  if (credits === "all") return career;
  return career
    .map((year) => ({
      ...year,
      entries: year.entries.filter((entry) => entry.title.kind === credits),
    }))
    .filter((year) => year.entries.length > 0);
}

/** The kinds of title a career holds. */
export function careerKinds(career: CareerYear[]): Set<TitleKind> {
  return new Set(career.flatMap((year) => year.entries.map((entry) => entry.title.kind)));
}

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
    recommendations: toRecommendations(movie.recommendations, toSummary),
  };
}

/**
 * A title's recommendations in TMDB order, adult and softcore ones skipped, at most
 * `RECOMMENDATIONS_LIMIT`. `map` turns an item into a summary of the page's own kind
 * (`toSummary` for a movie, `toShowSummary` for a show). Empty when TMDB sent none.
 */
export function toRecommendations<T>(
  recommendations: TmdbRecommendations<T> | undefined,
  map: (item: T) => TitleSummary,
): TitleSummary[] {
  return (recommendations?.results ?? [])
    .filter((item) => !item.adult && !item.softcore)
    .slice(0, RECOMMENDATIONS_LIMIT)
    .map(map);
}

/** "2008–2013" for an ended show, "2019–" while running, "2019" for a single year; undefined without a first air date. */
function airYears(show: TmdbTvDetails): string | undefined {
  const first = releaseYear(show.first_air_date);
  if (first === undefined) return undefined;
  if (show.in_production) return `${first}–`;
  const last = releaseYear(show.last_air_date);
  return last !== undefined && last > first ? `${first}–${last}` : String(first);
}

function seasonName(number: number, name: string | null | undefined): string {
  return name?.trim() || `Season ${number}`;
}

/** Regular seasons in order, then Specials (season 0). */
function toSeasonSummaries(seasons: TmdbSeasonSummary[]): SeasonSummary[] {
  return seasons
    .map((season) => ({
      number: season.season_number,
      name: seasonName(season.season_number, season.name),
      episodeCount: season.episode_count,
    }))
    .sort((a, b) => (a.number === 0 ? Infinity : a.number) - (b.number === 0 ? Infinity : b.number));
}

/** The season shown without `?season`: season 1, else the first listed (Specials last); undefined with no seasons. */
export function defaultSeason(seasons: SeasonSummary[]): number | undefined {
  if (seasons.some(({ number }) => number === 1)) return 1;
  return seasons.find(({ number }) => number !== 0)?.number ?? seasons[0]?.number;
}

export function toEpisode(episode: TmdbEpisode): Episode {
  return {
    number: episode.episode_number,
    name: episode.name?.trim() || `Episode ${episode.episode_number}`,
    airDate: episode.air_date || undefined,
    runtime: episode.runtime || undefined,
    synopsis: episode.overview?.trim() || undefined,
    stillUrl: imageUrl(episode.still_path, "w185"),
  };
}

/** A season of a show, with its episodes in order. */
export function toSeason(season: TmdbSeason): Season {
  return {
    number: season.season_number,
    name: seasonName(season.season_number, season.name),
    episodes: season.episodes.map(toEpisode).sort((a, b) => a.number - b.number),
  };
}

/** `season` is the selected season's TMDB response, when the show has one. */
export function toShow(show: TmdbTvDetails, season?: TmdbSeason): Show {
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
    seasons: toSeasonSummaries(show.seasons ?? []),
    season: season && toSeason(season),
    recommendations: toRecommendations(show.recommendations, toShowSummary),
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
    career: toCareer(person.combined_credits, today),
  };
}

/** A movie by its release date; a show by when this person first appeared in it, else its first air date. */
function creditDate(credit: TmdbPersonCredit): string | undefined {
  if (credit.media_type === "movie") return credit.release_date || undefined;
  return credit.first_credit_air_date || credit.first_air_date || undefined;
}

/** "as <character>" (or "Actor"), plus " · <n> episode(s)" for a show. */
function actingRole(credit: TmdbPersonCastCredit): string {
  const role = credit.character ? `as ${credit.character}` : "Actor";
  if (credit.media_type !== "tv" || !credit.episode_count) return role;
  const count = credit.episode_count;
  return `${role} · ${count} ${count === 1 ? "episode" : "episodes"}`;
}

/** The preview card clamps the synopsis to four lines; this keeps a long one out of the page payload. */
const CAREER_SYNOPSIS_MAX = 300;

function careerSynopsis(overview: string | null | undefined): string | undefined {
  const text = overview?.trim();
  return text ? truncateText(text, CAREER_SYNOPSIS_MAX) : undefined;
}

/**
 * Merge acting and directing credits into one entry per film or show, grouped by year, newest first.
 * A movie and a show with the same id stay separate. Other crew jobs (Creator, Writer, producers) are
 * dropped. `today` is "YYYY-MM-DD"; titles dated after it are flagged upcoming.
 */
export function toCareer(credits: TmdbPersonCombinedCredits, today: string): CareerYear[] {
  const byTitle = new Map<string, CareerEntry>();
  const add = (credit: TmdbPersonCredit, role: string) => {
    if (credit.adult || credit.softcore) return;
    const key = `${credit.media_type}-${credit.id}`;
    const date = creditDate(credit);
    const entry = byTitle.get(key) ?? {
      title: {
        ...(credit.media_type === "tv" ? toShowSummary(credit) : toSummary(credit)),
        posterUrl: posterUrl(credit.poster_path, "w92"),
      },
      releaseDate: date,
      upcoming: false,
      roles: [],
      synopsis: careerSynopsis(credit.overview),
      previewPosterUrl: posterUrl(credit.poster_path, "w185"),
    };
    // Several rows for one show can start on different dates; the person's first appearance wins.
    if (date && (!entry.releaseDate || date < entry.releaseDate)) entry.releaseDate = date;
    entry.upcoming = Boolean(entry.releaseDate && entry.releaseDate > today);
    if (!entry.roles.includes(role)) entry.roles.push(role);
    byTitle.set(key, entry);
  };
  credits.crew.filter((credit) => credit.job === "Director").forEach((credit) => add(credit, "Director"));
  [...credits.cast]
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    .forEach((credit) => add(credit, actingRole(credit)));
  return groupByYearDesc([...byTitle.values()]);
}

/**
 * Undated titles first, under "TBA"; then years newest first, each sorted by date (newest first), then
 * title. The year is the entry's date, so a show sits in the year the person first appeared in it.
 */
function groupByYearDesc(entries: CareerEntry[]): CareerYear[] {
  const sorted = [...entries].sort((a, b) => {
    if (a.releaseDate === b.releaseDate) return a.title.name.localeCompare(b.title.name);
    if (!a.releaseDate) return -1;
    if (!b.releaseDate) return 1;
    return a.releaseDate < b.releaseDate ? 1 : -1;
  });
  const years: CareerYear[] = [];
  for (const entry of sorted) {
    const year = releaseYear(entry.releaseDate);
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

/** A page of people search results in TMDB order, adult profiles skipped; the counts stay TMDB's. */
export function toPersonSearchPage(page: TmdbPaged<TmdbPersonListItem>): Paged<PersonSummary> {
  return toPaged({ ...page, results: page.results.filter((person) => !person.adult) }, (person) => ({
    id: person.id,
    slug: slugify(person.name, "person"),
    name: person.name,
    knownFor: person.known_for_department?.trim() || undefined,
    profileUrl: profileUrl(person.profile_path, "w185"),
  }));
}

export function toPaged<T, U>(page: TmdbPaged<T>, map: (item: T) => U): Paged<U> {
  return {
    results: page.results.map(map),
    page: page.page,
    totalPages: Math.min(page.total_pages, MAX_PAGES),
    totalResults: page.total_results,
  };
}
