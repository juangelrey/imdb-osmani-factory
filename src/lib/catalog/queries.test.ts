import details from "@/lib/tmdb/fixtures/movie-details.json";
import discover from "@/lib/tmdb/fixtures/discover-movie.json";
import genreList from "@/lib/tmdb/fixtures/genre-movie-list.json";
import { TmdbError } from "@/lib/tmdb/client";
import { discoverTitles, getTitle, listGenres } from "./queries";

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestedUrl(fetchMock: ReturnType<typeof stubFetch>) {
  return new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
}

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("getTitle", () => {
  it("fetches the movie with credits appended", async () => {
    const fetchMock = stubFetch(details);
    await getTitle(603);
    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe("/3/movie/603");
    expect(url.searchParams.get("append_to_response")).toBe("credits");
  });

  it("maps the response into a Title", async () => {
    stubFetch(details);
    const title = await getTitle(603);
    expect(title).toMatchObject({ id: 603, slug: "the-matrix", name: "The Matrix", director: "Lana Wachowski" });
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

describe("listGenres", () => {
  it("returns TMDB's movie genres", async () => {
    const fetchMock = stubFetch(genreList);
    const genres = await listGenres();
    expect(requestedUrl(fetchMock).pathname).toBe("/3/genre/movie/list");
    expect(genres).toContainEqual({ id: 878, name: "Science Fiction" });
  });
});

describe("discoverTitles", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("asks for a page of non-adult movies and maps the results", async () => {
    const fetchMock = stubFetch(discover);
    const page = await discoverTitles({ genre: undefined, sort: "popularity", page: 3 });
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
    await discoverTitles({ genre: 878, sort: "popularity", page: 1 });
    expect(requestedUrl(fetchMock).searchParams.get("with_genres")).toBe("878");
  });

  it.each([
    ["popularity", { sort_by: "popularity.desc" }],
    ["rating", { sort_by: "vote_average.desc", "vote_count.gte": "200" }],
    ["title", { sort_by: "title.asc" }],
  ] as const)("maps the %s sort", async (sort, expected) => {
    const fetchMock = stubFetch(discover);
    await discoverTitles({ genre: undefined, sort, page: 1 });
    const params = requestedUrl(fetchMock).searchParams;
    for (const [key, value] of Object.entries(expected)) expect(params.get(key)).toBe(value);
    expect(params.has("primary_release_date.lte")).toBe(false);
    if (sort !== "rating") expect(params.has("vote_count.gte")).toBe(false);
  });

  it("limits the release sort to films out by today with at least 50 votes", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T15:00:00Z"));
    const fetchMock = stubFetch(discover);
    await discoverTitles({ genre: undefined, sort: "release", page: 1 });
    const params = requestedUrl(fetchMock).searchParams;
    expect(params.get("sort_by")).toBe("primary_release_date.desc");
    expect(params.get("primary_release_date.lte")).toBe("2026-11-07");
    expect(params.get("vote_count.gte")).toBe("50");
  });
});
