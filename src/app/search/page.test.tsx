import { render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import search from "@/lib/tmdb/fixtures/search-movie.json";
import searchTv from "@/lib/tmdb/fixtures/search-tv.json";
import SearchPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

function stubTmdb(body: unknown = search) {
  const fetchMock = vi.fn(async () => Response.json(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof stubTmdb>) {
  return new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
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

  it("passes a valid page and clamps an invalid one to 1", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix", page: "3" }) }));
    expect(requestedUrl(fetchMock).searchParams.get("page")).toBe("3");
    fetchMock.mockClear();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix", page: "x" }) }));
    expect(requestedUrl(fetchMock).searchParams.get("page")).toBe("1");
  });

  it("sends a page past the last one back to page 1, keeping the query", async () => {
    stubTmdb({ page: 499, results: [], total_pages: 4, total_results: 72 });
    await expect(SearchPage({ searchParams: Promise.resolve({ q: "the matrix", page: "499" }) })).rejects.toThrow(
      "redirect /search?q=the+matrix",
    );
    expect(redirect).toHaveBeenCalledWith("/search?q=the+matrix");
  });

  it("treats a missing q as blank and does not call TMDB", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Type a title name in the search box to find it.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searches movies by default and marks Movies in the switch", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({ q: "matrix" }) }));
    expect(requestedUrl(fetchMock).pathname).toBe("/3/search/movie");
    const nav = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("aria-current", "page");
  });

  it("searches TV with type=tv and links the cards to TV pages", async () => {
    const fetchMock = stubTmdb(searchTv);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv" }) }));
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/search/tv");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/tv/1396-breaking-bad");
    const nav = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("aria-current", "page");
  });

  it("switches kind keeping the query and resetting the page to 1", async () => {
    stubTmdb(searchTv);
    render(await SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", page: "3" }) }));
    const nav = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(nav).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/search?q=breaking");
    expect(within(nav).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/search?q=breaking&type=tv");
  });

  it("sends a TV page past the last one back to page 1, keeping the query and type", async () => {
    stubTmdb({ page: 99, results: [], total_pages: 6, total_results: 117 });
    await expect(SearchPage({ searchParams: Promise.resolve({ q: "breaking", type: "tv", page: "99" }) })).rejects.toThrow(
      "redirect /search?q=breaking&type=tv",
    );
  });
});
