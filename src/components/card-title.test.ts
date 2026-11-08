import { cardFromEntry, cardFromSummary } from "./card-title";

describe("cardFromSummary", () => {
  it("links to the canonical TMDB title URL and keeps the poster", () => {
    expect(
      cardFromSummary({ kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.2, posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg" }),
    ).toEqual({
      key: "movie-603",
      colorKey: "603",
      transitionName: "poster-movie-603",
      href: "/title/603-the-matrix",
      name: "The Matrix",
      year: 1999,
      rating: 8.2,
      posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg",
    });
  });

  it("links a show to its TV page and keys it by kind, apart from a movie with the same id", () => {
    const show = cardFromSummary({ kind: "tv", id: 603, slug: "breaking-point", name: "Breaking Point" });
    const movie = cardFromSummary({ kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix" });
    expect(show.href).toBe("/tv/603-breaking-point");
    expect(show.key).toBe("tv-603");
    expect(show.key).not.toBe(movie.key);
    expect(show.transitionName).not.toBe(movie.transitionName);
  });

  it("seeds a movie's fallback poster colours by id alone, as before TV, and a show's by kind and id", () => {
    expect(cardFromSummary({ kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix" }).colorKey).toBe("603");
    expect(cardFromSummary({ kind: "tv", id: 603, slug: "breaking-point", name: "Breaking Point" }).colorKey).toBe("tv-603");
  });
});

describe("cardFromEntry", () => {
  it("builds the grid poster from the saved poster path", () => {
    expect(cardFromEntry({ kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", rating: 8.2, posterPath: "/m.jpg" })).toEqual({
      key: "movie-603",
      colorKey: "603",
      transitionName: "poster-movie-603",
      href: "/title/603-the-matrix",
      name: "The Matrix",
      year: undefined,
      rating: 8.2,
      posterUrl: "https://image.tmdb.org/t/p/w342/m.jpg",
    });
  });

  it("links a saved show to its TV page, keyed apart from a movie with the same id", () => {
    expect(cardFromEntry({ kind: "tv", id: 603, slug: "matrix-show", name: "Matrix Show", posterPath: "/s.jpg" })).toEqual({
      key: "tv-603",
      colorKey: "tv-603",
      transitionName: "poster-tv-603",
      href: "/tv/603-matrix-show",
      name: "Matrix Show",
      year: undefined,
      rating: undefined,
      posterUrl: "https://image.tmdb.org/t/p/w342/s.jpg",
    });
  });
});
