import { render, screen, within } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { redirect } from "next/navigation";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import discoverTv from "@/lib/tmdb/fixtures/discover-tv.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import genreTvList from "@/lib/tmdb/fixtures/genre-tv-list.json";
import watchProviderRegions from "@/lib/tmdb/fixtures/watch-provider-regions.json";
import watchProvidersMovie from "@/lib/tmdb/fixtures/watch-providers-movie.json";
import watchProvidersTv from "@/lib/tmdb/fixtures/watch-providers-tv.json";
import Home from "./page";

/** A fake TMDB. `bodies` replaces the fixture answered for a path, e.g. `{ "/3/watch/providers/tv": … }`. */
function stubTmdb(discoverBody: unknown = discover, bodies: Record<string, unknown> = {}) {
  const fetchMock = vi.fn(async (input: URL | string) => {
    const { pathname } = new URL(String(input));
    if (pathname in bodies) return Response.json(bodies[pathname]);
    if (pathname === "/3/genre/movie/list") return Response.json(genreList);
    if (pathname === "/3/discover/movie") return Response.json(discoverBody);
    if (pathname === "/3/genre/tv/list") return Response.json(genreTvList);
    if (pathname === "/3/discover/tv") return Response.json(discoverTv);
    if (pathname === "/3/watch/providers/regions") return Response.json(watchProviderRegions);
    if (pathname === "/3/watch/providers/movie") return Response.json(watchProvidersMovie);
    if (pathname === "/3/watch/providers/tv") return Response.json(watchProvidersTv);
    return Response.json({}, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function discoverUrl(fetchMock: ReturnType<typeof stubTmdb>, kind = "movie") {
  const call = fetchMock.mock.calls.find(([input]) => String(input).includes(`/discover/${kind}`));
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

/** What the visitor's request carries: the `reelbase-region` cookie and the `Accept-Language` header. */
const request = vi.hoisted(() => ({ regionCookie: undefined as string | undefined, acceptLanguage: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "reelbase-region" && request.regionCookie !== undefined ? { name, value: request.regionCookie } : undefined,
  })),
  headers: vi.fn(async () => new Headers(request.acceptLanguage === undefined ? {} : { "accept-language": request.acceptLanguage })),
}));

/** The region the visible selector shows as applied. */
function selectedRegion() {
  return (screen.getByRole("combobox", { name: "Region" }) as HTMLSelectElement).value;
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
  request.regionCookie = undefined;
  request.acceptLanguage = undefined;
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

  it("names every selected genre and matches all of them", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ genre: "35,28", sort: "rating", page: "2" });
    expect(screen.getByRole("heading", { level: 1, name: "Action + Comedy titles" })).toBeInTheDocument();
    expect(discoverUrl(fetchMock).searchParams.get("with_genres")).toBe("28,35");
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/?type=tv&sort=rating");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?genre=28,35&sort=rating&page=2");
  });

  it("names several TV genres as series and clears them when switching to movies", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ type: "tv", genre: "18,35" });
    expect(screen.getByRole("heading", { level: 1, name: "Drama + Comedy series" })).toBeInTheDocument();
    expect(discoverUrl(fetchMock, "tv").searchParams.get("with_genres")).toBe("18,35");
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/");
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

  it("shows the Movies / TV switch above the browse controls, with Movies current by default", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ genre: "878", sort: "rating", page: "2" });
    const paths = fetchMock.mock.calls.map(([input]) => new URL(String(input)).pathname);
    expect(paths).toEqual(["/3/genre/movie/list", "/3/watch/providers/regions", "/3/watch/providers/movie", "/3/discover/movie"]);
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "Movies" })).toHaveAttribute("aria-current", "page");
    // Switching kind resets the genre (ids differ per kind) and the page, and keeps the sort.
    expect(within(media).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/?type=tv&sort=rating");
    const genres = screen.getByRole("navigation", { name: "Genre" });
    expect(media.compareDocumentPosition(genres) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("browses TV series with the TV genres in four TMDB calls", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ type: "tv" });
    const paths = fetchMock.mock.calls.map(([input]) => new URL(String(input)).pathname);
    expect(paths).toEqual(["/3/genre/tv/list", "/3/watch/providers/regions", "/3/watch/providers/tv", "/3/discover/tv"]);
    expect(screen.getByRole("heading", { level: 1, name: "All series" })).toBeInTheDocument();
    expect(gridNames()).toEqual(["Breaking Bad", "Stranger Things", "Breaking Point"]);
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/tv/1396-breaking-bad");
    const genres = screen.getByRole("navigation", { name: "Genre" });
    expect(within(genres).getAllByRole("link")).toHaveLength(genreTvList.genres.length + 1);
    expect(within(genres).getByRole("link", { name: "Sci-Fi & Fantasy" })).toHaveAttribute("href", "/?type=tv&genre=10765");
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "TV" })).toHaveAttribute("aria-current", "page");
    expect(within(media).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/");
    // Browse has no People option.
    expect(within(media).getAllByRole("link").map((link) => link.textContent)).toEqual(["Movies", "TV"]);
  });

  it("titles a TV genre as series, sorts by first air date and keeps type in the controls", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ type: "tv", genre: "10765", sort: "release", page: "2" });
    expect(screen.getByRole("heading", { level: 1, name: "Sci-Fi & Fantasy series" })).toBeInTheDocument();
    const params = discoverUrl(fetchMock, "tv").searchParams;
    expect(params.get("with_genres")).toBe("10765");
    expect(params.get("sort_by")).toBe("first_air_date.desc");
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Top rated" })).toHaveAttribute("href", "/?type=tv&genre=10765&sort=rating");
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/?sort=release");
  });

  it("drops a movie genre id on the TV browse", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ type: "tv", genre: "878" });
    expect(screen.getByRole("heading", { level: 1, name: "All series" })).toBeInTheDocument();
    expect(discoverUrl(fetchMock, "tv").searchParams.has("with_genres")).toBe(false);
  });

  it("keeps type in TV pagination links", async () => {
    stubTmdb();
    await renderHome({ type: "tv", genre: "18" });
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?type=tv&genre=18&page=2");
  });

  it("sends a TV page past the last one back to page 1, keeping type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) =>
        new URL(String(input)).pathname === "/3/genre/tv/list"
          ? Response.json(genreTvList)
          : Response.json({ page: 400, results: [], total_pages: 30, total_results: 600 }),
      ),
    );
    await expect(Home({ searchParams: Promise.resolve({ type: "tv", page: "400" }) })).rejects.toThrow("redirect /?type=tv");
  });

  it("says no series match an empty TV genre", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: URL | string) =>
        new URL(String(input)).pathname === "/3/genre/tv/list"
          ? Response.json(genreTvList)
          : Response.json({ page: 1, results: [], total_pages: 0, total_results: 0 }),
      ),
    );
    await renderHome({ type: "tv", genre: "37" });
    expect(screen.getByText("No series match this genre. Try another one, or show all series.")).toBeInTheDocument();
  });
});

