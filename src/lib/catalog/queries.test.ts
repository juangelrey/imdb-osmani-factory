import details from "@/lib/tmdb/fixtures/movie-details.json";
import { TmdbError } from "@/lib/tmdb/client";
import { getTitle } from "./queries";

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
