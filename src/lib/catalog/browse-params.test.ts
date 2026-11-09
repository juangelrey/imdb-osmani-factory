import { DEFAULT_SORT, browseHref, parseBrowseParams, parseKind, parsePage } from "./browse-params";

const known = new Set([28, 878, 18]);

describe("parseBrowseParams", () => {
  it("defaults to all genres, popularity and page 1", () => {
    expect(DEFAULT_SORT).toBe("popularity");
    expect(parseBrowseParams({}, known, "US")).toEqual({ kind: "movie", genres: [], sort: "popularity", page: 1, region: "US", regionFromUrl: false });
  });

  it("reads a known genre id, sort key and page", () => {
    expect(parseBrowseParams({ genre: "878", sort: "rating", page: "3" }, known, "US")).toEqual({
      kind: "movie",
      genres: [878],
      sort: "rating",
      page: 3,
      region: "US",
      regionFromUrl: false,
    });
  });

  it.each(["release", "title", "popularity"])("accepts the %s sort", (sort) => {
    expect(parseBrowseParams({ sort }, known, "US").sort).toBe(sort);
  });

  it.each(["abc", "99999", "-28", "28.5", ""])("falls back to all genres for genre=%j", (genre) => {
    expect(parseBrowseParams({ genre }, known, "US").genres).toEqual([]);
  });

  it("reads several genres sorted, dropping unknown and duplicate ids", () => {
    const genres = new Set([28, 35, 99]);
    expect(parseBrowseParams({ genre: "35,28,35,99999" }, genres, "US").genres).toEqual([28, 35]);
    expect(parseBrowseParams({ genre: "99,abc,,28" }, genres, "US").genres).toEqual([28, 99]);
    expect(parseBrowseParams({ genre: "1e2,0x1c,28.0" }, genres, "US").genres).toEqual([]);
  });

  it("ignores old seed-era sort keys", () => {
    expect(parseBrowseParams({ sort: "year" }, known, "US").sort).toBe("popularity");
    expect(parseBrowseParams({ sort: "name" }, known, "US").sort).toBe("popularity");
  });

  it("reads type=tv and keeps a genre from the TV list", () => {
    const tvGenres = new Set([10765, 18]);
    expect(parseBrowseParams({ type: "tv", genre: "10765", sort: "release" }, tvGenres, "US")).toEqual({
      kind: "tv",
      genres: [10765],
      sort: "release",
      page: 1,
      region: "US",
      regionFromUrl: false,
    });
  });

  it("drops a genre id from the other kind's list", () => {
    const tvGenres = new Set([10765, 18]);
    // 878 is the movie Science Fiction id; TV uses 10765 (Sci-Fi & Fantasy).
    expect(parseBrowseParams({ type: "tv", genre: "878" }, tvGenres, "US").genres).toEqual([]);
    expect(parseBrowseParams({ genre: "10765" }, known, "US").genres).toEqual([]);
  });

  it("reads links without type, or with an unknown type, as movies", () => {
    expect(parseBrowseParams({ genre: "878" }, known, "US").kind).toBe("movie");
    expect(parseBrowseParams({ type: "series" }, known, "US").kind).toBe("movie");
  });

  it("uses the first value when a param repeats", () => {
    expect(parseBrowseParams({ genre: ["18", "28"], sort: ["title", "rating"], page: ["2", "9"] }, known, "US")).toEqual({
      kind: "movie",
      genres: [18],
      sort: "title",
      page: 2,
      region: "US",
      regionFromUrl: false,
    });
  });
});

describe("parseBrowseParams region", () => {
  it("applies the resolved region and marks it from the URL when ?region= names it", () => {
    expect(parseBrowseParams({ region: "ES" }, known, "ES")).toMatchObject({ region: "ES", regionFromUrl: true });
    expect(parseBrowseParams({ region: ["ES", "GB"] }, known, "ES")).toMatchObject({ region: "ES", regionFromUrl: true });
  });

  it("does not mark a cookie or language default as from the URL", () => {
    expect(parseBrowseParams({}, known, "GB")).toMatchObject({ region: "GB", regionFromUrl: false });
  });

  it("does not mark a ?region= that lost to another rule as from the URL", () => {
    // An unlisted or malformed code falls through, so it must not ride along in links.
    expect(parseBrowseParams({ region: "ZZ" }, known, "GB")).toMatchObject({ region: "GB", regionFromUrl: false });
    expect(parseBrowseParams({ region: "es" }, known, "US")).toMatchObject({ region: "US", regionFromUrl: false });
  });
});

