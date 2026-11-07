import { render, screen, within } from "@testing-library/react";
import type { CareerYear } from "@/lib/catalog/types";
import { CareerTimeline } from "./career-timeline";

const career: CareerYear[] = [
  {
    year: undefined,
    label: "TBA",
    entries: [
      {
        title: { id: 77, slug: "announced", name: "Announced" },
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
        title: { id: 55, slug: "next-one", name: "Next One", year: 2027 },
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
          id: 33,
          slug: "unforgiven",
          name: "Unforgiven",
          year: 1992,
          posterUrl: "https://image.tmdb.org/t/p/w92/54roTwbX9fltg85zjsmrooXAs12.jpg",
        },
        releaseDate: "1992-08-07",
        upcoming: false,
        roles: ["Director", "as William Munny"],
      },
    ],
  },
];

describe("CareerTimeline", () => {
  it("renders a labelled Career section with a heading per year, in order", () => {
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

  it("shows a lazy w92 thumbnail, or the gradient placeholder without a poster", () => {
    const { container } = render(<CareerTimeline career={career} />);
    const thumbnail = container.querySelector('img[src*="/w92/"]');
    expect(thumbnail).toHaveAttribute("loading", "lazy");
    expect(thumbnail).toHaveAttribute("width", "92");
    expect(thumbnail).toHaveAttribute("alt", "");
    const tba = screen.getByRole("link", { name: "Announced" }).closest("li")!;
    expect(tba.querySelector("img")).toBeNull();
    expect(tba.querySelector('[aria-hidden="true"]')?.getAttribute("style")).toContain("linear-gradient");
  });

  it("badges only upcoming films", () => {
    render(<CareerTimeline career={career} />);
    const badges = screen.getAllByText("Upcoming");
    expect(badges).toHaveLength(1);
    expect(badges[0].closest("li")).toHaveTextContent("Next One");
  });

  it("renders nothing without credits", () => {
    const { container } = render(<CareerTimeline career={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
