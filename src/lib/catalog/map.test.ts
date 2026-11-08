import details from "@/lib/tmdb/fixtures/movie-details.json";
import sparse from "@/lib/tmdb/fixtures/movie-details-sparse.json";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import person from "@/lib/tmdb/fixtures/person-details.json";
import sparsePerson from "@/lib/tmdb/fixtures/person-details-sparse.json";
import tvDetails from "@/lib/tmdb/fixtures/tv-details.json";
import tvSparse from "@/lib/tmdb/fixtures/tv-details-sparse.json";
import tvSeason from "@/lib/tmdb/fixtures/tv-season.json";
import type {
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonCastCredit,
  TmdbPersonCrewCredit,
  TmdbPersonDetails,
  TmdbPersonTvCredit,
  TmdbSeason,
  TmdbTvDetails,
} from "@/lib/tmdb/schema";
import type { CareerYear } from "./types";
import {
  careerKinds,
  defaultSeason,
  filterCareer,
  MAX_PAGES,
  parseCreditsParam,
  parsePersonParam,
  parseSeasonParam,
  parseShowParam,
  parseTitleParam,
  personHref,
  posterUrl,
  profileUrl,
  showHref,
  slugify,
  titleHref,
  toCareer,
  toEpisode,
  toGenre,
  toPaged,
  toPerson,
  toSeason,
  toShow,
  toShowSummary,
  toSummary,
  toTitle,
} from "./map";

const matrix = details as TmdbMovieDetails;
const sparseMovie = sparse as TmdbMovieDetails;
const discoverPage = discover as TmdbPaged<TmdbMovieListItem>;
const breakingBad = tvDetails as TmdbTvDetails;
const sparseShow = tvSparse as TmdbTvDetails;

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("The Matrix")).toBe("the-matrix");
  });

  it("drops punctuation and collapses separators", () => {
    expect(slugify("Spider-Man: Into the Spider-Verse")).toBe("spider-man-into-the-spider-verse");
    expect(slugify("  Dr. Strangelove  ")).toBe("dr-strangelove");
  });

  it("strips accents", () => {
    expect(slugify("Amélie")).toBe("amelie");
  });

  it("falls back to 'movie' when nothing is left", () => {
    expect(slugify("千と千尋の神隠し")).toBe("movie");
    expect(slugify("")).toBe("movie");
  });
});

describe("titleHref and parseTitleParam", () => {
  it("builds /title/<id>-<slug>", () => {
    expect(titleHref({ id: 603, slug: "the-matrix" })).toBe("/title/603-the-matrix");
  });

  it("parses an id and slug", () => {
    expect(parseTitleParam("603-the-matrix")).toEqual({ id: 603, slug: "the-matrix" });
  });

  it("parses a bare id with an empty slug", () => {
    expect(parseTitleParam("603")).toEqual({ id: 603, slug: "" });
  });

  it.each(["the-matrix", "", "0-zero", "-603", "6.5-x", "abc603"])("rejects %j", (param) => {
    expect(parseTitleParam(param)).toBeUndefined();
  });

  it("round-trips", () => {
    expect(parseTitleParam(titleHref({ id: 27205, slug: "inception" }).slice("/title/".length))).toEqual({
      id: 27205,
      slug: "inception",
    });
  });
});

describe("personHref and parsePersonParam", () => {
  it("builds /person/<id>-<slug>", () => {
    expect(personHref({ id: 190, slug: "clint-eastwood" })).toBe("/person/190-clint-eastwood");
  });

  it("parses an id and slug, or a bare id", () => {
    expect(parsePersonParam("190-clint-eastwood")).toEqual({ id: 190, slug: "clint-eastwood" });
    expect(parsePersonParam("190")).toEqual({ id: 190, slug: "" });
  });

  it.each(["clint-eastwood", "", "0-zero", "-190", "abc190"])("rejects %j", (param) => {
    expect(parsePersonParam(param)).toBeUndefined();
  });

  it("shares one parser with parseTitleParam", () => {
    expect(parsePersonParam).toBe(parseTitleParam);
  });
});

describe("profileUrl", () => {
  it("builds an h632 image.tmdb.org URL", () => {
    expect(profileUrl("/abc.jpg", "h632")).toBe("https://image.tmdb.org/t/p/h632/abc.jpg");
  });

  it("returns undefined without a path", () => {
    expect(profileUrl(null, "h632")).toBeUndefined();
  });
});

const TODAY = "2026-11-07";

