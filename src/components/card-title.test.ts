import { cardFromEntry, cardFromSummary } from "./card-title";

describe("cardFromSummary", () => {
  it("links to the canonical TMDB title URL and keeps the poster", () => {
    expect(
      cardFromSummary({ kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.2, posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg" }),
    ).toEqual({
      key: "603",
      href: "/title/603-the-matrix",
      name: "The Matrix",
      year: 1999,
      rating: 8.2,
      posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg",
    });
  });
});

describe("cardFromEntry", () => {
  it("builds the grid poster from the saved poster path", () => {
    expect(cardFromEntry({ id: 603, slug: "the-matrix", name: "The Matrix", rating: 8.2, posterPath: "/m.jpg" })).toEqual({
      key: "603",
      href: "/title/603-the-matrix",
      name: "The Matrix",
      year: undefined,
      rating: 8.2,
      posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg",
    });
  });
});
