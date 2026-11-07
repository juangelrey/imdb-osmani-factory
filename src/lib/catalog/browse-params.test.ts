import { browseHref, parseBrowseParams } from "./browse-params";

describe("parseBrowseParams", () => {
  it("defaults to all genres sorted by rating", () => {
    expect(parseBrowseParams({})).toEqual({ genre: undefined, sort: "rating" });
  });

  it("reads a known genre and sort key", () => {
    expect(parseBrowseParams({ genre: "Drama", sort: "year" })).toEqual({ genre: "Drama", sort: "year" });
  });

  it("ignores an unknown genre and sort key", () => {
    expect(parseBrowseParams({ genre: "Opera", sort: "length" })).toEqual({ genre: undefined, sort: "rating" });
  });

  it("uses the first value when a param repeats", () => {
    expect(parseBrowseParams({ genre: ["Comedy", "Drama"], sort: ["name", "year"] })).toEqual({
      genre: "Comedy",
      sort: "name",
    });
  });
});

describe("browseHref", () => {
  it("links to the bare home page for the defaults", () => {
    expect(browseHref({ genre: undefined, sort: "rating" })).toBe("/");
  });

  it("includes the genre and a non-default sort", () => {
    expect(browseHref({ genre: "Sci-Fi", sort: "name" })).toBe("/?genre=Sci-Fi&sort=name");
  });

  it("omits the default sort", () => {
    expect(browseHref({ genre: "Drama", sort: "rating" })).toBe("/?genre=Drama");
  });
});
