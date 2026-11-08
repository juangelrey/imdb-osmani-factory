import { render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import search from "@/lib/tmdb/fixtures/search-movie.json";
import searchTv from "@/lib/tmdb/fixtures/search-tv.json";
import searchPerson from "@/lib/tmdb/fixtures/search-person.json";
import SearchPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

/** The fixtures as the only TMDB page, so a Recency search makes one call and sees each title once. */
const searchOnePage = { ...search, total_pages: 1, total_results: 3 };
const searchTvOnePage = { ...searchTv, total_pages: 1, total_results: 3 };

function stubTmdb(body: unknown = searchOnePage) {
  const fetchMock = vi.fn(async () => Response.json(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof stubTmdb>) {
  return new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
}

function resultHrefs() {
  const grid = screen.getByRole("list", { name: "Titles" });
  return within(grid)
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"));
}

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Search page", () => {
  it("searches TMDB with the q param", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /The Matrix Revolutions/ })).toBeInTheDocument();
    expect(requestedUrl(fetchMock).searchParams.get("query")).toBe("matrix");
  });

  it("lists results by Recency by default, newest first", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix" }) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl(fetchMock).searchParams.get("page")).toBe("1");
    expect(resultHrefs()).toEqual(["/title/605-the-matrix-revolutions", "/title/604-the-matrix-reloaded", "/title/603-the-matrix"]);
  });

  it("keeps TMDB's order and paging with sort=relevance, in one call", async () => {
    const fetchMock = stubTmdb(search);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix", sort: "relevance", page: "3" }) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl(fetchMock).searchParams.get("page")).toBe("3");
    expect(resultHrefs()).toEqual(["/title/603-the-matrix", "/title/604-the-matrix-reloaded", "/title/605-the-matrix-revolutions"]);
  });

  it("reads an invalid sort as Recency", async () => {
    stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix", sort: "bogus" }) }));
    expect(resultHrefs()[0]).toBe("/title/605-the-matrix-revolutions");
    const nav = screen.getByRole("navigation", { name: "Sort results" });
    expect(within(nav).getByRole("link", { name: "Recency" })).toHaveAttribute("aria-current", "true");
  });

  it("clamps an invalid page to 1", async () => {
    const fetchMock = stubTmdb(search);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix", sort: "relevance", page: "x" }) }));
    expect(requestedUrl(fetchMock).searchParams.get("page")).toBe("1");
  });

  it("marks the current sort and links each one keeping q and type, without the page or a default sort", async () => {
    stubTmdb(searchTv);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", sort: "relevance", page: "3" }) }));
    const nav = screen.getByRole("navigation", { name: "Sort results" });
    expect(within(nav).getByRole("link", { name: "Relevance" })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByRole("link", { name: "Recency" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Recency" })).toHaveAttribute("href", "/search?q=breaking&type=tv");
    expect(within(nav).getByRole("link", { name: "Relevance" })).toHaveAttribute(
      "href",
      "/search?q=breaking&type=tv&sort=relevance",
    );
  });

  it("sends a page past the last one back to page 1, keeping the query", async () => {
    stubTmdb({ page: 499, results: [], total_pages: 4, total_results: 72 });
    await expect(SearchPage({ searchParams: Promise.resolve({ q: "the matrix", page: "499" }) })).rejects.toThrow(
      "redirect /search?q=the+matrix",
    );
    expect(redirect).toHaveBeenCalledWith("/search?q=the+matrix");
  });

  it("sends a page past the Recency window back to page 1", async () => {
    stubTmdb(search);
    await expect(SearchPage({ searchParams: Promise.resolve({ q: "the matrix", page: "6" }) })).rejects.toThrow(
      "redirect /search?q=the+matrix",
    );
  });

  it("sends a Relevance page past the last one back to page 1, keeping the sort", async () => {
    stubTmdb({ page: 9, results: [], total_pages: 4, total_results: 72 });
    await expect(
      SearchPage({ searchParams: Promise.resolve({ q: "the matrix", sort: "relevance", page: "9" }) }),
    ).rejects.toThrow("redirect /search?q=the+matrix&sort=relevance");
  });

  it("treats a missing q as blank, does not call TMDB and shows no sort control", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Type a title name in the search box to find it.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("navigation", { name: "Sort results" })).not.toBeInTheDocument();
  });

  it("searches movies by default and marks Movies in the switch", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix" }) }));
    expect(requestedUrl(fetchMock).pathname).toBe("/3/search/movie");
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("aria-current", "page");
  });

  it("searches TV with type=tv, by first air date, and links the cards to TV pages", async () => {
    const fetchMock = stubTmdb(searchTvOnePage);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv" }) }));
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/search/tv");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/tv/1396-breaking-bad");
    // Breaking Point has no first air date, so it comes last.
    expect(resultHrefs()).toEqual(["/tv/34541-breaking-in", "/tv/1396-breaking-bad", "/tv/603-breaking-point"]);
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("aria-current", "page");
  });

  it("switches kind keeping the query and leaving out the default sort", async () => {
    stubTmdb(searchTvOnePage);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv" }) }));
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/search?q=breaking");
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/search?q=breaking&type=tv");
  });

  it("switches kind keeping the query and a non-default sort, resetting the page to 1", async () => {
    stubTmdb(searchTv);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", sort: "relevance", page: "3" }) }));
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/search?q=breaking&sort=relevance");
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/search?q=breaking&type=tv&sort=relevance");
  });

  it("lists results by Rating with sort=rating, highest first", async () => {
    stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix", sort: "rating" }) }));
    expect(resultHrefs()).toEqual(["/title/603-the-matrix", "/title/604-the-matrix-reloaded", "/title/605-the-matrix-revolutions"]);
    const sortNav = screen.getByRole("navigation", { name: "Sort results" });
    expect(within(sortNav).getByRole("link", { name: "Rating" })).toHaveAttribute("aria-current", "true");
  });

  it("keeps sort=rating when switching between Movies and TV", async () => {
    stubTmdb(searchTvOnePage);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", sort: "rating" }) }));
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/search?q=breaking&sort=rating");
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/search?q=breaking&type=tv&sort=rating");
  });

  it("sends a TV page past the last one back to page 1, keeping the query and type", async () => {
    stubTmdb({ page: 99, results: [], total_pages: 6, total_results: 117 });
    await expect(SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", page: "99" }) })).rejects.toThrow(
      "redirect /search?q=breaking&type=tv",
    );
  });

  it("searches people with type=person in one call, linking each card to its person page", async () => {
    const fetchMock = stubTmdb(searchPerson);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "nolan", type: "person" }) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/search/person");
    expect(url.searchParams.get("include_adult")).toBe("false");
    const grid = screen.getByRole("list", { name: "People" });
    const hrefs = within(grid)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    // TMDB's order, with the adult profile left out.
    expect(hrefs).toEqual(["/person/525-christopher-nolan", "/person/527-jonathan-nolan", "/person/3001234-kathleen-nolan"]);
  });

  it("shows no sort control for people, even with a sort in the URL", async () => {
    stubTmdb(searchPerson);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "nolan", type: "person", sort: "rating" }) }));
    expect(screen.queryByRole("navigation", { name: "Sort results" })).not.toBeInTheDocument();
  });

  it("pages people like TV search, one TMDB call per page, keeping type=person", async () => {
    const fetchMock = stubTmdb({ ...searchPerson, page: 2 });
    render(await SearchPage({ searchParams: Promise.resolve({ q: "nolan", type: "person", page: "2" }) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl(fetchMock).searchParams.get("page")).toBe("2");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/search?q=nolan&type=person");
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/search?q=nolan&type=person&page=3");
  });

  it("says so when no people match", async () => {
    stubTmdb({ page: 1, results: [], total_pages: 0, total_results: 0 });
    render(await SearchPage({ searchParams: Promise.resolve({ q: "zzzz", type: "person" }) }));
    expect(screen.getByText("No people match “zzzz”.")).toBeInTheDocument();
  });

  it("shows no people for a page of adult profiles only", async () => {
    stubTmdb({ page: 1, results: [searchPerson.results[2]], total_pages: 1, total_results: 1 });
    render(await SearchPage({ searchParams: Promise.resolve({ q: "adult", type: "person" }) }));
    expect(screen.queryByRole("list", { name: "People" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Adult Profile/ })).not.toBeInTheDocument();
  });

  it("makes no TMDB call for a blank people search", async () => {
    const fetchMock = stubTmdb(searchPerson);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "  ", type: "person" }) }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("list", { name: "People" })).not.toBeInTheDocument();
  });

  it("sends a people page past the last one back to page 1, keeping type=person", async () => {
    stubTmdb({ page: 99, results: [], total_pages: 3, total_results: 52 });
    await expect(SearchPage({ searchParams: Promise.resolve({ q: "nolan", type: "person", page: "99" }) })).rejects.toThrow(
      "redirect /search?q=nolan&type=person",
    );
  });

  it("marks People on the People view and links Movies and TV keeping the query", async () => {
    stubTmdb(searchPerson);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "nolan", type: "person", page: "2" }) }));
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Movies", "TV", "People"]);
    expect(within(nav).getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "People" })).toHaveAttribute("href", "/search?q=nolan&type=person");
    expect(within(nav).getByRole("link", { name: "Movies" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/search?q=nolan");
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/search?q=nolan&type=tv");
  });

  it("links People keeping the query and dropping a non-default sort", async () => {
    stubTmdb(searchTvOnePage);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", sort: "rating" }) }));
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getByRole("link", { name: "People" })).toHaveAttribute("href", "/search?q=breaking&type=person");
    expect(within(nav).getByRole("link", { name: "People" })).not.toHaveAttribute("aria-current");
  });
});