describe("Home page region", () => {
  it("lets ?region= beat the cookie and keeps it in links", async () => {
    stubTmdb();
    request.regionCookie = "GB";
    request.acceptLanguage = "de-DE";
    await renderHome({ region: "ES", genre: "28" });
    expect(selectedRegion()).toBe("ES");
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Top rated" })).toHaveAttribute("href", "/?genre=28&region=ES&sort=rating");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?genre=28&region=ES&page=2");
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/?type=tv&region=ES");
  });

  it("uses the cookie when the URL has no region, and keeps it out of links", async () => {
    stubTmdb();
    request.regionCookie = "GB";
    request.acceptLanguage = "es-ES";
    await renderHome({ genre: "28" });
    expect(selectedRegion()).toBe("GB");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?genre=28&page=2");
  });

  it("falls back to the browser language's country", async () => {
    stubTmdb();
    request.acceptLanguage = "es-ES,es;q=0.9,en;q=0.8";
    await renderHome();
    expect(selectedRegion()).toBe("ES");
  });

  it("uses US when nothing names a region", async () => {
    stubTmdb();
    await renderHome();
    expect(selectedRegion()).toBe("US");
  });

  it("skips an unlisted code wherever it comes from", async () => {
    stubTmdb();
    request.regionCookie = "GB";
    await renderHome({ region: "ZZ", genre: "28" });
    expect(selectedRegion()).toBe("GB");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?genre=28&page=2");
  });

  it("skips an unlisted cookie and language country", async () => {
    stubTmdb();
    request.regionCookie = "XX";
    request.acceptLanguage = "en-QQ, es-ES";
    await renderHome({ region: "zz" });
    expect(selectedRegion()).toBe("ES");
  });

  it.each([
    [{ genre: "28,35", sort: "rating", page: "2" }, [["genre", "28,35"], ["sort", "rating"]]],
    [{ type: "tv", genre: "18", region: "GB" }, [["type", "tv"], ["genre", "18"]]],
  ])("shows the region selector on %o, carrying the browse params to /region", async (params, carried) => {
    stubTmdb();
    await renderHome(params);
    const form = screen.getByRole("form", { name: "Region" });
    expect(form).toHaveAttribute("action", "/region");
    const options = within(form).getAllByRole("option").map((option) => option.textContent);
    expect(options).toEqual([...options].sort((a, b) => a!.localeCompare(b!, "en")));
    expect(options).toHaveLength(watchProviderRegions.results.length);
    const hidden = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(({ name, value }) => [name, value]);
    expect(hidden).toEqual(carried);
    expect(within(form).getByRole("button", { name: "Apply" })).toBeInTheDocument();
  });

  it("is read only by the home page, so other pages keep their caching", () => {
    // Vitest runs from the project root.
    const appDir = join(process.cwd(), "src/app");
    const others = (readdirSync(appDir, { recursive: true }) as string[]).filter(
      (file) => /(^|[\\/])(page|layout|template)\.tsx?$/.test(file) && file !== "page.tsx",
    );
    expect(others.length).toBeGreaterThan(0);
    const readers = others.filter((file) => /next\/headers|reelbase-region|REGION_COOKIE/.test(readFileSync(join(appDir, file), "utf8")));
    expect(readers).toEqual([]);
    expect(readFileSync(join(appDir, "page.tsx"), "utf8")).toContain("next/headers");
  });
});

