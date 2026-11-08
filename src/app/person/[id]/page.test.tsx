import { render, screen, within } from "@testing-library/react";
import { notFound, permanentRedirect } from "next/navigation";
import person from "@/lib/tmdb/fixtures/person-details.json";
import sparse from "@/lib/tmdb/fixtures/person-details-sparse.json";
import * as personPage from "./page";
import PersonPage, { generateMetadata, revalidate } from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
  permanentRedirect: vi.fn((url: string) => {
    throw new Error(`redirect ${url}`);
  }),
}));

const params = (id: string, searchParams: Record<string, string | string[] | undefined> = {}) => ({
  params: Promise.resolve({ id }),
  searchParams: Promise.resolve(searchParams),
});

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
  it("renders per request (it reads ?credits) and keeps TMDB responses cached for an hour", () => {
    expect(personPage).not.toHaveProperty("generateStaticParams");
    expect(personPage).not.toHaveProperty("dynamicParams");
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

  it("lists the facts, with the age on today's date", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-07T12:00:00Z"));
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood")));
    const facts = screen.getByRole("heading", { level: 1 }).closest("header")!.querySelector("dl")!;
    expect(within(facts).getAllByRole("term").map((dt) => dt.textContent)).toEqual([
      "Known for",
      "Born",
      "Birthplace",
    ]);
    expect(within(facts).getByText("May 31, 1930 (age 96)")).toBeInTheDocument();
  });

  it("shows no facts list rows for the sparse fixture", async () => {
    stubTmdb(sparse);
    render(await PersonPage(params("4891257-mara-lindqvist")));
    expect(screen.queryAllByRole("term")).toHaveLength(0);
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
      "1985",
      "1966",
      "1959",
    ]);
    expect(within(career).getByRole("link", { name: "Unforgiven" })).toHaveAttribute("href", "/title/33-unforgiven");
    expect(within(career).getByText("Director · as Bill Munny")).toBeInTheDocument();
    const rawhide = within(career).getByRole("link", { name: "Rawhide" });
    expect(rawhide).toHaveAttribute("href", "/tv/2343-rawhide");
    expect(rawhide.closest("li")).toHaveTextContent("TV");
    expect(rawhide.closest("li")).toHaveTextContent("as Rowdy Yates · 217 episodes");
    const amazingStories = within(career).getByRole("link", { name: "Amazing Stories" });
    expect(amazingStories).toHaveAttribute("href", "/tv/1918-amazing-stories");
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
    expect(screen.queryByText("After Hours")).not.toBeInTheDocument();
    expect(screen.queryByText("Silk Nights")).not.toBeInTheDocument();
  });

  it("hides the Career section when no credits are left to show", async () => {
    const [, ...flagged] = sparse.combined_credits.cast;
    stubTmdb({ ...sparse, combined_credits: { cast: flagged, crew: [] } });
    render(await PersonPage(params("4891257-mara-lindqvist")));
    expect(screen.queryByRole("region", { name: "Career" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Career" })).not.toBeInTheDocument();
  });

  it("filters the career to TV credits with ?credits=tv", async () => {
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood", { credits: "tv" })));
    const career = screen.getByRole("region", { name: "Career" });
    const filter = within(career).getByRole("navigation", { name: "Filter credits" });
    expect(within(filter).getByRole("link", { name: "TV" })).toHaveAttribute("aria-current", "page");
    expect(within(filter).getByRole("link", { name: "Movies" })).toHaveAttribute(
      "href",
      "/person/190-clint-eastwood?credits=movie",
    );
    const links = [...career.querySelectorAll("ol > li")].map((li) => li.querySelector("a")!.getAttribute("href"));
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((href) => href!.startsWith("/tv/"))).toBe(true);
    expect(within(career).queryByRole("link", { name: "Unforgiven" })).not.toBeInTheDocument();
  });

  it("filters the career to movies with ?credits=movie", async () => {
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood", { credits: "movie" })));
    const career = screen.getByRole("region", { name: "Career" });
    expect(within(career).getByRole("link", { name: "Unforgiven" })).toBeInTheDocument();
    expect(within(career).queryByRole("link", { name: "Rawhide" })).not.toBeInTheDocument();
  });

  it.each([{}, { credits: "junk" }])("reads %o as All", async (search) => {
    stubTmdb(person);
    render(await PersonPage(params("190-clint-eastwood", search)));
    const career = screen.getByRole("region", { name: "Career" });
    const filter = within(career).getByRole("navigation", { name: "Filter credits" });
    expect(within(filter).getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "page");
    expect(within(career).getByRole("link", { name: "Unforgiven" })).toBeInTheDocument();
    expect(within(career).getByRole("link", { name: "Rawhide" })).toBeInTheDocument();
  });

  it("hides the filter for a person with credits of only one kind", async () => {
    stubTmdb(sparse);
    render(await PersonPage(params("4891257-mara-lindqvist")));
    expect(screen.queryByRole("navigation", { name: "Filter credits" })).not.toBeInTheDocument();
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

  it("keeps ?credits through the slug redirect", async () => {
    stubTmdb(person);
    await expect(PersonPage(params("190-wrong-slug", { credits: "tv" }))).rejects.toThrow(
      "redirect /person/190-clint-eastwood?credits=tv",
    );
  });

  it("drops an unknown ?credits value on the slug redirect", async () => {
    stubTmdb(person);
    await expect(PersonPage(params("190", { credits: "junk" }))).rejects.toThrow("redirect /person/190-clint-eastwood");
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
