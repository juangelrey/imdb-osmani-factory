import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { notFound, permanentRedirect } from "next/navigation";
import details from "@/lib/tmdb/fixtures/movie-details.json";
import sparse from "@/lib/tmdb/fixtures/movie-details-sparse.json";
import { STORAGE_KEY } from "@/lib/watchlist/watchlist";
import TitlePage, { dynamicParams, generateMetadata, generateStaticParams, revalidate } from "./page";

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

describe("Title page", () => {
  it("renders on demand and caches for an hour instead of prerendering movies", () => {
    expect(generateStaticParams()).toEqual([]);
    expect(dynamicParams).toBe(true);
    expect(revalidate).toBe(3600);
  });

  it("renders a TMDB title at its canonical URL", async () => {
    stubTmdb(details);
    render(await TitlePage(params("603-the-matrix")));
    expect(screen.getByRole("heading", { level: 1, name: "The Matrix" })).toBeInTheDocument();
    expect(screen.getByText("Lana Wachowski")).toBeInTheDocument();
  });

  it("links both Matrix directors to their person pages with exactly one TMDB request", async () => {
    const fetchMock = stubTmdb(details);
    render(await TitlePage(params("603-the-matrix")));
    expect(screen.getByRole("link", { name: "Lana Wachowski" })).toHaveAttribute("href", "/person/9340-lana-wachowski");
    expect(screen.getByRole("link", { name: "Lilly Wachowski" })).toHaveAttribute("href", "/person/9339-lilly-wachowski");
    expect(screen.getByText("Directors", { selector: "dt" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.pathname).toBe("/3/movie/603");
    expect(url.searchParams.get("append_to_response")).toBe("credits,recommendations");
  });

  it("suggests up to 12 recommended movies below the details, linking to their pages", async () => {
    stubTmdb(details);
    render(await TitlePage(params("603-the-matrix")));
    const section = screen.getByRole("region", { name: "If you liked The Matrix, you might also like…" });
    const links = within(section).getAllByRole("link");
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveAttribute("href", "/title/604-the-matrix-reloaded");
    expect(within(section).queryByText("Adult Feature")).not.toBeInTheDocument();
  });

  it("shows no recommendations section for a movie without any", async () => {
    stubTmdb(sparse);
    render(await TitlePage(params("1184918-untitled-short")));
    expect(screen.getByRole("heading", { level: 1, name: "Untitled Short" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /you might also like/ })).not.toBeInTheDocument();
  });

  it("names the page after the title", async () => {
    stubTmdb(details);
    expect(await generateMetadata(params("603-the-matrix"))).toEqual({ title: "The Matrix · Reelbase" });
  });

  it.each(["603-wrong-slug", "603"])("permanently redirects %s to the canonical slug", async (id) => {
    stubTmdb(details);
    await expect(TitlePage(params(id))).rejects.toThrow("redirect /title/603-the-matrix");
    expect(permanentRedirect).toHaveBeenCalledWith("/title/603-the-matrix");
  });

  it("returns a 404 for an unknown id", async () => {
    stubTmdb({ success: false }, 404);
    await expect(TitlePage(params("999999999-nothing"))).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalled();
  });

  it("lets TMDB outages reach the error boundary", async () => {
    stubTmdb({}, 503);
    await expect(TitlePage(params("603-the-matrix"))).rejects.toThrow("status 503");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("offers the watchlist button, saving a snapshot of the movie", async () => {
    stubTmdb(details);
    localStorage.clear();
    render(await TitlePage(params("603-the-matrix")));
    await userEvent.click(screen.getByRole("button", { name: "Save to watchlist" }));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([
      { kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.218, posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg" },
    ]);
  });
});

describe("Title page params", () => {
  it.each(["the-lantern-keepers-of-varro", "does-not-exist", "0603-the-matrix"])(
    "returns a 404 for %s without calling TMDB",
    async (id) => {
      const fetchMock = stubTmdb(details);
      await expect(TitlePage(params(id))).rejects.toThrow("not found");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