describe("parsePage", () => {
  it.each([
    [undefined, 1],
    ["1", 1],
    ["500", 500],
    ["501", 1],
    ["9999", 1],
    ["0", 1],
    ["-2", 1],
    ["2.5", 1],
    ["abc", 1],
    ["07", 1],
  ])("reads %j as page %i", (value, page) => {
    expect(parsePage(value)).toBe(page);
  });
});

describe("browseHref", () => {
  it("links to the bare home page for the defaults", () => {
    expect(browseHref({ kind: "movie", genres: [], sort: "popularity", page: 1, region: "US", regionFromUrl: false })).toBe("/");
  });

  it("includes the genre, a non-default sort and a page after the first", () => {
    expect(browseHref({ kind: "movie", genres: [878], sort: "title", page: 4, region: "US", regionFromUrl: false })).toBe("/?genre=878&sort=title&page=4");
  });

  it("omits defaults", () => {
    expect(browseHref({ kind: "movie", genres: [18], sort: "popularity", page: 1, region: "US", regionFromUrl: false })).toBe("/?genre=18");
  });

  it("writes several genres ascending and comma-joined", () => {
    expect(browseHref({ kind: "movie", genres: [28, 35], sort: "popularity", page: 1, region: "US", regionFromUrl: false })).toBe("/?genre=28,35");
    expect(browseHref({ kind: "tv", genres: [18, 10765], sort: "rating", page: 2, region: "US", regionFromUrl: false })).toBe("/?type=tv&genre=18,10765&sort=rating&page=2");
  });

  it("round-trips several genres", () => {
    const state = { kind: "movie" as const, genres: [28, 35], sort: "title" as const, page: 2, region: "US", regionFromUrl: false };
    const query = Object.fromEntries(new URLSearchParams(browseHref(state).slice(2)));
    expect(parseBrowseParams(query, new Set([28, 35]), "US")).toEqual(state);
  });

  it("sets type=tv first for TV and leaves it off for movies", () => {
    expect(browseHref({ kind: "tv", genres: [], sort: "popularity", page: 1, region: "US", regionFromUrl: false })).toBe("/?type=tv");
    expect(browseHref({ kind: "tv", genres: [10765], sort: "release", page: 2, region: "US", regionFromUrl: false })).toBe("/?type=tv&genre=10765&sort=release&page=2");
  });

  it("round-trips through parseBrowseParams", () => {
    const state = { kind: "movie" as const, genres: [28], sort: "release" as const, page: 7, region: "US", regionFromUrl: false };
    const query = Object.fromEntries(new URLSearchParams(browseHref(state).slice(2)));
    expect(parseBrowseParams(query, known, "US")).toEqual(state);
  });

  it("round-trips a TV state", () => {
    const state = { kind: "tv" as const, genres: [18], sort: "title" as const, page: 3, region: "US", regionFromUrl: false };
    const query = Object.fromEntries(new URLSearchParams(browseHref(state).slice(2)));
    expect(parseBrowseParams(query, new Set([18]), "US")).toEqual(state);
  });
});

describe("browseHref region", () => {
  const base = { kind: "movie" as const, genres: [28, 35], sort: "rating" as const, page: 2 };

  it("keeps a region that came from the URL", () => {
    expect(browseHref({ ...base, region: "ES", regionFromUrl: true })).toBe("/?genre=28,35&region=ES&sort=rating&page=2");
    expect(browseHref({ kind: "tv", genres: [], sort: "popularity", page: 1, region: "US", regionFromUrl: true })).toBe(
      "/?type=tv&region=US",
    );
  });

  it("leaves out a region from the cookie or browser language", () => {
    expect(browseHref({ ...base, region: "GB", regionFromUrl: false })).toBe("/?genre=28,35&sort=rating&page=2");
  });

  it("round-trips an explicit region", () => {
    const state = { ...base, region: "ES", regionFromUrl: true };
    const query = Object.fromEntries(new URLSearchParams(browseHref(state).slice(2)));
    expect(parseBrowseParams(query, new Set([28, 35]), "ES")).toEqual(state);
  });
});

describe("parseKind", () => {
  it("reads tv and defaults anything else to movie", () => {
    expect(parseKind("tv")).toBe("tv");
    expect(parseKind("movie")).toBe("movie");
    expect(parseKind(undefined)).toBe("movie");
    expect(parseKind("series")).toBe("movie");
    expect(parseKind(["tv", "movie"])).toBe("tv");
  });
});
