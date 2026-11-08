import searchPerson from "@/lib/tmdb/fixtures/search-person.json";
import type { TmdbPaged, TmdbPersonListItem } from "@/lib/tmdb/schema";
import { MAX_PAGES, toPersonSearchPage } from "./map";

const nolanPage = searchPerson as TmdbPaged<TmdbPersonListItem>;

describe("toPersonSearchPage", () => {
  it("keeps TMDB's order and paging, mapping each person to a card", () => {
    const page = toPersonSearchPage(nolanPage);
    expect(page).toMatchObject({ page: 1, totalPages: 3, totalResults: 52 });
    expect(page.results[0]).toEqual({
      id: 525,
      slug: "christopher-nolan",
      name: "Christopher Nolan",
      knownFor: "Directing",
      profileUrl: "https://image.tmdb.org/t/p/w185/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
    });
    expect(page.results.map(({ name }) => name)).toEqual(["Christopher Nolan", "Jonathan Nolan", "Kathleen Nolan"]);
  });

  it("skips people TMDB flags adult", () => {
    const page = toPersonSearchPage(nolanPage);
    expect(page.results.map(({ id }) => id)).not.toContain(990002);
  });

  it("leaves out a missing photo and a blank department", () => {
    const kathleen = toPersonSearchPage(nolanPage).results.find(({ id }) => id === 3001234);
    expect(kathleen).toEqual({ id: 3001234, slug: "kathleen-nolan", name: "Kathleen Nolan" });
  });

  it("slugs a name with nothing Latin as person", () => {
    const page = toPersonSearchPage({
      page: 1,
      results: [{ id: 1, name: "宮崎駿", adult: false, known_for_department: null, profile_path: null }],
      total_pages: 1,
      total_results: 1,
    });
    expect(page.results[0].slug).toBe("person");
  });

  it("caps the page count at TMDB's limit", () => {
    expect(toPersonSearchPage({ ...nolanPage, total_pages: 900 }).totalPages).toBe(MAX_PAGES);
  });
});
