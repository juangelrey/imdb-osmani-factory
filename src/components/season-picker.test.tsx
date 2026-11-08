import { render, screen, within } from "@testing-library/react";
import { toShow } from "@/lib/catalog/map";
import tvDetails from "@/lib/tmdb/fixtures/tv-details.json";
import type { TmdbTvDetails } from "@/lib/tmdb/schema";
import { SeasonPicker } from "./season-picker";

const { seasons } = toShow(tvDetails as TmdbTvDetails);

describe("SeasonPicker", () => {
  it("links every season to ?season=N with its episode count", () => {
    render(<SeasonPicker href="/tv/1396-breaking-bad" seasons={seasons} current={1} />);
    const nav = screen.getByRole("navigation", { name: "Seasons" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(6);
    expect(links[0]).toHaveAttribute("href", "/tv/1396-breaking-bad?season=1");
    expect(links[0]).toHaveTextContent("Season 1");
    expect(links[0]).toHaveTextContent("7 episodes");
  });

  it("puts Specials last, linking to season 0", () => {
    render(<SeasonPicker href="/tv/1396-breaking-bad" seasons={seasons} current={1} />);
    const last = screen.getAllByRole("link").at(-1)!;
    expect(last).toHaveTextContent("Specials");
    expect(last).toHaveAttribute("href", "/tv/1396-breaking-bad?season=0");
  });

  it("marks only the current season with aria-current", () => {
    render(<SeasonPicker href="/tv/1396-breaking-bad" seasons={seasons} current={2} />);
    const current = screen.getAllByRole("link").filter((link) => link.hasAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Season 2");
    expect(current[0]).toHaveAttribute("aria-current", "page");
  });

  it("uses the singular for a one-episode season", () => {
    render(<SeasonPicker href="/tv/1" seasons={[{ number: 1, name: "Season 1", episodeCount: 1 }]} current={1} />);
    expect(screen.getByRole("link")).toHaveTextContent("1 episode");
    expect(screen.getByRole("link")).not.toHaveTextContent("episodes");
  });

  it("renders nothing when the show has no seasons", () => {
    const { container } = render(<SeasonPicker href="/tv/1" seasons={[]} current={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
