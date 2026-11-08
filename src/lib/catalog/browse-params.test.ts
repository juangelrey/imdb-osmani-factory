import { DEFAULT_SORT, browseHref, parseBrowseParams, parseKind, parsePage } from "./browse-params";

const known = new Set([28, 878, 18]);

describe("parseBrowseParams", () => {
  it("defaults to all genres, popularity and page 1", () => {
    expect(DEFAULT_SORT).toBe("popularity");
    expect(parseBrowseParams({}, known)).toEqual({ genre: undefined, sort: "popularity", page: 1 });
  });

  it("reads a known genre id, sort key and page", () => {
    expect(parseBrowseParams({ genre: "878", sort: "rating", page: "3" }, known)).toEqual({
      genre: 878,
      sort: "rating",
      page: 3,
    });
  });

  it.each(["release", "title", "popularity"])("accepts the %s sort", (sort) => {
    expect(parseBrowseParams({ sort }, known).sort).toBe(sort);
  });

  it.each(["abc", "99999", "-28", "28.5", ""])("falls back to all genres for genre=%j", (genre) => {
    expect(parseBrowseParams({ genre }, known).genre).toBeUndefined();
  });

  it("ignores old seed-era sort keys", () => {
    expect(parseBrowseParams({ sort: "year" }, known).sort).toBe("popularity");
    expect(parseBrowseParams({ sort: "name" }, known).sort).toBe("popularity");
  });

  it("uses the first value when a param repeats", () => {
    expect(parseBrowseParams({ genre: ["18", "28"], sort: ["title", "rating"], page: ["2", "9"] }, known)).toEqual({
      genre: 18,
      sort: "title",
      page: 2,
    });
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
    expect(browseHref({ genre: undefined, sort: "popularity", page: 1 })).toBe("/");
  });

  it("includes the genre, a non-default sort and a page after the first", () => {
    expect(browseHref({ genre: 878, sort: "title", page: 4 })).toBe("/?genre=878&sort=title&page=4");
  });

  it("omits defaults", () => {
    expect(browseHref({ genre: 18, sort: "popularity", page: 1 })).toBe("/?genre=18");
  });

  it("round-trips through parseBrowseParams", () => {
    const state = { genre: 28, sort: "release" as const, page: 7 };
    const query = Object.fromEntries(new URLSearchParams(browseHref(state).slice(2)));
    expect(parseBrowseParams(query, known)).toEqual(state);
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
