import { render, screen, within } from "@testing-library/react";
import type { Title } from "@/lib/seed-catalog/types";
import { TitleDetails } from "./title-details";

const title: Title = {
  slug: "glass-harbor",
  name: "Glass Harbor",
  year: 2011,
  runtime: 127,
  genres: ["Drama", "Mystery"],
  rating: 7.4,
  synopsis: "A lighthouse keeper finds a door in the fog.",
  director: "Ada Vell",
  cast: ["Bo Lenn", "Cy Marrow"],
};

function fact(term: string) {
  const dt = screen.getByText(term, { selector: "dt" });
  return dt.nextElementSibling as HTMLElement;
}

describe("TitleDetails", () => {
  it("renders every field inside an article", () => {
    render(<TitleDetails title={title} />);
    const article = screen.getByRole("article");
    expect(within(article).getByRole("heading", { level: 1, name: "Glass Harbor" })).toBeInTheDocument();
    expect(within(article).getByText(title.synopsis)).toBeInTheDocument();
    expect(fact("Year")).toHaveTextContent("2011");
    expect(fact("Runtime")).toHaveTextContent("2h 7m");
    expect(fact("Genres")).toHaveTextContent("Drama, Mystery");
    expect(fact("Rating")).toHaveTextContent("7.4 / 10");
    expect(fact("Director")).toHaveTextContent("Ada Vell");
    expect(fact("Cast")).toHaveTextContent("Bo Lenn, Cy Marrow");
  });

  it("renders the actions slot", () => {
    render(<TitleDetails title={title} actions={<button type="button">Act</button>} />);
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
  });
});
