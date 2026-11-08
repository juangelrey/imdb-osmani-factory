import details from "@/lib/tmdb/fixtures/movie-details.json";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import discoverTv from "@/lib/tmdb/fixtures/discover-tv.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import genreTvList from "@/lib/tmdb/fixtures/genre-tv-list.json";
import search from "@/lib/tmdb/fixtures/search-movie.json";
import searchTv from "@/lib/tmdb/fixtures/search-tv.json";
import person from "@/lib/tmdb/fixtures/person-details.json";
import tvDetails from "@/lib/tmdb/fixtures/tv-details.json";
import tvSeason from "@/lib/tmdb/fixtures/tv-season.json";
import { TmdbError } from "@/lib/tmdb/client";
import { discoverShows, discoverTitles, getPerson, getShow, getTitle, listGenres, searchShows, searchTitles } from "./queries";

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: { mock: { calls: unknown[][] } }) {
  return new URL(String(fetchMock.mock.calls[0][0]));
}

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getTitle", () => {
  it("fetches the movie with credits and recommendations appended, in one request", async () => {
    const fetchMock = stubFetch(details);
    await getTitle(603);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/movie/603");
    expect(url.searchParams.get("append_to_response")).toBe("credits,recommendations");
  });

  it("maps the appended recommendations, dropping adult titles", async () => {
    stubFetch(details);
    const title = await getTitle(603);
    expect(title?.recommendations).toHaveLength(12);
    expect(title?.recommendations.map(({ id }) => id)).not.toContain(990001);
  });

  it("maps the response into a Title", async () => {
    stubFetch(details);
    const title = await getTitle(603);
    expect(title).toMatchObject({ id: 603, slug: "the-matrix", name: "The Matrix" });
    expect(title?.directors.map(({ name }) => name)).toEqual(["Lana Wachowski", "Lilly Wachowski"]);
  });

  it("returns undefined for an unknown id", async () => {
    stubFetch({ success: false, status_code: 34 }, 404);
    await expect(getTitle(999999999)).resolves.toBeUndefined();
  });

  it("lets other TMDB errors reach the error boundary", async () => {
    stubFetch({}, 503);
    await expect(getTitle(603)).rejects.toBeInstanceOf(TmdbError);
  });
});

/** A fetch stub answering each TMDB path from `bodies`, and 404 for any other path. */
function stubTmdbPaths(bodies: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const body = bodies[new URL(String(input)).pathname];
    return body === undefined ? Response.json({ success: false }, { status: 404 }) : Response.json(body);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrls(fetchMock: { mock: { calls: unknown[][] } }) {
  return fetchMock.mock.calls.map((call) => new URL(String(call[0])));
}

describe("getShow", () => {
  it("makes exactly one request for the show with credits and season 1 appended, in English", async () => {
    const fetchMock = stubFetch({ ...tvDetails, "season/1": tvSeason });
    const show = await getShow(1396);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/tv/1396");
    expect(url.searchParams.get("append_to_response")).toBe("credits,season/1");
    expect(url.searchParams.get("language")).toBe("en-US");
    expect(show?.season).toMatchObject({ number: 1, name: "Season 1" });
  });

  it("appends the requested season to the same request", async () => {
    const seasonTwo = { ...tvSeason, season_number: 2, name: "Season 2" };
    const fetchMock = stubFetch({ ...tvDetails, "season/2": seasonTwo });
    const show = await getShow(1396, 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl(fetchMock).searchParams.get("append_to_response")).toBe("credits,season/2");
    expect(show?.season?.number).toBe(2);
  });

  it("makes one more request, for the default season, only when the requested season is missing", async () => {
    const fetchMock = stubTmdbPaths({ "/3/tv/1396": tvDetails, "/3/tv/1396/season/1": tvSeason });
    const show = await getShow(1396, 99);
    const urls = requestedUrls(fetchMock);
    expect(urls.map(({ pathname }) => pathname)).toEqual(["/3/tv/1396", "/3/tv/1396/season/1"]);
    expect(urls[0].searchParams.get("append_to_response")).toBe("credits,season/99");
    expect(show?.season?.number).toBe(1);
  });

  it("falls back to the first listed season when there is no season 1", async () => {
    const noSeasonOne = {
      ...tvDetails,
      seasons: [
        { season_number: 0, name: "Specials", episode_count: 1 },
        { season_number: 2, name: "Season 2", episode_count: 8 },
      ],
    };
    const fetchMock = stubTmdbPaths({ "/3/tv/1396": noSeasonOne, "/3/tv/1396/season/2": { ...tvSeason, season_number: 2 } });
    const show = await getShow(1396);
    expect(requestedUrls(fetchMock).map(({ pathname }) => pathname)).toEqual(["/3/tv/1396", "/3/tv/1396/season/2"]);
    expect(show?.season?.number).toBe(2);
  });

  it("makes no second request when the show lists no seasons", async () => {
    const fetchMock = stubFetch({ ...tvDetails, seasons: [] });
    const show = await getShow(1396);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(show?.season).toBeUndefined();
  });

  it("makes no second request for a show it will not show", async () => {
    const fetchMock = stubFetch({ ...tvDetails, adult: true });
    await getShow(1396, 99);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lets a failing season request reach the error boundary", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => (calls++ === 0 ? Response.json(tvDetails) : Response.json({}, { status: 503 }))),
    );
    await expect(getShow(1396, 99)).rejects.toBeInstanceOf(TmdbError);
  });

  it("maps the response into a Show", async () => {
    stubFetch(tvDetails);
    await expect(getShow(1396)).resolves.toMatchObject({ id: 1396, slug: "breaking-bad", years: "2008–2013" });
  });

  it("returns undefined for an unknown id", async () => {
    stubFetch({ success: false, status_code: 34 }, 404);
    await expect(getShow(999999999)).resolves.toBeUndefined();
  });

  it.each([{ adult: true }, { softcore: true }])("returns undefined for a show flagged %o", async (flag) => {
    stubFetch({ ...tvDetails, ...flag });
    await expect(getShow(1396)).resolves.toBeUndefined();
  });

  it("lets other TMDB errors reach the error boundary", async () => {
    stubFetch({}, 503);
    await expect(getShow(1396)).rejects.toBeInstanceOf(TmdbError);
  });
});

