import { fireEvent, render, screen, within } from "@testing-library/react";
import type { CareerYear } from "@/lib/catalog/types";
import { CareerTimeline } from "./career-timeline";

const career: CareerYear[] = [
  {
    year: undefined,
    label: "TBA",
    entries: [
      {
        title: { kind: "movie", id: 77, slug: "announced", name: "Announced" },
        upcoming: false,
        roles: ["Actor"],
      },
    ],
  },
  {
    year: 2027,
    label: "2027",
    entries: [
      {
        title: { kind: "movie", id: 55, slug: "next-one", name: "Next One", year: 2027 },
        releaseDate: "2027-03-01",
        upcoming: true,
        roles: ["Director"],
      },
    ],
  },
  {
    year: 1992,
    label: "1992",
    entries: [
      {
        title: {
          kind: "movie",
          id: 33,
          slug: "unforgiven",
          name: "Unforgiven",
          year: 1992,
          posterUrl: "https://image.tmdb.org/t/p/w92/54roTwbX9fltg85zjsmrooXAs12.jpg",
        },
        releaseDate: "1992-08-07",
        upcoming: false,
        roles: ["Director", "as William Munny"],
        synopsis: "A retired outlaw takes on one last job.",
        previewPosterUrl: "https://image.tmdb.org/t/p/w185/54roTwbX9fltg85zjsmrooXAs12.jpg",
      },
    ],
  },
];

