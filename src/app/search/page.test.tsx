import { render, screen } from "@testing-library/react";
import search from "@/lib/tmdb/fixtures/search-movie.json";
import SearchPage from "./page";

function stubTmdb() {
  const fetchMock = vi.fn(async () => Response.json(search));
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

  it("treats a missing q as blank and does not call TMDB", async () => {
    const fetchMock = stubTmdb();
    render(await SearchPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Type a title name in the search box to find it.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
