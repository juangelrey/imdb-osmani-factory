import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import search from "@/lib/tmdb/fixtures/search-movie.json";
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
});