describe("CareerTimeline", () => {
  it("renders a labelled Career section with a year marker heading at each year change, in order", () => {
    render(<CareerTimeline career={career} />);
    const section = screen.getByRole("region", { name: "Career" });
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "TBA",
      "2027",
      "1992",
    ]);
  });

  it("links each title to its title page and joins its roles", () => {
    render(<CareerTimeline career={career} />);
    expect(screen.getByRole("link", { name: "Unforgiven" })).toHaveAttribute("href", "/title/33-unforgiven");
    expect(screen.getByText("Director · as William Munny")).toBeInTheDocument();
    expect(screen.getByText("Actor")).toBeInTheDocument();
  });

  it("shows a lazy w92 thumbnail at a fixed 40x60, or the gradient placeholder at the same size", () => {
    const { container } = render(<CareerTimeline career={career} />);
    const thumbnail = container.querySelector('img[src*="/w92/"]');
    expect(thumbnail).toHaveAttribute("loading", "lazy");
    expect(thumbnail).toHaveAttribute("width", "92");
    expect(thumbnail).toHaveAttribute("alt", "");
    expect(thumbnail).toHaveClass("w-10", "aspect-[2/3]");
    expect(thumbnail).not.toHaveClass("w-full");
    const tba = screen.getByRole("link", { name: "Announced" }).closest("li")!;
    expect(tba.querySelector("img")).toBeNull();
    const placeholder = tba.querySelector('[style*="linear-gradient"]');
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveClass("w-10", "aspect-[2/3]");
  });

  it("is an ordered list with one entry per film, each labelled with its date or TBA", () => {
    render(<CareerTimeline career={career} />);
    const entries = screen.getAllByRole("link").map((link) => link.closest("li")!);
    expect(entries).toHaveLength(3);
    for (const entry of entries) expect(entry.closest("ol")).not.toBeNull();
    expect(entries.map((entry) => entry.querySelector("time, [data-date]")?.textContent)).toEqual([
      "TBA",
      "1 Mar 2027",
      "7 Aug 1992",
    ]);
    expect(entries[1].querySelector("time")).toHaveAttribute("dateTime", "2027-03-01");
  });

  it("draws a decorative line with one node per film, hollow and amber when upcoming", () => {
    const { container } = render(<CareerTimeline career={career} />);
    expect(container.querySelector("[data-timeline-line]")).toHaveAttribute("aria-hidden", "true");
    const entries = screen.getAllByRole("link").map((link) => link.closest("li")!);
    const nodes = entries.map((entry) => entry.querySelectorAll("[data-timeline-node]"));
    expect(nodes.map((n) => n.length)).toEqual([1, 1, 1]);
    for (const [node] of nodes) expect(node).toHaveAttribute("aria-hidden", "true");
    expect(nodes[1][0]).toHaveClass("border-amber-400", "bg-zinc-950");
    expect(nodes[2][0]).not.toHaveClass("border-amber-400");
  });

  it("badges only upcoming films", () => {
    render(<CareerTimeline career={career} />);
    const badges = screen.getAllByText("Upcoming");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("li")).toHaveTextContent("Next One");
  });

  it("makes each thumbnail open a preview card with the w185 poster, synopsis and an Open link", () => {
    render(<CareerTimeline career={career} />);
    expect(screen.getAllByRole("button", { name: /^Preview / })).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Preview Unforgiven" }));
    const card = screen.getByRole("dialog", { name: "Unforgiven" });
    expect(card.querySelector("img")).toHaveAttribute("src", expect.stringContaining("/w185/"));
    expect(card).toHaveTextContent("A retired outlaw takes on one last job.");
    expect(within(card).getByRole("link", { name: "Open" })).toHaveAttribute("href", "/title/33-unforgiven");
  });

  it("puts no TV badge on films", () => {
    render(<CareerTimeline career={career} />);
    expect(screen.queryByText("TV")).not.toBeInTheDocument();
  });

  it("renders nothing without credits", () => {
    const { container } = render(<CareerTimeline career={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("CareerTimeline with TV credits", () => {
  const mixed: CareerYear[] = [
    {
      year: 1999,
      label: "1999",
      entries: [
        {
          title: { kind: "tv", id: 603, slug: "matrix-show", name: "Matrix Show", year: 1998 },
          releaseDate: "1999-04-01",
          upcoming: false,
          roles: ["as Brian East · 1 episode"],
          synopsis: "A show that shares an id with a film.",
        },
        {
          title: { kind: "movie", id: 603, slug: "the-matrix", name: "The Matrix", year: 1999 },
          releaseDate: "1999-03-31",
          upcoming: false,
          roles: ["as Neo"],
        },
      ],
    },
  ];

  it("badges the show 'TV' and links it, and its preview's Open, to its TV page", () => {
    render(<CareerTimeline career={mixed} />);
    const showLink = screen.getByRole("link", { name: "Matrix Show" });
    expect(showLink).toHaveAttribute("href", "/tv/603-matrix-show");
    const badges = screen.getAllByText("TV");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("li")).toBe(showLink.closest("li"));
    expect(showLink.closest("li")).toHaveTextContent("as Brian East · 1 episode");
    fireEvent.click(screen.getByRole("button", { name: "Preview Matrix Show" }));
    const card = screen.getByRole("dialog", { name: "Matrix Show" });
    expect(within(card).getByRole("link", { name: "Open" })).toHaveAttribute("href", "/tv/603-matrix-show");
  });

  it("keeps a film and a show with the same id as separate entries, linking the film to its title page", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<CareerTimeline career={mixed} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "The Matrix" })).toHaveAttribute("href", "/title/603-the-matrix");
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});

describe("CareerTimeline credits filter", () => {
  const entry = (kind: "movie" | "tv", id: number, name: string) => ({
    title: { kind, id, slug: name.toLowerCase().replaceAll(" ", "-"), name },
    upcoming: false,
    roles: ["Actor"],
  });
  const mixed: CareerYear[] = [
    { year: 2020, label: "2020", entries: [entry("tv", 1, "Show A"), entry("movie", 2, "Film B")] },
    { year: 2010, label: "2010", entries: [entry("movie", 3, "Film C")] },
    { year: 2005, label: "2005", entries: [entry("tv", 4, "Show D")] },
  ];
  const hrefForCredits = (credits: string) => `/person/1-p?credits=${credits}`;
  const filter = () => screen.getByRole("navigation", { name: "Filter credits" });
  const titles = () => [...document.querySelectorAll("ol > li")].map((li) => li.querySelector("a")?.textContent);
  const yearMarkers = () => screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);

  it("links All · Movies · TV to ?credits= and marks All current by default", () => {
    render(<CareerTimeline career={mixed} hrefForCredits={hrefForCredits} />);
    const links = within(filter()).getAllByRole("link");
    expect(links.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["All", "/person/1-p?credits=all"],
      ["Movies", "/person/1-p?credits=movie"],
      ["TV", "/person/1-p?credits=tv"],
    ]);
    expect(links.map((link) => link.getAttribute("aria-current"))).toEqual(["page", null, null]);
    expect(titles()).toEqual(["Show A", "Film B", "Film C", "Show D"]);
  });

  it("shows only TV credits, in order, with the year markers of the years left", () => {
    render(<CareerTimeline career={mixed} credits="tv" hrefForCredits={hrefForCredits} />);
    expect(within(filter()).getByRole("link", { name: "TV" })).toHaveAttribute("aria-current", "page");
    expect(within(filter()).getByRole("link", { name: "All" })).not.toHaveAttribute("aria-current");
    expect(titles()).toEqual(["Show A", "Show D"]);
    expect(yearMarkers()).toEqual(["2020", "2005"]);
  });

  it("shows only movies under Movies", () => {
    render(<CareerTimeline career={mixed} credits="movie" hrefForCredits={hrefForCredits} />);
    expect(within(filter()).getByRole("link", { name: "Movies" })).toHaveAttribute("aria-current", "page");
    expect(titles()).toEqual(["Film B", "Film C"]);
    expect(yearMarkers()).toEqual(["2020", "2010"]);
  });

  it("hides the filter when the person has credits of only one kind", () => {
    render(<CareerTimeline career={[mixed[1]]} hrefForCredits={hrefForCredits} />);
    expect(screen.queryByRole("navigation", { name: "Filter credits" })).not.toBeInTheDocument();
    expect(titles()).toEqual(["Film C"]);
  });

  it("shows a short empty message, with a way back to all credits, for a kind with no credits", () => {
    render(<CareerTimeline career={[mixed[1]]} credits="tv" hrefForCredits={hrefForCredits} />);
    const section = screen.getByRole("region", { name: "Career" });
    expect(section).toHaveTextContent("No TV credits.");
    expect(within(section).getByRole("link", { name: "Show all credits" })).toHaveAttribute(
      "href",
      "/person/1-p?credits=all",
    );
    expect(within(section).queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows no filter without hrefForCredits", () => {
    render(<CareerTimeline career={mixed} />);
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});
