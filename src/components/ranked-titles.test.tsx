import { render, screen, within } from "@testing-library/react";
import type { CardTitle } from "./card-title";
import { RankedTitles } from "./ranked-titles";

function title(id: number, name: string): CardTitle {
  return { key: `movie-${id}`, colorKey: String(id), transitionName: `poster-movie-${id}`, href: `/title/${id}`, name, year: 1999, rating: 8.218 };
}

const TITLES = [title(603, "The Matrix"), title(550, "Fight Club"), title(13, "Forrest Gump")];

function items() {
  return within(screen.getByRole("list", { name: "Titles" })).getAllByRole("listitem");
}

describe("RankedTitles", () => {
  it("numbers the titles in order from the first rank", () => {
    render(<RankedTitles titles={TITLES} firstRank={2} />);
    expect(items().map((item) => within(item).getByRole("heading").textContent)).toEqual(["The Matrix", "Fight Club", "Forrest Gump"]);
    expect(items().map((item) => within(item).getByTestId("rank").textContent)).toEqual(["2", "3", "4"]);
  });

  it("carries the numbering on from an earlier page", () => {
    render(<RankedTitles titles={TITLES} firstRank={22} />);
    expect(items().map((item) => within(item).getByTestId("rank").textContent)).toEqual(["22", "23", "24"]);
  });

  it("links each title to its page, with its year and rating", () => {
    render(<RankedTitles titles={TITLES} firstRank={2} />);
    const [matrix] = items();
    expect(within(matrix).getByRole("link")).toHaveAttribute("href", "/title/603");
    expect(within(matrix).getByRole("heading", { name: "The Matrix" })).toBeInTheDocument();
    expect(within(matrix).getByText("1999")).toBeInTheDocument();
    expect(within(matrix).getByText("Rating 8.2 out of 10")).toHaveClass("sr-only");
  });

  it("renders nothing without titles", () => {
    const { container } = render(<RankedTitles titles={[]} firstRank={2} />);
    expect(container).toBeEmptyDOMElement();
  });
});
