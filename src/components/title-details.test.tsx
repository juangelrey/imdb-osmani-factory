import { render, screen, within } from "@testing-library/react";
import type { Title } from "@/lib/catalog/types";
import { TitleDetails } from "./title-details";

const title: Title = {
  id: 603,
  slug: "the-matrix",
  name: "The Matrix",
  year: 1999,
  runtime: 136,
  genres: [
    { id: 28, name: "Action" },
    { id: 878, name: "Science Fiction" },
  ],
  rating: 8.218,
  synopsis: "A hacker learns the truth about his reality.",
  posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
  director: "Lana Wachowski",
  cast: ["Keanu Reeves", "Laurence Fishburne"],
};

function fact(term: string) {
  const dt = screen.getByText(term, { selector: "dt" });
  return dt.nextElementSibling as HTMLElement;
}

describe("TitleDetails", () => {
  it("renders every field inside an article", () => {
    render(<TitleDetails title={title} />);
    const article = screen.getByRole("article");
    expect(within(article).getByRole("heading", { level: 1, name: "The Matrix" })).toBeInTheDocument();
    expect(within(article).getByText(title.synopsis!)).toBeInTheDocument();
    expect(fact("Year")).toHaveTextContent("1999");
    expect(fact("Runtime")).toHaveTextContent("2h 16m");
    expect(fact("Genres")).toHaveTextContent("Action, Science Fiction");
    expect(fact("Rating")).toHaveTextContent("8.2 / 10");
    expect(fact("Director")).toHaveTextContent("Lana Wachowski");
    expect(fact("Cast")).toHaveTextContent("Keanu Reeves, Laurence Fishburne");
  });

  it("shows the detail-size poster", () => {
    const { container } = render(<TitleDetails title={title} />);
    expect(container.querySelector("img")).toHaveAttribute("src", title.posterUrl);
  });

  it("hides fields TMDB does not have", () => {
    const sparse: Title = { id: 1, slug: "untitled", name: "Untitled", genres: [], cast: [] };
    const { container } = render(<TitleDetails title={sparse} />);
    for (const term of ["Year", "Runtime", "Genres", "Rating", "Director", "Cast"]) {
      expect(screen.queryByText(term, { selector: "dt" })).not.toBeInTheDocument();
    }
    expect(container).not.toHaveTextContent(/NaN|undefined/);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("renders the actions slot", () => {
    render(<TitleDetails title={title} actions={<button type="button">Act</button>} />);
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
  });
});