describe("getPerson", () => {
  it("makes one request for the person with combined (movie and TV) credits appended, in English", async () => {
    const fetchMock = stubFetch(person);
    await getPerson(190, "2026-11-07");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/person/190");
    expect(url.searchParams.get("append_to_response")).toBe("combined_credits");
    expect(url.searchParams.get("language")).toBe("en-US");
  });

  it("maps the response into a Person", async () => {
    stubFetch(person);
    await expect(getPerson(190, "2026-11-07")).resolves.toMatchObject({
      id: 190,
      slug: "clint-eastwood",
      name: "Clint Eastwood",
      career: expect.arrayContaining([expect.objectContaining({ label: "2024" })]),
    });
  });

  it("returns undefined for an unknown id", async () => {
    stubFetch({ success: false, status_code: 34 }, 404);
    await expect(getPerson(999999999, "2026-11-07")).resolves.toBeUndefined();
  });

  it("returns undefined for a person TMDB flags adult", async () => {
    stubFetch({ ...person, adult: true });
    await expect(getPerson(190, "2026-11-07")).resolves.toBeUndefined();
  });

  it("lets other TMDB errors reach the error boundary", async () => {
    stubFetch({}, 503);
    await expect(getPerson(190, "2026-11-07")).rejects.toBeInstanceOf(TmdbError);
  });
});

describe("listGenres", () => {
  it("returns TMDB's movie genres", async () => {
    const fetchMock = stubFetch(genreList);
    const genres = await listGenres();
    expect(requestedUrl(fetchMock).pathname).toBe("/3/genre/movie/list");
    expect(genres).toContainEqual({ id: 878, name: "Science Fiction" });
  });

  it("returns TMDB's TV genres for the tv kind", async () => {
    const fetchMock = stubFetch(genreTvList);
    const genres = await listGenres("tv");
    expect(requestedUrl(fetchMock).pathname).toBe("/3/genre/tv/list");
    expect(genres).toContainEqual({ id: 10765, name: "Sci-Fi & Fantasy" });
  });
});

describe("discoverTitles", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for a page of non-adult movies and maps the results", async () => {
    const fetchMock = stubFetch(discover);
    const page = await discoverTitles({ kind: "movie", genre: undefined, sort: "popularity", page: 3 });
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/discover/movie");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.has("with_genres")).toBe(false);
    expect(page.results[0]).toMatchObject({ id: 27205, name: "Inception" });
    expect(page.totalPages).toBe(500);
  });

  it("filters by genre", async () => {
    const fetchMock = stubFetch(discover);
    await discoverTitles({ kind: "movie", genre: 878, sort: "popularity", page: 1 });
    expect(requestedUrl(fetchMock).searchParams.get("with_genres")).toBe("878");
  });

  it.each([
    ["popularity", { sort_by: "popularity.desc" }],
    ["rating", { sort_by: "vote_average.desc", "vote_count.gte": "200" }],
    ["title", { sort_by: "title.asc" }],
  ] as const)("maps the %s sort", async (sort, expected) => {
    const fetchMock = stubFetch(discover);
    await discoverTitles({ kind: "movie", genre: undefined, sort, page: 1 });
    const params = requestedUrl(fetchMock).searchParams;
    for (const [key, value] of Object.entries(expected)) expect(params.get(key)).toBe(value);
    expect(params.has("primary_release_date.lte")).toBe(false);
    if (sort !== "rating") expect(params.has("vote_count.gte")).toBe(false);
  });

  it("limits the release sort to films out by today with at least 50 votes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00Z"));
    const fetchMock = stubFetch(discover);
    await discoverTitles({ kind: "movie", genre: undefined, sort: "release", page: 1 });
    const params = requestedUrl(fetchMock).searchParams;
    expect(params.get("sort_by")).toBe("primary_release_date.desc");
    expect(params.get("primary_release_date.lte")).toBe("2026-11-07");
    expect(params.get("vote_count.gte")).toBe("50");
  });
});

