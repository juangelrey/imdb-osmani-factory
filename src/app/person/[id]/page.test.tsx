import { render, screen, within } from "@testing-library/react";
import { notFound, permanentRedirect } from "next/navigation";
import person from "@/lib/tmdb/fixtures/person-details.json";
import sparse from "@/lib/tmdb/fixtures/person-details-sparse.json";
import PersonPage, { dynamicParams, generateMetadata, generateStaticParams, revalidate } from "./page";

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
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Person page", () => {
  it("renders on demand and caches for an hour instead of prerendering people", () => {
    expect(generateStaticParams()).toEqual([]);
    expect(dynamicParams).toBe(true);
    expect(revalidate).toBe(3600);
  });

  it("renders the name and the h632 profile photo at the canonical URL", async () => {
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood")));
    expect(screen.getByRole("heading", { level: 1, name: "Clint Eastwood" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Clint Eastwood" })).toHaveAttribute(
      "src",
      "https://image.tmdb.org/t/p/h632/dU35NnjZ8aGh9LxIgSXgXGr4jmx.jpg",
    );
  });

  it("shows the gradient placeholder, named after the person, when there is no photo", async () => {
    stubTmdb(sparse);
    render(await PersonPage(params("4891257-mara-lindqvist")));
    const placeholder = screen.getByRole("img", { name: "Mara Lindqvist" });
    expect(placeholder.tagName).toBe("DIV");
    expect(placeholder).toHaveTextContent("ML");
  });

  it("shows the merged career, flagging films dated after today's date as upcoming", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2024-06-01T12:00:00Z"));
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood")));
    const career = screen.getByRole("region", { name: "Career" });
    expect(within(career).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "2024",
      "2008",
      "1992",
      "1966",
    ]);
    expect(within(career).getByRole("link", { name: "Unforgiven" })).toHaveAttribute("href", "/title/33-unforgiven");
    expect(within(career).getByText("Director · as Bill Munny")).toBeInTheDocument();
    expect(within(career).getByText("Upcoming").closest("li")).toHaveTextContent("Juror #2");
  });

  it("drops the badge once the release date has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T12:00:00Z"));
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood")));
    expect(screen.queryByText("Upcoming")).not.toBeInTheDocument();
  });

  it("shows only the sparse fixture's undated credit, under TBA", async () => {
    stubTmdb(sparse);
    render(await PersonPage(params("4891257-mara-lindqvist")));
    const career = screen.getByRole("region", { name: "Career" });
    expect(within(career).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual(["TBA"]);
    expect(within(career).getAllByRole("listitem")).toHaveLength(1);
    expect(within(career).getByText("Actor")).toBeInTheDocument();
    expect(screen.queryByText("Late Shift")).not.toBeInTheDocument();
    expect(screen.queryByText("Velvet Hours")).not.toBeInTheDocument();
  });

  it("hides the Career section when no credits are left to show", async () => {
    const [, adult, softcore] = sparse.movie_credits.cast;
    stubTmdb({ ...sparse, movie_credits: { cast: [adult, softcore], crew: [] } });
    render(await PersonPage(params("4891257-mara-lindqvist")));
    expect(screen.queryByRole("region", { name: "Career" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Career" })).not.toBeInTheDocument();
  });

  it("names the page after the person", async () => {
    stubTmdb(person);
    expect(await generateMetadata(params("190-clint-eastwood"))).toEqual({ title: "Clint Eastwood · Reelbase" });
  });

  it.each(["190-wrong-slug", "190"])("permanently redirects %s to the canonical slug", async (id) => {
    stubTmdb(person);
    await expect(PersonPage(params(id))).rejects.toThrow("redirect /person/190-clint-eastwood");
    expect(permanentRedirect).toHaveBeenCalledWith("/person/190-clint-eastwood");
  });

  it("returns a 404 for an unknown id", async () => {
    stubTmdb({ success: false }, 404);
    await expect(PersonPage(params("999999999-nobody"))).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalled();
  });

  it("returns a 404 for a person TMDB flags adult", async () => {
    stubTmdb({ ...person, adult: true });
    await expect(PersonPage(params("190-clint-eastwood"))).rejects.toThrow("not found");
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it("lets TMDB outages reach the error boundary", async () => {
    stubTmdb({}, 503);
    await expect(PersonPage(params("190-clint-eastwood"))).rejects.toThrow("status 503");
    expect(notFound).not.toHaveBeenCalled();
  });

  it.each(["clint-eastwood", "abc", "0190-clint-eastwood"])("returns a 404 for %s without calling TMDB", async (id) => {
    const fetchMock = stubTmdb(person);
    await expect(PersonPage(params(id))).rejects.toThrow("not found");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
