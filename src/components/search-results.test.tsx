import { render, screen, within } from "@testing-library/react";
import type { Title } from "@/lib/seed-catalog/types";
import { SearchResults } from "./search-results";

function makeTitle(slug: string, name: string): Title {
  return { slug, name, year: 2000, runtime: 90, genres: ["Drama"], rating: 6, synopsis: "s", director: "d", cast: ["c"] };
}

const titles = [makeTitle("glass-harbor", "Glass Harbor"), makeTitle("ember-road", "Ember Road")];

describe("SearchResults", () => {
  it("asks for a query when it is blank", () => {
    render(<SearchResults titles={titles} query="   " />);
    expect(screen.getByText("Type a title name in the search box to find it.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("says so when nothing matches", () => {
    render(<SearchResults titles={titles} query="zzz" />);
    expect(screen.getByText("No titles match “zzz”.")).toBeInTheDocument();
  });

  it("lists matches case-insensitively with a count", () => {
    render(<SearchResults titles={titles} query="hArBoR" />);
    expect(screen.getByText("1 result for “hArBoR”")).toBeInTheDocument();
    const grid = screen.getByRole("list", { name: "Titles" });
    expect(within(grid).getByRole("link", { name: /Glass Harbor/ })).toBeInTheDocument();
    expect(within(grid).queryByRole("link", { name: /Ember Road/ })).not.toBeInTheDocument();
  });
});