describe("discoverShows", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for a page of non-adult series and maps the results to shows", async () => {
    const fetchMock = stubFetch(discoverTv);
    const page = await discoverShows({ kind: "tv", genre: undefined, sort: "popularity", page: 3 });
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/discover/tv");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("sort_by")).toBe("popularity.desc");
    expect(url.searchParams.has("with_genres")).toBe(false);
    expect(page.results[0]).toMatchObject({ kind: "tv", id: 1396, slug: "breaking-bad", name: "Breaking Bad", year: 2008 });
    expect(page.totalPages).toBe(500);
  });

  it("filters by a TV genre", async () => {
    const fetchMock = stubFetch(discoverTv);
    await discoverShows({ kind: "tv", genre: 10765, sort: "popularity", page: 1 });
    expect(requestedUrl(fetchMock).searchParams.get("with_genres")).toBe("10765");
  });

  it.each([
    ["rating", { sort_by: "vote_average.desc", "vote_count.gte": "200" }],
    ["title", { sort_by: "name.asc" }],
  ] as const)("maps the %s sort to TV params", async (sort, expected) => {
    const fetchMock = stubFetch(discoverTv);
    await discoverShows({ kind: "tv", genre: undefined, sort, page: 1 });
    const params = requestedUrl(fetchMock).searchParams;
    for (const [key, value] of Object.entries(expected)) expect(params.get(key)).toBe(value);
    expect(params.has("first_air_date.lte")).toBe(false);
    expect(params.has("primary_release_date.lte")).toBe(false);
  });

  it("maps the release sort to first_air_date, limited to series aired by today with at least 50 votes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00Z"));
    const fetchMock = stubFetch(discoverTv);
    await discoverShows({ kind: "tv", genre: undefined, sort: "release", page: 1 });
    const params = requestedUrl(fetchMock).searchParams;
    expect(params.get("sort_by")).toBe("first_air_date.desc");
    expect(params.get("first_air_date.lte")).toBe("2026-11-07");
    expect(params.get("vote_count.gte")).toBe("50");
    expect(params.has("primary_release_date.lte")).toBe(false);
  });
});

