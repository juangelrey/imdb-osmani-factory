import details from "@/lib/tmdb/fixtures/movie-details.json";
import sparse from "@/lib/tmdb/fixtures/movie-details-sparse.json";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import person from "@/lib/tmdb/fixtures/person-details.json";
import sparsePerson from "@/lib/tmdb/fixtures/person-details-sparse.json";
import type {
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaged,
  TmdbPersonCastCredit,
  TmdbPersonCrewCredit,
  TmdbPersonDetails,
} from "@/lib/tmdb/schema";
import {
  MAX_PAGES,
  parsePersonParam,
  parseTitleParam,
  personHref,
  posterUrl,
  profileUrl,
  slugify,
  titleHref,
  toCareer,
  toGenre,
  toPaged,
  toPerson,
  toSummary,
  toTitle,
} from "./map";

const matrix = details as TmdbMovieDetails;
const sparseMovie = sparse as TmdbMovieDetails;
const discoverPage = discover as TmdbPaged<TmdbMovieListItem>;

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
      career: toCareer(clint.movie_credits, TODAY),
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

describe("toCareer", () => {
  it("merges the fixture's acting and directing credits into one entry per film, newest year first", () => {
    const career = toCareer((person as TmdbPersonDetails).movie_credits, TODAY);
    expect(career.map((year) => year.label)).toEqual(["2024", "2008", "1992", "1966"]);
    expect(career.map((year) => year.entries.map((entry) => [entry.title.name, entry.roles]))).toEqual([
      [["Juror #2", ["Director"]]],
      [["Gran Torino", ["Director", "as Walt Kowalski"]]],
      [["Unforgiven", ["Director", "as Bill Munny"]]],
      [["The Good, the Bad and the Ugly", ["as Blondie"]]],
    ]);
  });

  it("maps each film to a summary with a w92 thumbnail and its release date", () => {
    const [, , unforgiven] = toCareer((person as TmdbPersonDetails).movie_credits, TODAY);
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
          },
          releaseDate: "1992-08-07",
          upcoming: false,
          roles: ["Director", "as Bill Munny"],
        },
      ],
    });
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

  it("drops adult and softcore credits", () => {
    const career = toCareer((sparsePerson as TmdbPersonDetails).movie_credits, TODAY);
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