describe("Home page streaming services", () => {
  function pathsCalled(fetchMock: ReturnType<typeof stubTmdb>) {
    return fetchMock.mock.calls.map(([input]) => new URL(String(input)).pathname);
  }

  it("filters by the selected services in four TMDB calls, dropping ids the region's top 12 does not list", async () => {
    const fetchMock = stubTmdb();
    // 149 (Movistar Plus+) streams in Spain, not among the US top 12; 99999 is no provider at all.
    await renderHome({ providers: "337,8,149,99999,8" });
    expect(pathsCalled(fetchMock)).toEqual([
      "/3/genre/movie/list",
      "/3/watch/providers/regions",
      "/3/watch/providers/movie",
      "/3/discover/movie",
    ]);
    expect(new URL(String(fetchMock.mock.calls[2][0])).searchParams.get("watch_region")).toBe("US");
    const params = discoverUrl(fetchMock).searchParams;
    expect(params.get("with_watch_providers")).toBe("8|337");
    expect(params.get("watch_region")).toBe("US");
    expect(params.get("with_watch_monetization_types")).toBe("flatrate|free|ads");
    const pagination = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(pagination).getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?providers=8,337&page=2");
  });

  it("asks for the TV providers of the resolved region on TV browse", async () => {
    const fetchMock = stubTmdb();
    request.regionCookie = "ES";
    await renderHome({ type: "tv", providers: "149" });
    const providersUrl = new URL(String(fetchMock.mock.calls[2][0]));
    expect(providersUrl.pathname).toBe("/3/watch/providers/tv");
    expect(providersUrl.searchParams.get("watch_region")).toBe("ES");
    expect(discoverUrl(fetchMock, "tv").searchParams.get("with_watch_providers")).toBe("149");
  });

  it("sends no provider params when no service is selected", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ genre: "28" });
    const params = discoverUrl(fetchMock).searchParams;
    for (const name of ["with_watch_providers", "watch_region", "with_watch_monetization_types"]) expect(params.has(name)).toBe(false);
  });

  it("keeps only the services the new region lists after a region change", async () => {
    const fetchMock = stubTmdb();
    // Hulu (15) is in the US top 12 but not Spain's.
    await renderHome({ providers: "8,15,337", region: "ES" });
    const params = discoverUrl(fetchMock).searchParams;
    expect(params.get("with_watch_providers")).toBe("8|337");
    expect(params.get("watch_region")).toBe("ES");
  });

  it("carries every selected service through the region form and the Movies / TV switch", async () => {
    stubTmdb();
    await renderHome({ genre: "28", providers: "8,15", sort: "rating", page: "2" });
    const form = screen.getByRole("form", { name: "Region" });
    const hidden = Array.from(form.querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(({ name, value }) => [name, value]);
    expect(hidden).toEqual([
      ["genre", "28"],
      ["providers", "8,15"],
      ["sort", "rating"],
    ]);
    // The genres differ per kind and are cleared; the services are kept for the TV page to check.
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "TV" })).toHaveAttribute("href", "/?type=tv&providers=8,15&sort=rating");
  });

  it("keeps only the services the other kind's top 12 lists after switching kind", async () => {
    // A TV list where only Netflix streams in the US.
    const netflixOnly = { results: watchProvidersTv.results.filter(({ provider_id }) => provider_id === 8) };
    const fetchMock = stubTmdb(discover, { "/3/watch/providers/tv": netflixOnly });
    await renderHome({ type: "tv", providers: "8,15", sort: "rating" });
    expect(discoverUrl(fetchMock, "tv").searchParams.get("with_watch_providers")).toBe("8");
    const media = screen.getByRole("navigation", { name: "Movies or TV" });
    expect(within(media).getByRole("link", { name: "Movies" })).toHaveAttribute("href", "/?providers=8&sort=rating");
  });

  it("combines services with genres and sort, and any change returns to page 1", async () => {
    const fetchMock = stubTmdb();
    await renderHome({ genre: "28,35", providers: "8,9", sort: "rating", page: "3" });
    const params = discoverUrl(fetchMock).searchParams;
    expect(params.get("with_genres")).toBe("28,35");
    expect(params.get("with_watch_providers")).toBe("8|9");
    expect(params.get("sort_by")).toBe("vote_average.desc");
    const sort = screen.getByRole("navigation", { name: "Sort" });
    expect(within(sort).getByRole("link", { name: "Title" })).toHaveAttribute("href", "/?genre=28,35&providers=8,9&sort=title");
    const genres = screen.getByRole("navigation", { name: "Genre" });
    expect(within(genres).getByRole("link", { name: "Comedy" })).toHaveAttribute("href", "/?genre=28&providers=8,9&sort=rating");
    expect(within(genres).getByRole("link", { name: "All" })).toHaveAttribute("href", "/?providers=8,9&sort=rating");
  });

  it("sends a page past the last one back to page 1, keeping the services", async () => {
    stubTmdb({ page: 400, results: [], total_pages: 30, total_results: 600 });
    await expect(Home({ searchParams: Promise.resolve({ providers: "8", page: "400" }) })).rejects.toThrow("redirect /?providers=8");
  });
});