describe("toPerson", () => {
  it("maps the name, slug, profile photo and career", () => {
    const clint = person as TmdbPersonDetails;
    expect(toPerson(clint, TODAY)).toEqual({
      id: 190,
      slug: "clint-eastwood",
      name: "Clint Eastwood",
      profileUrl: "https://image.tmdb.org/t/p/h632/dU35NnjZ8aGh9LxIgSXgXGr4jmx.jpg",
      knownFor: "Acting",
      born: "May 31, 1930 (age 96)",
      birthplace: "San Francisco, California, USA",
      biography:
        "Clinton Eastwood Jr. is an American actor and film director.\n\nHe rose to fame playing the Man with No Name in Sergio Leone's Dollars trilogy.",
      career: toCareer(clint.combined_credits, TODAY),
    });
  });

  it("leaves every fact undefined for the sparse fixture", () => {
    const mara = toPerson(sparsePerson as TmdbPersonDetails, TODAY);
    expect(mara.knownFor).toBeUndefined();
    expect(mara.born).toBeUndefined();
    expect(mara.died).toBeUndefined();
    expect(mara.birthplace).toBeUndefined();
    expect(mara.biography).toBeUndefined();
  });

  it("treats a whitespace-only biography as absent", () => {
    expect(toPerson({ ...(person as TmdbPersonDetails), biography: " \n " }, TODAY).biography).toBeUndefined();
  });

  it("gives a living person's age today", () => {
    expect(toPerson(person as TmdbPersonDetails, "2026-05-30").born).toBe("May 31, 1930 (age 95)");
  });

  it("gives the age at death under Died, and only the date under Born, for a person who has died", () => {
    const deceased = { ...(person as TmdbPersonDetails), deathday: "2020-11-05" };
    const mapped = toPerson(deceased, TODAY);
    expect(mapped.born).toBe("May 31, 1930");
    expect(mapped.died).toBe("November 5, 2020 (aged 90)");
  });

  it("shows no age anywhere when the birthday is missing", () => {
    const undated = { ...(person as TmdbPersonDetails), birthday: null };
    expect(toPerson(undated, TODAY).born).toBeUndefined();
    expect(toPerson({ ...undated, deathday: "2020-11-05" }, TODAY).died).toBe("November 5, 2020");
  });

  it("treats empty or malformed TMDB values as absent", () => {
    const blank = {
      ...(person as TmdbPersonDetails),
      birthday: "",
      deathday: "",
      place_of_birth: " ",
      known_for_department: "",
    };
    const mapped = toPerson(blank, TODAY);
    expect([mapped.knownFor, mapped.born, mapped.died, mapped.birthplace]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("leaves a missing photo undefined", () => {
    expect(toPerson(sparsePerson as TmdbPersonDetails, TODAY).profileUrl).toBeUndefined();
  });

  it("falls back to a 'person' slug when the name has no Latin letters", () => {
    expect(toPerson({ ...(person as TmdbPersonDetails), name: "宮崎駿" }, TODAY).slug).toBe("person");
  });
});

function film(id: number, title: string, release_date: string) {
  return {
    media_type: "movie" as const,
    adult: false,
    softcore: false,
    id,
    title,
    release_date,
    poster_path: null,
    vote_average: 7,
    vote_count: 10,
    genre_ids: [],
  };
}

function cast(id: number, title: string, release_date: string, character: string, order = 0): TmdbPersonCastCredit {
  return { ...film(id, title, release_date), character, order };
}

function crew(id: number, title: string, release_date: string, job: string): TmdbPersonCrewCredit {
  return { ...film(id, title, release_date), job, department: job === "Producer" ? "Production" : "Directing" };
}

function show(id: number, name: string, first_air_date: string, first_credit_air_date?: string): TmdbPersonTvCredit {
  return {
    media_type: "tv",
    adult: false,
    softcore: false,
    id,
    name,
    first_air_date,
    first_credit_air_date,
    episode_count: 1,
    poster_path: null,
    vote_average: 7,
    vote_count: 10,
    genre_ids: [],
  };
}

describe("toCareer", () => {
  it("merges the fixture's acting and directing credits into one entry per film or show, newest year first", () => {
    const career = toCareer((person as TmdbPersonDetails).combined_credits, TODAY);
    expect(career.map((year) => year.label)).toEqual(["2024", "2008", "1992", "1985", "1966", "1959"]);
    expect(career.map((year) => year.entries.map((entry) => [entry.title.name, entry.roles]))).toEqual([
      [["Juror #2", ["Director"]]],
      [["Gran Torino", ["Director", "as Walt Kowalski"]]],
      [["Unforgiven", ["Director", "as Bill Munny"]]],
      [["Amazing Stories", ["Director"]]],
      [["The Good, the Bad and the Ugly", ["as Blondie"]]],
      [["Rawhide", ["as Rowdy Yates · 217 episodes"]]],
    ]);
  });

  it("maps each film to a summary with a w92 thumbnail, its release date, and a w185 preview poster and synopsis", () => {
    const [, , unforgiven] = toCareer((person as TmdbPersonDetails).combined_credits, TODAY);
    expect(unforgiven).toEqual({
      year: 1992,
      label: "1992",
      entries: [
        {
          title: {
            id: 33,
            slug: "unforgiven",
            name: "Unforgiven",
            year: 1992,
            rating: 7.9,
            posterUrl: "https://image.tmdb.org/t/p/w92/54roTwbX9fltg85zjsmrooXAs12.jpg",
            kind: "movie",
          },
          releaseDate: "1992-08-07",
          upcoming: false,
          roles: ["Director", "as Bill Munny"],
          synopsis:
            "William Munny, a retired outlaw turned pig farmer, takes on one last job to collect a bounty.",
          previewPosterUrl: "https://image.tmdb.org/t/p/w185/54roTwbX9fltg85zjsmrooXAs12.jpg",
        },
      ],
    });
  });

  it("leaves the preview poster, synopsis and rating undefined when TMDB has none", () => {
    const blank = { ...film(1, "Bare", "2001-01-01"), overview: " ", vote_average: 0, vote_count: 0 };
    const [year] = toCareer({ cast: [{ ...blank, character: "Ann" }], crew: [] }, TODAY);
    const [entry] = year.entries;
    expect(entry.previewPosterUrl).toBeUndefined();
    expect(entry.synopsis).toBeUndefined();
    expect(entry.title.rating).toBeUndefined();
  });

  it("ignores crew jobs other than Director, including Co-Director", () => {
    const career = toCareer(
      {
        cast: [],
        crew: [crew(1, "Produced", "2001-01-01", "Producer"), crew(2, "Co-Directed", "2002-01-01", "Co-Director")],
      },
      TODAY,
    );
    expect(career).toEqual([]);
  });

  it("puts undated films, with an empty release date, in a TBA group at the top", () => {
    const career = toCareer(
      { cast: [cast(1, "Old", "1999-05-01", "Ann"), cast(2, "Announced", "", "Bea")], crew: [] },
      TODAY,
    );
    expect(career[0]).toMatchObject({ year: undefined, label: "TBA" });
    expect(career[0].entries[0]).toMatchObject({ releaseDate: undefined, upcoming: false });
    expect(career[0].entries[0].title).toMatchObject({ name: "Announced", year: undefined });
    expect(career[1].label).toBe("1999");
  });

  it("sorts films within a year by release date, newest first, then by title", () => {
    const career = toCareer(
      {
        cast: [
          cast(1, "March", "2010-03-01", "A"),
          cast(2, "Zulu", "2010-09-01", "B"),
          cast(3, "Alpha", "2010-09-01", "C"),
        ],
        crew: [],
      },
      TODAY,
    );
    expect(career[0].entries.map((entry) => entry.title.name)).toEqual(["Alpha", "Zulu", "March"]);
  });

  it("sorts undated films by title", () => {
    const career = toCareer({ cast: [cast(1, "Beta", "", "A"), cast(2, "Alpha", "", "B")], crew: [] }, TODAY);
    expect(career[0].entries.map((entry) => entry.title.name)).toEqual(["Alpha", "Beta"]);
  });

  it("lists Director first, then characters in billing order, each once", () => {
    const career = toCareer(
      {
        cast: [
          cast(1, "Film", "2000-01-01", "Second", 4),
          cast(1, "Film", "2000-01-01", "First", 1),
          cast(1, "Film", "2000-01-01", "First", 1),
        ],
        crew: [crew(1, "Film", "2000-01-01", "Director"), crew(1, "Film", "2000-01-01", "Director")],
      },
      TODAY,
    );
    expect(career[0].entries).toHaveLength(1);
    expect(career[0].entries[0].roles).toEqual(["Director", "as First", "as Second"]);
  });

  it("shows 'Actor' when the character is empty or missing, and character strings as TMDB gives them", () => {
    const noCharacter: TmdbPersonCastCredit = { ...film(3, "Missing", "2003-01-01"), order: 0 };
    const career = toCareer(
      {
        cast: [
          cast(1, "Empty", "2001-01-01", ""),
          cast(2, "Archive", "2002-01-01", "Self (archive footage)"),
          noCharacter,
        ],
        crew: [],
      },
      TODAY,
    );
    expect(career.flatMap((year) => year.entries.map((entry) => entry.roles))).toEqual([
      ["Actor"],
      ["as Self (archive footage)"],
      ["Actor"],
    ]);
  });

  it("drops adult and softcore credits, movie and TV", () => {
    const career = toCareer((sparsePerson as TmdbPersonDetails).combined_credits, TODAY);
    expect(career).toEqual([
      {
        year: undefined,
        label: "TBA",
        entries: [
          expect.objectContaining({ roles: ["Actor"], title: expect.objectContaining({ name: "Untitled Short" }) }),
        ],
      },
    ]);
  });

  it("drops an adult directing credit too", () => {
    const adult = { ...crew(1, "Adult", "2001-01-01", "Director"), adult: true };
    expect(toCareer({ cast: [], crew: [adult] }, TODAY)).toEqual([]);
  });

  it("flags films dated after today as upcoming, but not films released today", () => {
    const career = toCareer(
      { cast: [cast(1, "Tomorrow", "2026-11-08", "A"), cast(2, "Today", "2026-11-07", "B")], crew: [] },
      TODAY,
    );
    expect(career[0].entries.map((entry) => [entry.title.name, entry.upcoming])).toEqual([
      ["Tomorrow", true],
      ["Today", false],
    ]);
  });
});

describe("toCareer over TV credits", () => {
  const tvCast = (
    credit: TmdbPersonTvCredit,
    character: string,
    episode_count = credit.episode_count,
  ): TmdbPersonCastCredit => ({ ...credit, character, episode_count });
  const tvCrew = (credit: TmdbPersonTvCredit, job: string): TmdbPersonCrewCredit => ({
    ...credit,
    job,
    department: job === "Director" ? "Directing" : "Writing",
  });

  it("maps the fixture's show to a TV summary with a w92 thumbnail, its first credit date and a w185 preview", () => {
    const rawhide = toCareer((person as TmdbPersonDetails).combined_credits, TODAY).at(-1)!;
    expect(rawhide).toEqual({
      year: 1959,
      label: "1959",
      entries: [
        {
          title: {
            kind: "tv",
            id: 2343,
            slug: "rawhide",
            name: "Rawhide",
            year: 1959,
            rating: 7.4,
            posterUrl: "https://image.tmdb.org/t/p/w92/4G0zVAitlv6mn9EG5Z1fq7gRMLQ.jpg",
          },
          releaseDate: "1959-01-09",
          upcoming: false,
          roles: ["as Rowdy Yates · 217 episodes"],
          synopsis: "Trail boss Gil Favor and his ramrod Rowdy Yates drive cattle along the Sedalia Trail.",
          previewPosterUrl: "https://image.tmdb.org/t/p/w185/4G0zVAitlv6mn9EG5Z1fq7gRMLQ.jpg",
        },
      ],
    });
  });

  it("dates a show by first_credit_air_date, then first_air_date, then TBA", () => {
    const career = toCareer(
      {
        cast: [
          tvCast(show(1, "Guest Spot", "1984-09-30", "1986-04-06"), "Brian East"),
          tvCast(show(2, "No Credit Date", "1990-04-09"), "Anchor"),
          tvCast({ ...show(3, "Blank Credit Date", "1995-01-01"), first_credit_air_date: "" }, "Host"),
          tvCast({ ...show(4, "Announced Show", ""), first_credit_air_date: null }, "Lead"),
        ],
        crew: [],
      },
      TODAY,
    );
    expect(
      career.map((year) => [year.label, year.entries.map((entry) => [entry.title.name, entry.releaseDate])]),
    ).toEqual([
      ["TBA", [["Announced Show", undefined]]],
      ["1995", [["Blank Credit Date", "1995-01-01"]]],
      ["1990", [["No Credit Date", "1990-04-09"]]],
      ["1986", [["Guest Spot", "1986-04-06"]]],
    ]);
    // The show's own year stays its first air year; the timeline places it by the credit date.
    expect(career[3].entries[0].title.year).toBe(1984);
  });

  it("reads TV roles as 'as <character> · <n> episode(s)', and 'Actor' without a character", () => {
    const career = toCareer(
      {
        cast: [
          tvCast(show(1, "One", "2001-01-01"), "Brian East", 1),
          tvCast(show(2, "Many", "2002-01-01"), "Rowdy Yates", 217),
          tvCast(show(3, "Unnamed", "2003-01-01"), "", 3),
          tvCast({ ...show(4, "Uncounted", "2004-01-01"), episode_count: undefined }, "Self"),
        ],
        crew: [],
      },
      TODAY,
    );
    expect(career.flatMap((year) => year.entries.map((entry) => entry.roles))).toEqual([
      ["as Self"],
      ["Actor · 3 episodes"],
      ["as Rowdy Yates · 217 episodes"],
      ["as Brian East · 1 episode"],
    ]);
  });

  it("keeps TV Director credits and drops Creator, Writer and producer jobs", () => {
    const series = show(1, "Series", "2000-01-09", "2003-03-16");
    const career = toCareer(
      {
        cast: [],
        crew: [
          tvCrew(series, "Director"),
          tvCrew(show(2, "Created", "2001-01-01"), "Creator"),
          tvCrew(show(3, "Written", "2002-01-01"), "Writer"),
          tvCrew(show(4, "Produced", "2003-01-01"), "Executive Producer"),
          tvCrew(show(5, "Produced Too", "2004-01-01"), "Producer"),
        ],
      },
      TODAY,
    );
    expect(career.flatMap((year) => year.entries.map((entry) => [entry.title.name, entry.roles]))).toEqual([
      ["Series", ["Director"]],
    ]);
  });

  it("merges a show's directing and acting rows into one entry, dated by the first appearance", () => {
    const career = toCareer(
      {
        cast: [tvCast(show(1, "Series", "2000-01-09", "2005-02-01"), "Himself", 2)],
        crew: [tvCrew(show(1, "Series", "2000-01-09", "2003-03-16"), "Director")],
      },
      TODAY,
    );
    expect(career).toHaveLength(1);
    expect(career[0].entries).toEqual([
      expect.objectContaining({ releaseDate: "2003-03-16", roles: ["Director", "as Himself · 2 episodes"] }),
    ]);
    expect(career[0].label).toBe("2003");
  });

  it("keeps a movie and a show with the same id as separate entries", () => {
    const career = toCareer(
      {
        cast: [cast(603, "The Matrix", "1999-03-31", "Neo"), tvCast(show(603, "Matrix Show", "1999-03-31"), "Neo")],
        crew: [],
      },
      TODAY,
    );
    expect(career[0].entries.map((entry) => [entry.title.kind, entry.title.id, entry.title.name])).toEqual([
      ["tv", 603, "Matrix Show"],
      ["movie", 603, "The Matrix"],
    ]);
  });

  it("drops adult and softcore shows, as cast and as Director", () => {
    const adult = { ...show(1, "Adult", "2001-01-01"), adult: true };
    const softcore = { ...show(2, "Softcore", "2002-01-01"), softcore: true };
    expect(
      toCareer({ cast: [tvCast(adult, "A"), tvCast(softcore, "B")], crew: [tvCrew(adult, "Director")] }, TODAY),
    ).toEqual([]);
  });

  it("flags a show whose first credit airs after today as upcoming", () => {
    const [year] = toCareer(
      { cast: [tvCast(show(1, "Next Season", "2020-01-01", "2026-11-08"), "Lead")], crew: [] },
      TODAY,
    );
    expect(year.entries[0]).toMatchObject({ upcoming: true, releaseDate: "2026-11-08" });
  });
});

describe("posterUrl", () => {
  it("builds an image.tmdb.org URL at the given size", () => {
    expect(posterUrl("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
    expect(posterUrl("/abc.jpg", "w500")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
  });

  it("returns undefined without a path", () => {
    expect(posterUrl(null, "w342")).toBeUndefined();
    expect(posterUrl(undefined, "w342")).toBeUndefined();
    expect(posterUrl("", "w342")).toBeUndefined();
  });
});

describe("toTitle", () => {
  it("maps a full TMDB movie", () => {
    expect(toTitle(matrix)).toEqual({
      id: 603,
      slug: "the-matrix",
      name: "The Matrix",
      year: 1999,
      runtime: 136,
      genres: [
        { id: 28, name: "Action" },
        { id: 878, name: "Science Fiction" },
      ],
      rating: 8.218,
      synopsis: matrix.overview,
      posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      directors: [
        { id: 9340, slug: "lana-wachowski", name: "Lana Wachowski" },
        { id: 9339, slug: "lilly-wachowski", name: "Lilly Wachowski" },
      ],
      cast: [
        { id: 6384, slug: "keanu-reeves", name: "Keanu Reeves" },
        { id: 2975, slug: "laurence-fishburne", name: "Laurence Fishburne" },
        { id: 530, slug: "carrie-anne-moss", name: "Carrie-Anne Moss" },
        { id: 1331, slug: "hugo-weaving", name: "Hugo Weaving" },
        { id: 9364, slug: "gloria-foster", name: "Gloria Foster" },
        { id: 532, slug: "joe-pantoliano", name: "Joe Pantoliano" },
        { id: 9372, slug: "marcus-chong", name: "Marcus Chong" },
        { id: 7244, slug: "julian-arahanga", name: "Julian Arahanga" },
        { id: 9374, slug: "matt-doran", name: "Matt Doran" },
        { id: 9361, slug: "belinda-mcclory", name: "Belinda McClory" },
      ],
    });
  });

  it("keeps every Director in TMDB order, once each, and no other crew job", () => {
    const lana = { id: 9340, name: "Lana Wachowski", job: "Director" };
    const crew = [
      { id: 1, name: "Co Director", job: "Co-Director" },
      lana,
      { id: 9339, name: "Lilly Wachowski", job: "Director" },
      lana,
      { id: 1279, name: "Joel Silver", job: "Producer" },
    ];
    expect(toTitle({ ...matrix, credits: { ...matrix.credits, crew } }).directors).toEqual([
      { id: 9340, slug: "lana-wachowski", name: "Lana Wachowski" },
      { id: 9339, slug: "lilly-wachowski", name: "Lilly Wachowski" },
    ]);
  });

  it("falls back to a person slug for names with nothing Latin left", () => {
    const crew = [{ id: 5, name: "宮崎駿", job: "Director" }];
    expect(toTitle({ ...matrix, credits: { cast: [], crew } }).directors).toEqual([
      { id: 5, slug: "person", name: "宮崎駿" },
    ]);
  });

  it("caps the cast at 10 in billing order", () => {
    const shuffled = { ...matrix, credits: { ...matrix.credits, cast: [...matrix.credits.cast].reverse() } };
    expect(toTitle(shuffled).cast).toHaveLength(10);
    expect(toTitle(shuffled).cast[0]).toEqual({ id: 6384, slug: "keanu-reeves", name: "Keanu Reeves" });
  });

  it("leaves missing fields undefined instead of 0, NaN or empty strings", () => {
    const title = toTitle(sparseMovie);
    expect(title.year).toBeUndefined();
    expect(title.runtime).toBeUndefined();
    expect(title.synopsis).toBeUndefined();
    expect(title.posterUrl).toBeUndefined();
    expect(title.posterPath).toBeUndefined();
    expect(title.directors).toEqual([]);
    expect(title.genres).toEqual([]);
    expect(title.cast).toEqual([]);
  });

  it("leaves the rating undefined when nobody has voted", () => {
    expect(toTitle(sparseMovie).rating).toBeUndefined();
    expect(toTitle({ ...matrix, vote_count: 0 }).rating).toBeUndefined();
  });

  it("treats a zero runtime as unknown", () => {
    expect(toTitle({ ...matrix, runtime: 0 }).runtime).toBeUndefined();
  });

  it("ignores a malformed release date", () => {
    expect(toTitle({ ...matrix, release_date: "soon" }).year).toBeUndefined();
  });
});

describe("toSummary", () => {
  it("maps a list item with a grid-size poster", () => {
    expect(toSummary(discoverPage.results[1])).toEqual({
      id: 603,
      slug: "the-matrix",
      name: "The Matrix",
      year: 1999,
      rating: 8.218,
      posterUrl: "https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      kind: "movie",
    });
  });

  it("leaves a missing year, poster and unvoted rating undefined", () => {
    const summary = toSummary(discoverPage.results[3]);
    expect(summary.year).toBeUndefined();
    expect(summary.posterUrl).toBeUndefined();
    expect(summary.rating).toBeUndefined();
  });
});

describe("toGenre", () => {
  it("keeps id and name", () => {
    expect(genreList.genres.map(toGenre)).toContainEqual({ id: 878, name: "Science Fiction" });
  });
});

describe("toPaged", () => {
  it("maps results and page counts", () => {
    const paged = toPaged(discoverPage, toSummary);
    expect(paged.page).toBe(1);
    expect(paged.results.map(({ name }) => name)).toEqual(["Inception", "The Matrix", "Fight Club", "Untitled Short"]);
    expect(paged.totalResults).toBe(964251);
  });

  it("caps total pages at TMDB's limit of 500", () => {
    expect(MAX_PAGES).toBe(500);
    expect(toPaged(discoverPage, toSummary).totalPages).toBe(500);
    expect(toPaged({ ...discoverPage, total_pages: 4 }, toSummary).totalPages).toBe(4);
  });
});

describe("showHref and parseShowParam", () => {
  it("builds /tv/<id>-<slug>", () => {
    expect(showHref({ id: 1396, slug: "breaking-bad" })).toBe("/tv/1396-breaking-bad");
  });

  it("parses the id and slug with the shared id-slug parser", () => {
    expect(parseShowParam("1396-breaking-bad")).toEqual({ id: 1396, slug: "breaking-bad" });
    expect(parseShowParam("1396")).toEqual({ id: 1396, slug: "" });
    expect(parseShowParam).toBe(parseTitleParam);
  });

  it.each(["abc", "0", "01396-breaking-bad", "-1396", ""])("rejects %j", (param) => {
    expect(parseShowParam(param)).toBeUndefined();
  });
});

describe("toShow", () => {
  it("maps every field of the full fixture", () => {
    const show = toShow(breakingBad);
    expect(show).toMatchObject({
      id: 1396,
      slug: "breaking-bad",
      name: "Breaking Bad",
      year: 2008,
      years: "2008–2013",
      seasonCount: 5,
      episodeCount: 62,
      genres: [
        { id: 18, name: "Drama" },
        { id: 80, name: "Crime" },
      ],
      rating: 8.9,
      synopsis: expect.stringContaining("chemistry teacher"),
      posterUrl: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      creators: [{ id: 66633, slug: "vince-gilligan", name: "Vince Gilligan" }],
    });
  });

  it("keeps the top 10 cast in billing order", () => {
    const cast = toShow(breakingBad).cast;
    expect(cast).toHaveLength(10);
    expect(cast[0]).toEqual({ id: 17419, slug: "bryan-cranston", name: "Bryan Cranston" });
    expect(cast.at(-1)?.name).toBe("Laura Fraser");
  });

  it("leaves every optional field empty for the sparse fixture", () => {
    expect(toShow(sparseShow)).toEqual({
      id: 299999,
      slug: "untitled-pilot",
      name: "Untitled Pilot",
      year: undefined,
      years: undefined,
      seasonCount: undefined,
      episodeCount: undefined,
      genres: [],
      rating: undefined,
      synopsis: undefined,
      posterUrl: undefined,
      posterPath: undefined,
      creators: [],
      cast: [],
      seasons: [],
      season: undefined,
    });
  });

  it("falls back to a 'show' slug when nothing Latin is left", () => {
    expect(toShow({ ...breakingBad, name: "半沢直樹" }).slug).toBe("show");
  });
});

describe("toShow year range", () => {
  it("spans first to last air year for an ended show", () => {
    expect(toShow(breakingBad).years).toBe("2008–2013");
  });

  it("is open-ended while the show is running", () => {
    expect(toShow({ ...breakingBad, first_air_date: "2019-04-14", last_air_date: "2025-06-01", in_production: true }).years).toBe(
      "2019–",
    );
  });

  it("is a single year when the show began and ended in the same year", () => {
    expect(toShow({ ...breakingBad, first_air_date: "2019-01-10", last_air_date: "2019-03-02" }).years).toBe("2019");
    expect(toShow({ ...breakingBad, first_air_date: "2019-01-10", last_air_date: null }).years).toBe("2019");
  });

  it("is undefined without a first air date, as in the sparse fixture", () => {
    expect(toShow(sparseShow).years).toBeUndefined();
    expect(toShow({ ...sparseShow, in_production: true }).years).toBeUndefined();
  });
});

describe("toShowSummary", () => {
  it("maps a TV list item into a tv-kind summary with a grid-size poster", () => {
    expect(
      toShowSummary({
        id: 1396,
        name: "Breaking Bad",
        first_air_date: "2008-01-20",
        vote_average: 8.9,
        vote_count: 15000,
        poster_path: "/bb.jpg",
      }),
    ).toEqual({
      kind: "tv",
      id: 1396,
      slug: "breaking-bad",
      name: "Breaking Bad",
      year: 2008,
      rating: 8.9,
      posterUrl: "https://image.tmdb.org/t/p/w342/bb.jpg",
    });
  });

  it("leaves a missing year, poster and unvoted rating undefined", () => {
    const summary = toShowSummary({ id: 9, name: "Pilot", first_air_date: "", vote_average: 0, vote_count: 0, poster_path: null });
    expect(summary).toMatchObject({ year: undefined, rating: undefined, posterUrl: undefined });
  });
});

const seasonOne = tvSeason as TmdbSeason;

describe("toShow seasons", () => {
  it("lists every season with its episode count, with Specials last", () => {
    expect(toShow(breakingBad).seasons.map(({ number, episodeCount }) => [number, episodeCount])).toEqual([
      [1, 7],
      [2, 13],
      [3, 13],
      [4, 13],
      [5, 16],
      [0, 9],
    ]);
  });

  it("names a nameless season after its number", () => {
    const show = toShow({ ...breakingBad, seasons: [{ season_number: 3, name: "", episode_count: 0 }] });
    expect(show.seasons).toEqual([{ number: 3, name: "Season 3", episodeCount: 0 }]);
  });

  it("keeps the selected season with its episodes", () => {
    expect(toShow(breakingBad, seasonOne).season?.episodes).toHaveLength(3);
  });
});

describe("defaultSeason", () => {
  it("is season 1 when the show has one", () => {
    expect(defaultSeason(toShow(breakingBad).seasons)).toBe(1);
  });

  it("is the first listed season, Specials last, when there is no season 1", () => {
    const seasons = [
      { number: 0, name: "Specials", episodeCount: 2 },
      { number: 2, name: "Season 2", episodeCount: 8 },
    ];
    expect(defaultSeason(seasons)).toBe(2);
    expect(defaultSeason([seasons[0]])).toBe(0);
  });

  it("is undefined when the show lists no seasons", () => {
    expect(defaultSeason([])).toBeUndefined();
  });
});

describe("parseSeasonParam", () => {
  it.each([
    ["1", 1],
    ["0", 0],
    ["12", 12],
  ])("reads %s as season %i", (param, season) => {
    expect(parseSeasonParam(param)).toBe(season);
  });

  it.each([undefined, "", "abc", "-1", "1.5", "01", " 2", "99999999999999999999"])("ignores %o", (param) => {
    expect(parseSeasonParam(param)).toBeUndefined();
  });

  it("reads the first of repeated params", () => {
    expect(parseSeasonParam(["3", "4"])).toBe(3);
  });
});

describe("parseCreditsParam", () => {
  it.each(["all", "movie", "tv"])("reads %s", (param) => {
    expect(parseCreditsParam(param)).toBe(param);
  });

  it.each([undefined, "", "junk", "TV", "movies", " tv"])("ignores %o", (param) => {
    expect(parseCreditsParam(param)).toBeUndefined();
  });

  it("reads the first of repeated params", () => {
    expect(parseCreditsParam(["tv", "movie"])).toBe("tv");
  });
});

describe("filterCareer and careerKinds", () => {
  const entry = (kind: "movie" | "tv", id: number) => ({
    title: { kind, id, slug: `t${id}`, name: `T${id}` },
    upcoming: false,
    roles: ["Actor"],
  });
  const career: CareerYear[] = [
    { label: "TBA", entries: [entry("tv", 1)] },
    { year: 2020, label: "2020", entries: [entry("movie", 2), entry("tv", 3), entry("movie", 4)] },
    { year: 2010, label: "2010", entries: [entry("movie", 5)] },
  ];
  const ids = (years: CareerYear[]) => years.map((y) => [y.label, y.entries.map((e) => e.title.id)]);

  it("returns the career unchanged for all", () => {
    expect(filterCareer(career, "all")).toBe(career);
  });

  it("keeps only one kind, in order, and drops the years left empty", () => {
    expect(ids(filterCareer(career, "movie"))).toEqual([
      ["2020", [2, 4]],
      ["2010", [5]],
    ]);
    expect(ids(filterCareer(career, "tv"))).toEqual([
      ["TBA", [1]],
      ["2020", [3]],
    ]);
  });

  it("returns no years for a kind the person has no credits of", () => {
    expect(filterCareer([career[2]], "tv")).toEqual([]);
  });

  it("lists the kinds a career holds", () => {
    expect(careerKinds(career)).toEqual(new Set(["movie", "tv"]));
    expect(careerKinds([career[2]])).toEqual(new Set(["movie"]));
    expect(careerKinds([])).toEqual(new Set());
  });
});

describe("toSeason", () => {
  it("keeps the number and name and sorts episodes by number", () => {
    const season = toSeason(seasonOne);
    expect(season).toMatchObject({ number: 1, name: "Season 1" });
    expect(season.episodes.map(({ number }) => number)).toEqual([1, 2, 3]);
  });

  it("names a nameless season after its number", () => {
    expect(toSeason({ ...seasonOne, name: "" }).name).toBe("Season 1");
  });
});

describe("toEpisode", () => {
  it("maps every field of a full episode, with a w185 still", () => {
    expect(toEpisode(seasonOne.episodes[1])).toEqual({
      number: 1,
      name: "Pilot",
      airDate: "2008-01-20",
      runtime: 59,
      synopsis: expect.stringContaining("chemistry teacher"),
      stillUrl: "https://image.tmdb.org/t/p/w185/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg",
    });
  });

  it("leaves a missing air date, runtime, overview and still undefined and names the episode by number", () => {
    expect(toEpisode(seasonOne.episodes[2])).toEqual({
      number: 3,
      name: "Episode 3",
      airDate: undefined,
      runtime: undefined,
      synopsis: undefined,
      stillUrl: undefined,
    });
  });
});
