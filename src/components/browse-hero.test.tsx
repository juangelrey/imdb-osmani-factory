import { render, screen } from "@testing-library/react";
import { BrowseHero } from "./browse-hero";
import type { CardTitle } from "./card-title";

const INCEPTION: CardTitle = {
  key: "movie-27205",
  colorKey: "27205",
  transitionName: "poster-movie-27205",
  href: "/title/27205-inception",
  name: "Inception",
  year: 2010,
  rating: 8.369,
};

describe("BrowseHero", () => {
  it("headlines the first title under the page heading, linking to its page", () => {
    render(<BrowseHero heading="All titles" lead={INCEPTION} sort="popularity" page={1} />);
    expect(screen.getByRole("heading", { level: 1, name: "All titles" })).toBeInTheDocument();
    const name = screen.getByRole("heading", { level: 2, name: "Inception" });
    expect(name.querySelector("a")).toHaveAttribute("href", "/title/27205-inception");
    expect(screen.getByText("2010")).toBeInTheDocument();
    expect(screen.getByText("Rating 8.4 out of 10")).toHaveClass("sr-only");
  });

  it.each([
    ["popularity", "Most popular right now"],
    ["rating", "Highest rated"],
    ["release", "Newest release"],
    ["title", "First by title"],
  ] as const)("says why the title leads when sorted by %s", (sort, reason) => {
    render(<BrowseHero heading="All titles" lead={INCEPTION} sort={sort} page={1} />);
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("names the page instead once past page 1, where the title no longer leads the whole list", () => {
    render(<BrowseHero heading="Drama series" lead={INCEPTION} sort="popularity" page={3} />);
    expect(screen.getByText("Page 3")).toBeInTheDocument();
    expect(screen.queryByText("Most popular right now")).not.toBeInTheDocument();
  });

  it("leaves out the year and rating TMDB does not have", () => {
    render(<BrowseHero heading="All titles" lead={{ ...INCEPTION, year: undefined, rating: undefined }} sort="popularity" page={1} />);
    expect(screen.queryByText(/Rating/)).not.toBeInTheDocument();
    expect(screen.queryByText("2010")).not.toBeInTheDocument();
  });
});
