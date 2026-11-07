import { render, screen } from "@testing-library/react";
import type { Title } from "@/lib/catalog/types";
import { TitleGrid } from "./title-grid";

const ember: Title = {
  slug: "ember-road",
  name: "Ember Road",
  year: 2019,
  runtime: 101,
  genres: ["Action"],
  rating: 8.1,
  synopsis: "A synopsis.",
  director: "Ada Vell",
  cast: ["Bo Lenn"],
};

describe("TitleGrid", () => {
  it("renders a card per title linking to its page, with name, year and rating", () => {
    render(<TitleGrid titles={[ember]} emptyMessage="Nothing here." />);
    const link = screen.getByRole("link", { name: /Ember Road/ });
    expect(link).toHaveAttribute("href", "/title/ember-road");
    expect(screen.getByText("2019")).toBeInTheDocument();
    expect(screen.getByLabelText("Rating 8.1 out of 10")).toBeInTheDocument();
  });

  it("shows the empty message and no list when there are no titles", () => {
    render(<TitleGrid titles={[]} emptyMessage="No titles match this genre." />);
    expect(screen.getByText("No titles match this genre.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
