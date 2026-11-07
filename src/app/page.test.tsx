import { render, screen, within } from "@testing-library/react";
import { redirect } from "next/navigation";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import Home from "./page";

function stubTmdb(discoverBody: unknown = discover) {
  const fetchMock = vi.fn(async (input: URL | string) => {
    const { pathname } = new URL(String(input));
    if (pathname === "/3/genre/movie/list") return Response.json(genreList);
    if (pathname === "/3/discover/movie") return Response.json(discoverBody);
    return Response.json({}, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function discoverUrl(fetchMock: ReturnType<typeof stubTmdb>) {
  const call = fetchMock.mock.calls.find(([input]) => String(input).includes("/discover/movie"));
  return new URL(String(call![0]));
}

async function renderHome(params: Record<string, string> = {}) {
  render(await Home({ searchParams: Promise.resolve(params) }));
}

function gridNames() {
  const grid = screen.getByRole("list", { name: "Titles" });
  return within(grid)
    .getAllByRole("listitem")
    .map((item) => within(item).getByRole("heading").textContent);
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Home page", () => {
  it("lists popular TMDB movies by default", async () => {
    const fetchMock = stubTmdb();
    await renderHome();
    expect(screen.getByRole("heading", { level: 1, name: "All titles" })).toBeInTheDocument();
    expect(gridNames()).toEqual(["Inception", "The Matrix", "Fight Club", "Untitled Short"]);
    expect(discoverUrl(fetchMock).searchParams.get("sort_by")).toBe("popularity.desc");
    expect(screen.getByRole("link", { name: /The Matrix/ })).toHaveAttribute("href", "/title/603-the-matrix");
  });

  it("lists TMDB genres and marks the active genre and sort", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ genre: "878", sort: "title" });
    expect(screen.getByRole("heading", { level: 1, name: "Science Fiction titles" })).toBeInTheDocument();
    expect(discoverUrl(fetchMock).searchParams.get("with_genres")).toBe("878");
    const genres = screen.getByRole("navigation", { name: "Genre" });
    expect(within(genres).getAllByRole("link")).toHaveLength(genreList.genres.length + 1);
    expect(within(genres).getByRole("link", { name: "Science Fiction" })).toHaveAttribute("aria-current", "true");
    expect(within(genres).getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Title" })).toHaveAttribute("aria-current", "true");
  });

  it("keeps the genre and resets the page when changing the sort", async () => {
    stubTmdb();
    await renderHome({ genre: "18", page: "4" });
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Top rated" })).toHaveAttribute("href", "/?genre=18&sort=rating");
  });

  it("falls back to all genres for an unknown genre id", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ genre: "abc" });
    expect(screen.getByRole("heading", { level: 1, name: "All titles" })).toBeInTheDocument();
    expect(discoverUrl(fetchMock).searchParams.has("with_genres")).toBe(false);
  });

  it("paginates, keeping genre and sort, and clamps invalid pages to 1", async () => {
    const fetchMock = stubTmdb({ ...discover, page: 2 });
    await renderHome({ genre: "28", sort: "rating", page: "2" });
    expect(discoverUrl(fetchMock).searchParams.get("page")).toBe("2");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(pagination).toHaveTextContent("Page 2 of 500");
    expect(within(pagination).getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/?genre=28&sort=rating");
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?genre=28&sort=rating&page=3");
  });

  it("requests page 1 for an out-of-range page", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ page: "9999" });
    expect(discoverUrl(fetchMock).searchParams.get("page")).toBe("1");
  });

  it("sends a page past the last one back to page 1, keeping genre and sort", async () => {
    stubTmdb({ page: 400, results: [], total_pages: 30, total_results: 600 });
    await expect(Home({ searchParams: Promise.resolve({ genre: "28", sort: "title", page: "400" }) })).rejects.toThrow(
      "redirect /?genre=28&sort=title",
    );
    expect(redirect).toHaveBeenCalledWith("/?genre=28&sort=title");
  });

  it("says so when nothing matches", async () => {
    stubTmdb({ page: 1, results: [], total_pages: 0, total_results: 0 });
    await renderHome({ genre: "37" });
    expect(screen.getByText("No titles match this genre. Try another one, or show all titles.")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });
});
