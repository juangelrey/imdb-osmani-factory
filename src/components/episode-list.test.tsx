import { render, screen, within } from "@testing-library/react";
import { toSeason } from "@/lib/catalog/map";
import tvSeason from "@/lib/tmdb/fixtures/tv-season.json";
import type { TmdbSeason } from "@/lib/tmdb/schema";
import { EpisodeList } from "./episode-list";

const season = toSeason(tvSeason as TmdbSeason);

function episode(name: string) {
  return screen.getByRole("heading", { level: 3, name: new RegExp(name) }).closest("li") as HTMLElement;
}

describe("EpisodeList", () => {
  it("lists the season's episodes in order under its name", () => {
    render(<EpisodeList season={season} today="2026-11-08" />);
    expect(screen.getByRole("heading", { level: 2, name: "Season 1" })).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => within(item).getByRole("heading").textContent)).toEqual([
      "1. Pilot",
      "2. Cat's in the Bag...",
      "3. Episode 3",
    ]);
  });

  it("shows the air date, runtime, overview and a lazy w185 still", () => {
    render(<EpisodeList season={season} today="2026-11-08" />);
    const pilot = episode("Pilot");
    expect(pilot).toHaveTextContent("20 Jan 2008");
    expect(pilot).toHaveTextContent("59m");
    expect(pilot).toHaveTextContent("chemistry teacher");
    const still = pilot.querySelector("img");
    expect(still).toHaveAttribute("src", "https://image.tmdb.org/t/p/w185/ydlY3iPfeOAvu8gVqrxPoMvzNCn.jpg");
    expect(still).toHaveAttribute("loading", "lazy");
    expect(within(pilot).queryByText("Upcoming")).not.toBeInTheDocument();
  });

  it("hides absent fields", () => {
    render(<EpisodeList season={season} today="2026-11-08" />);
    const bare = episode("Episode 3");
    expect(bare.querySelector("img")).toBeNull();
    expect(bare.querySelector("time")).toBeNull();
    expect(bare.querySelector("p")).toBeNull();
    expect(bare).toHaveTextContent(/^3\. Episode 3$/);
  });

  it("marks an episode airing after today as Upcoming", () => {
    render(<EpisodeList season={season} today="2008-01-22" />);
    expect(within(episode("Cat's")).getByText("Upcoming")).toBeInTheDocument();
    expect(within(episode("Pilot")).queryByText("Upcoming")).not.toBeInTheDocument();
  });

  it("says so when the season lists no episodes", () => {
    render(<EpisodeList season={{ ...season, episodes: [] }} today="2026-11-08" />);
    expect(screen.getByText("No episodes listed yet.")).toBeInTheDocument();
  });
});
