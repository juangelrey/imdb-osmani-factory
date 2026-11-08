import { render, screen, within } from "@testing-library/react";
import type { TitleSummary } from "@/lib/catalog/types";
import { Recommendations } from "./recommendations";

const reloaded: TitleSummary = {
  kind: "movie",
  id: 604,
  slug: "the-matrix-reloaded",
  name: "The Matrix Reloaded",
  year: 2003,
  rating: 7,
  posterUrl: "https://image.tmdb.org/t/p/w342/9TGHDvWrqKBzwDxDodHYXEmOE6J.jpg",
};

const HEADING = "If you liked The Matrix, you might also like…";

describe("Recommendations", () => {
  it("heads the section after the title and shows a card per recommendation", () => {
    const revolutions = { ...reloaded, id: 605, slug: "the-matrix-revolutions", name: "The Matrix Revolutions" };
    render(<Recommendations name="The Matrix" titles={[reloaded, revolutions]} />);
    const section = screen.getByRole("region", { name: HEADING });
    expect(within(section).getByRole("heading", { level: 2, name: HEADING })).toBeInTheDocument();
    expect(within(section).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/title/604-the-matrix-reloaded",
      "/title/605-the-matrix-revolutions",
    ]);
  });

  it("links show recommendations to their TV pages", () => {
    const show: TitleSummary = { kind: "tv", id: 1396, slug: "breaking-bad", name: "Breaking Bad" };
    render(<Recommendations name="Better Call Saul" titles={[show]} />);
    expect(screen.getByRole("link", { name: /Breaking Bad/ })).toHaveAttribute("href", "/tv/1396-breaking-bad");
  });

  it("renders nothing when there are no recommendations", () => {
    const { container } = render(<Recommendations name="The Matrix" titles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
