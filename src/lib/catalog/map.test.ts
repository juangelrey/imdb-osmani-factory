import details from "@/lib/tmdb/fixtures/movie-details.json";
import sparse from "@/lib/tmdb/fixtures/movie-details-sparse.json";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import type { TmdbMovieDetails, TmdbMovieListItem, TmdbPaged } from "@/lib/tmdb/schema";
import { MAX_PAGES, parseTitleParam, posterUrl, slugify, titleHref, toGenre, toPaged, toSummary, toTitle } from "./map";

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
      director: "Lana Wachowski",
      cast: [
        "Keanu Reeves",
        "Laurence Fishburne",
        "Carrie-Anne Moss",
        "Hugo Weaving",
        "Gloria Foster",
        "Joe Pantoliano",
        "Marcus Chong",
        "Julian Arahanga",
        "Matt Doran",
        "Belinda McClory",
      ],
    });
  });

  it("caps the cast at 10 in billing order", () => {
    const shuffled = { ...matrix, credits: { ...matrix.credits, cast: [...matrix.credits.cast].reverse() } };
    expect(toTitle(shuffled).cast).toHaveLength(10);
    expect(toTitle(shuffled).cast[0]).toBe("Keanu Reeves");
  });

  it("leaves missing fields undefined instead of 0, NaN or empty strings", () => {
    const title = toTitle(sparseMovie);
    expect(title.year).toBeUndefined();
    expect(title.runtime).toBeUndefined();
    expect(title.synopsis).toBeUndefined();
    expect(title.posterUrl).toBeUndefined();
    expect(title.posterPath).toBeUndefined();
    expect(title.director).toBeUndefined();
    expect(title.genres).toEqual([]);
    expect(title.cast).toEqual([]);
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

  it("leaves a missing year and poster undefined", () => {
    const summary = toSummary(discoverPage.results[3]);
    expect(summary.year).toBeUndefined();
    expect(summary.posterUrl).toBeUndefined();
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
