import { TMDB_REVALIDATE_SECONDS, TmdbError, tmdbFetch } from "./client";

const TOKEN = "test-token-value";

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function requestOf(fetchMock: ReturnType<typeof stubFetch>) {
  const [input, init] = fetchMock.mock.calls[0] as unknown as [URL | string, RequestInit & { next?: { revalidate?: number } }];
  return { url: new URL(String(input)), init };
}

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", TOKEN);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("tmdbFetch", () => {
  it("calls the TMDB v3 base URL with the path and en-US language", async () => {
    const fetchMock = stubFetch(Response.json({ ok: true }));
    await tmdbFetch("/movie/603");
    const { url } = requestOf(fetchMock);
    expect(url.origin + url.pathname).toBe("https://api.themoviedb.org/3/movie/603");
    expect(url.searchParams.get("language")).toBe("en-US");
  });

  it("adds query params and skips undefined ones", async () => {
    const fetchMock = stubFetch(Response.json({}));
    await tmdbFetch("/discover/movie", { page: 2, include_adult: false, with_genres: undefined });
    const { url } = requestOf(fetchMock);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("include_adult")).toBe("false");
    expect(url.searchParams.has("with_genres")).toBe(false);
  });

  it("sends the read access token as a Bearer header", async () => {
    const fetchMock = stubFetch(Response.json({}));
    await tmdbFetch("/genre/movie/list");
    const headers = new Headers(requestOf(fetchMock).init.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(headers.get("accept")).toBe("application/json");
  });

  it("caches responses for an hour", async () => {
    const fetchMock = stubFetch(Response.json({}));
    await tmdbFetch("/genre/movie/list");
    expect(TMDB_REVALIDATE_SECONDS).toBe(3600);
    expect(requestOf(fetchMock).init.next).toEqual({ revalidate: 3600 });
  });

  it("returns the parsed JSON body", async () => {
    stubFetch(Response.json({ id: 603, title: "The Matrix" }));
    await expect(tmdbFetch<{ id: number; title: string }>("/movie/603")).resolves.toEqual({ id: 603, title: "The Matrix" });
  });

  it.each([404, 429, 500])("throws a TmdbError carrying status %i", async (status) => {
    stubFetch(new Response("{}", { status }));
    const error = await tmdbFetch("/movie/1").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(TmdbError);
    expect(error).toMatchObject({ status, path: "/movie/1" });
  });

  it("throws a TmdbError without a status when the network fails", async () => {
    stubFetch(new TypeError("fetch failed"));
    const error = await tmdbFetch("/movie/1").catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(TmdbError);
    expect(error).toMatchObject({ status: undefined, path: "/movie/1" });
  });

  it("never puts the token in an error message", async () => {
    stubFetch(new Response("{}", { status: 401 }));
    const error = (await tmdbFetch("/movie/1").catch((caught: unknown) => caught)) as Error;
    expect(error.message).not.toContain(TOKEN);
  });

  it.each(["", "   "])("fails clearly before any request when the token is %j", async (token) => {
    vi.stubEnv("TMDB_READ_ACCESS_TOKEN", token);
    const fetchMock = stubFetch(Response.json({}));
    await expect(tmdbFetch("/movie/1")).rejects.toThrow("TMDB_READ_ACCESS_TOKEN is not set");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails clearly when the token is missing", async () => {
    vi.stubEnv("TMDB_READ_ACCESS_TOKEN", undefined);
    await expect(tmdbFetch("/movie/1")).rejects.toThrow("TMDB_READ_ACCESS_TOKEN is not set");
  });
});
