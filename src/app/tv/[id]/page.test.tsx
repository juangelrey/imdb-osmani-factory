import { render, screen } from "@testing-library/react";
import { notFound, permanentRedirect } from "next/navigation";
import details from "@/lib/tmdb/fixtures/tv-details.json";
import ShowPage, { dynamicParams, generateMetadata, generateStaticParams, revalidate } from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

const params = (id: string) => ({ params: Promise.resolve({ id }) });

function stubTmdb(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("TV page", () => {
  it("renders on demand and caches for an hour instead of prerendering shows", () => {
    expect(generateStaticParams()).toEqual([]);
    expect(dynamicParams).toBe(true);
    expect(revalidate).toBe(3600);
  });

  it("renders a TMDB show at its canonical URL with exactly one TMDB request", async () => {
    const fetchMock = stubTmdb(details);
    render(await ShowPage(params("1396-breaking-bad")));
    expect(screen.getByRole("heading", { level: 1, name: "Breaking Bad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vince Gilligan" })).toHaveAttribute("href", "/person/66633-vince-gilligan");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe("/3/tv/1396");
    expect(url.searchParams.get("append_to_response")).toBe("credits");
  });

  it("names the page after the show", async () => {
    stubTmdb(details);
    expect(await generateMetadata(params("1396-breaking-bad"))).toEqual({ title: "Breaking Bad · Reelbase" });
  });

  it("names an unknown show's page Not found", async () => {
    stubTmdb({ success: false }, 404);
    expect(await generateMetadata(params("999999999"))).toEqual({ title: "Not found · Reelbase" });
  });

  it.each(["1396-wrong-slug", "1396"])("permanently redirects %s to the canonical slug", async (id) => {
    stubTmdb(details);
    await expect(ShowPage(params(id))).rejects.toThrow("redirect /tv/1396-breaking-bad");
    expect(permanentRedirect).toHaveBeenCalledWith("/tv/1396-breaking-bad");
  });

  it("returns a 404 for an unknown id", async () => {
    stubTmdb({ success: false }, 404);
    await expect(ShowPage(params("999999999-nothing"))).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalled();
  });

  it("returns a 404 for an adult show", async () => {
    stubTmdb({ ...details, adult: true });
    await expect(ShowPage(params("1396-breaking-bad"))).rejects.toThrow("not found");
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it("lets TMDB outages reach the error boundary", async () => {
    stubTmdb({}, 503);
    await expect(ShowPage(params("1396-breaking-bad"))).rejects.toThrow("status 503");
    expect(notFound).not.toHaveBeenCalled();
  });
});

describe("TV page params", () => {
  it.each(["abc", "breaking-bad", "01396-breaking-bad"])("returns a 404 for %s without calling TMDB", async (id) => {
    const fetchMock = stubTmdb(details);
    await expect(ShowPage(params(id))).rejects.toThrow("not found");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
