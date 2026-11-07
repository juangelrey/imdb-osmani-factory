import {
  filterByGenre,
  getTitleBySlug,
  listGenres,
  listTitles,
  searchTitles,
  sortTitles,
} from "./queries";
import type { Title } from "./types";

function makeTitle(overrides: Partial<Title> & Pick<Title, "slug" | "name">): Title {
  return {
    year: 2000,
    runtime: 100,
    genres: ["Drama"],
    rating: 5,
    synopsis: "A synopsis.",
    director: "Ada Vell",
    cast: ["Bo Lenn"],
    ...overrides,
  };
}

const glass = makeTitle({ slug: "glass-harbor", name: "Glass Harbor", year: 2011, rating: 7.4, genres: ["Drama", "Mystery"] });
const ember = makeTitle({ slug: "ember-road", name: "Ember Road", year: 2019, rating: 8.1, genres: ["Action"] });
const quiet = makeTitle({ slug: "the-quiet-orbit", name: "The Quiet Orbit", year: 2004, rating: 7.4, genres: ["Sci-Fi", "Drama"] });
const sample = [glass, ember, quiet];

describe("listTitles", () => {
  it("returns every seed title", () => {
    const titles = listTitles();
    expect(titles.length).toBeGreaterThanOrEqual(45);
  });

  it("returns a copy so callers cannot mutate the catalogue", () => {
    const first = listTitles();
    first.pop();
    expect(listTitles()).toHaveLength(first.length + 1);
  });
});

describe("getTitleBySlug", () => {
  it("returns the title with that slug", () => {
    expect(getTitleBySlug(sample, "ember-road")).toBe(ember);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getTitleBySlug(sample, "nope")).toBeUndefined();
  });
});

describe("filterByGenre", () => {
  it("keeps only titles that include the genre", () => {
    expect(filterByGenre(sample, "Drama")).toEqual([glass, quiet]);
  });

  it("returns an empty list when no title has the genre", () => {
    expect(filterByGenre(sample, "Western")).toEqual([]);
  });

  it("returns all titles when no genre is given", () => {
    expect(filterByGenre(sample, undefined)).toEqual(sample);
  });
});

describe("sortTitles", () => {
  it("sorts by rating, highest first, breaking ties by name", () => {
    expect(sortTitles(sample, "rating").map((t) => t.slug)).toEqual([
      "ember-road",
      "glass-harbor",
      "the-quiet-orbit",
    ]);
  });

  it("sorts by year, newest first", () => {
    expect(sortTitles(sample, "year").map((t) => t.year)).toEqual([2019, 2011, 2004]);
  });

  it("sorts by name alphabetically, ignoring case", () => {
    const lower = makeTitle({ slug: "apex", name: "apex" });
    expect(sortTitles([...sample, lower], "name").map((t) => t.name)).toEqual([
      "apex",
      "Ember Road",
      "Glass Harbor",
      "The Quiet Orbit",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [...sample];
    sortTitles(input, "year");
    expect(input).toEqual(sample);
  });
});

describe("searchTitles", () => {
  it("matches title names case-insensitively", () => {
    expect(searchTitles(sample, "HARBOR")).toEqual([glass]);
  });

  it("matches part of a name", () => {
    expect(searchTitles(sample, "orb")).toEqual([quiet]);
  });

  it("ignores surrounding whitespace", () => {
    expect(searchTitles(sample, "  ember  ")).toEqual([ember]);
  });

  it("returns nothing for a blank query", () => {
    expect(searchTitles(sample, "   ")).toEqual([]);
  });

  it("does not match synopsis, cast or director", () => {
    expect(searchTitles(sample, "Ada Vell")).toEqual([]);
    expect(searchTitles(sample, "synopsis")).toEqual([]);
  });
});

describe("listGenres", () => {
  it("returns each genre used once, sorted alphabetically", () => {
    expect(listGenres(sample)).toEqual(["Action", "Drama", "Mystery", "Sci-Fi"]);
  });
});
