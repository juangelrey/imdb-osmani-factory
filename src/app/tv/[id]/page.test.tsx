import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notFound, permanentRedirect } from "next/navigation";
import details from "@/lib/tmdb/fixtures/tv-details.json";
import sparse from "@/lib/tmdb/fixtures/tv-details-sparse.json";
import tvSeason from "@/lib/tmdb/fixtures/tv-season.json";
import { STORAGE_KEY } from "@/lib/watchlist/watchlist";
import ShowPage, * as page from "./page";
import { generateMetadata, revalidate } from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

const params = (id: string, search: Record<string, string | string[]> = {}) => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve(search),
});

const withSeasonOne = { ...details, "season/1": tvSeason };
const withSeasonTwo = { ...details, "season/2": { ...tvSeason, season_number: 2, name: "Season 2" } };

/** A fetch stub answering each TMDB path from `bodies`, and 404 for any other path. */
function stubTmdbPaths(bodies: Record<string, unknown>) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const body = bodies[new URL(String(input)).pathname];
    return body === undefined ? Response.json({ success: false }, { status: 404 }) : Response.json(body);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

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
  it("renders on demand, since ?season is read per request, and caches for an hour", () => {
    expect(page).not.toHaveProperty("generateStaticParams");
    expect(revalidate).toBe(3600);
  });

  it("renders a TMDB show at its canonical URL with exactly one TMDB request", async () => {
    const fetchMock = stubTmdb(withSeasonOne);
    render(await ShowPage(params("1396-breaking-bad")));
    expect(screen.getByRole("heading", { level: 1, name: "Breaking Bad" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vince Gilligan" })).toHaveAttribute("href", "/person/66633-vince-gilligan");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe("/3/tv/1396");
    expect(url.searchParams.get("append_to_response")).toBe("credits,recommendations,season/1");
  });

  it("suggests up to 12 recommended shows below the episode list, linking to their TV pages", async () => {
    stubTmdb(withSeasonOne);
    render(await ShowPage(params("1396-breaking-bad")));
    const section = screen.getByRole("region", { name: "If you liked Breaking Bad, you might also like…" });
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveAttribute("href", "/tv/60059-better-call-saul");
    expect(within(section).queryByText("Adult Series")).not.toBeInTheDocument();
    expect(within(section).queryByText("Softcore Series")).not.toBeInTheDocument();
    const episode = screen.getByRole("heading", { level: 3, name: "1. Pilot" });
    expect(episode.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the recommendations when the season comes from the fallback request", async () => {
    stubTmdbPaths({ "/3/tv/1396": details, "/3/tv/1396/season/1": tvSeason });
    render(await ShowPage(params("1396-breaking-bad", { season: "99" })));
    const section = screen.getByRole("region", { name: /you might also like/ });
    expect(within(section).getAllByRole("link")).toHaveLength(12);
  });

  it("shows no recommendations section for a show without any", async () => {
    stubTmdb(sparse);
    render(await ShowPage(params("299999-untitled-pilot")));
    expect(screen.getByRole("heading", { level: 1, name: "Untitled Pilot" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /you might also like/ })).not.toBeInTheDocument();
  });

  it("offers the watchlist button, saving a snapshot of the show", async () => {
    stubTmdb(withSeasonOne);
    localStorage.clear();
    render(await ShowPage(params("1396-breaking-bad")));
    const button = screen.getByRole("button", { name: "Save to watchlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([
      { kind: "tv", id: 1396, slug: "breaking-bad", name: "Breaking Bad", year: 2008, rating: 8.9, posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg" },
    ]);
  });

  it("does not show the show as saved when a movie with the same id is saved", async () => {
    stubTmdb(withSeasonOne);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ kind: "movie", id: 1396, slug: "some-movie", name: "Some Movie" }]));
    render(await ShowPage(params("1396-breaking-bad")));
    expect(screen.getByRole("button", { name: "Save to watchlist" })).toHaveAttribute("aria-pressed", "false");
    localStorage.clear();
  });

  it("shows season 1 by default, with the picker marking it current", async () => {
    stubTmdb(withSeasonOne);
    render(await ShowPage(params("1396-breaking-bad")));
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Season 1");
    expect(screen.getByRole("heading", { level: 2, name: "Season 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "1. Pilot" })).toBeInTheDocument();
  });

  it("shows the season chosen by ?season", async () => {
    const fetchMock = stubTmdb(withSeasonTwo);
    render(await ShowPage(params("1396-breaking-bad", { season: "2" })));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Season 2");
    expect(screen.getByRole("heading", { level: 2, name: "Season 2" })).toBeInTheDocument();
  });

  it("falls back to the default season for an unknown season, without a 404", async () => {
    const fetchMock = stubTmdbPaths({ "/3/tv/1396": details, "/3/tv/1396/season/1": tvSeason });
    render(await ShowPage(params("1396-breaking-bad", { season: "99" })));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Season 1");
  });

  it.each(["abc", "-1", "1.5", ""])("reads a malformed ?season=%s as the default season", async (season) => {
    const fetchMock = stubTmdb(withSeasonOne);
    render(await ShowPage(params("1396-breaking-bad", { season })));
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.searchParams.get("append_to_response")).toBe("credits,recommendations,season/1");
    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent("Season 1");
  });

  it("keeps ?season when redirecting a wrong slug", async () => {
    stubTmdb(withSeasonTwo);
    await expect(ShowPage(params("1396-wrong-slug", { season: "2" }))).rejects.toThrow(
      "redirect /tv/1396-breaking-bad?season=2",
    );
  });

  it("names the page after the show", async () => {
    stubTmdb(withSeasonOne);
    expect(await generateMetadata(params("1396-breaking-bad"))).toEqual({ title: "Breaking Bad · Reelbase" });
  });

  it("names an unknown show's page Not found", async () => {
    stubTmdb({ success: false }, 404);
    expect(await generateMetadata(params("999999999"))).toEqual({ title: "Not found · Reelbase" });
  });

  it.each(["1396-wrong-slug", "1396"])("permanently redirects %s to the canonical slug", async (id) => {
    stubTmdb(withSeasonOne);
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