/** A fake TMDB search: answers each `page` param with 20 items, every fifth one undated. */
function stubSearchPages(kind: "movie" | "tv", totalPages: number) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const page = Number(new URL(String(input)).searchParams.get("page"));
    const results = Array.from({ length: 20 }, (_, index) => {
      const id = page * 100 + index;
      // Dates scattered across pages, so a correct sort has to look past TMDB's own order.
      const date = index % 5 === 4 ? "" : `${1960 + ((id * 37) % 70)}-0${1 + (index % 9)}-15`;
      return kind === "movie"
        ? { id, title: `Movie ${id}`, release_date: date, vote_average: 7, vote_count: 100, poster_path: null }
        : { id, name: `Show ${id}`, first_air_date: date, vote_average: 7, vote_count: 100, poster_path: null };
    });
    return Response.json({ page, results, total_pages: totalPages, total_results: totalPages * 20 - 3 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedPages(fetchMock: ReturnType<typeof stubSearchPages>) {
  return fetchMock.mock.calls.map(([input]) => new URL(String(input)).searchParams.get("page"));
}

/** Result years in page order must run newest first, with undated results last. */
function expectNewestFirst(years: (number | undefined)[]) {
  const dated = years.filter((year) => year !== undefined);
  expect(dated).toEqual([...dated].sort((a, b) => b - a));
  expect(years.slice(dated.length).every((year) => year === undefined)).toBe(true);
}

describe("searchTitles", () => {
  it("searches non-adult movies by relevance with TMDB's paging, in one call", async () => {
    const fetchMock = stubFetch(search);
    const page = await searchTitles("  matrix ", 2, "relevance");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/search/movie");
    expect(url.searchParams.get("query")).toBe("matrix");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.get("page")).toBe("2");
    expect(page.results.map(({ name }) => name)).toEqual(["The Matrix", "The Matrix Reloaded", "The Matrix Revolutions"]);
    expect(page.totalResults).toBe(72);
    expect(page.totalPages).toBe(4);
  });

  it("sorts by recency across the first 5 TMDB pages, fetching page 1 first", async () => {
    const fetchMock = stubSearchPages("movie", 9);
    const page1 = await searchTitles("batman", 1, "recency");
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(requestedPages(fetchMock)[0]).toBe("1");
    expect(new Set(requestedPages(fetchMock))).toEqual(new Set(["1", "2", "3", "4", "5"]));
    expect(requestedUrl(fetchMock).searchParams.get("query")).toBe("batman");
    expect(page1).toMatchObject({ page: 1, totalPages: 5, totalResults: 100 });

    const pages = [page1];
    for (const number of [2, 3, 4, 5]) pages.push(await searchTitles("batman", number, "recency"));
    expect(pages.map(({ page }) => page)).toEqual([1, 2, 3, 4, 5]);
    const years = pages.flatMap(({ results }) => results.map(({ year }) => year));
    expect(years).toHaveLength(100);
    expect(years.filter((year) => year === undefined)).toHaveLength(20);
    expectNewestFirst(years);
  });

  it("sorts by rating over the same 5-page window, highest first", async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const page = Number(new URL(String(input)).searchParams.get("page"));
      const results = Array.from({ length: 20 }, (_, index) => {
        const id = page * 100 + index;
        // Ratings scattered across pages, so a correct sort has to look past TMDB's own order.
        const vote_average = ((id * 37) % 100) / 10;
        return { id, title: `Movie ${id}`, release_date: "2000-01-01", vote_average, vote_count: 100, poster_path: null };
      });
      return Response.json({ page, results, total_pages: 9, total_results: 177 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const page1 = await searchTitles("batman", 1, "rating");
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(page1).toMatchObject({ page: 1, totalPages: 5, totalResults: 100 });
    const pages = [page1];
    for (const number of [2, 3, 4, 5]) pages.push(await searchTitles("batman", number, "rating"));
    const ratings = pages.flatMap(({ results }) => results.map(({ rating }) => rating ?? 0));
    expect(ratings).toHaveLength(100);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
  });

  it("makes only as many calls as TMDB has pages when there are fewer than 5", async () => {
    const fetchMock = stubSearchPages("movie", 2);
    const page = await searchTitles("batman", 1, "recency");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(page).toMatchObject({ totalPages: 2, totalResults: 40 });
  });

  it("returns an empty page past the window without calling TMDB", async () => {
    const fetchMock = stubSearchPages("movie", 9);
    const page = await searchTitles("batman", 6, "recency");
    expect(page.results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns an empty page for a blank query without calling TMDB", async () => {
    const fetchMock = stubFetch(search);
    const empty = { results: [], page: 1, totalPages: 0, totalResults: 0 };
    await expect(searchTitles("   ", 1, "relevance")).resolves.toEqual(empty);
    await expect(searchTitles("   ", 1, "recency")).resolves.toEqual(empty);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("searchShows", () => {
  it("searches non-adult TV series by relevance with TMDB's paging, in one call", async () => {
    const fetchMock = stubFetch(searchTv);
    const page = await searchShows("  breaking ", 2, "relevance");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/search/tv");
    expect(url.searchParams.get("query")).toBe("breaking");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.get("page")).toBe("2");
    expect(page.results.map(({ kind, name }) => [kind, name])).toEqual([
      ["tv", "Breaking Bad"],
      ["tv", "Breaking In"],
      ["tv", "Breaking Point"],
    ]);
    expect(page.totalResults).toBe(117);
    expect(page.totalPages).toBe(6);
  });

  it("sorts TV by first air date across the window, newest first, undated last", async () => {
    const fetchMock = stubSearchPages("tv", 3);
    const page = await searchShows("breaking", 1, "recency");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(requestedUrl(fetchMock).pathname).toBe("/3/search/tv");
    expect(page).toMatchObject({ totalPages: 3, totalResults: 60 });
    expect(page.results.every(({ kind }) => kind === "tv")).toBe(true);
    const pages = [page, await searchShows("breaking", 2, "recency"), await searchShows("breaking", 3, "recency")];
    expectNewestFirst(pages.flatMap(({ results }) => results.map(({ year }) => year)));
  });

  it("returns an empty page for a blank query without calling TMDB", async () => {
    const fetchMock = stubFetch(searchTv);
    const empty = { results: [], page: 1, totalPages: 0, totalResults: 0 };
    await expect(searchShows("   ", 1, "relevance")).resolves.toEqual(empty);
    await expect(searchShows("   ", 1, "recency")).resolves.toEqual(empty);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
