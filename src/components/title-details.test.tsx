import { render, screen, within } from "@testing-library/react";
import type { Title } from "@/lib/catalog/types";
import { titleColorKey } from "./poster";
import { posterColors } from "./poster-art";
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
  directors: [{ id: 9340, slug: "lana-wachowski", name: "Lana Wachowski" }],
  cast: [
    { id: 6384, slug: "keanu-reeves", name: "Keanu Reeves" },
    { id: 2975, slug: "laurence-fishburne", name: "Laurence Fishburne" },
  ],
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

  it("links the director and each cast member to their person pages", () => {
    render(<TitleDetails title={title} />);
    expect(within(fact("Director")).getByRole("link", { name: "Lana Wachowski" })).toHaveAttribute(
      "href",
      "/person/9340-lana-wachowski",
    );
    const cast = within(fact("Cast")).getAllByRole("link");
    expect(cast.map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["Keanu Reeves", "/person/6384-keanu-reeves"],
      ["Laurence Fishburne", "/person/2975-laurence-fishburne"],
    ]);
    expect(screen.queryByText("Directors", { selector: "dt" })).not.toBeInTheDocument();
  });

  it("labels two or more directors \"Directors\" and links each", () => {
    const directors = [
      { id: 9340, slug: "lana-wachowski", name: "Lana Wachowski" },
      { id: 9339, slug: "lilly-wachowski", name: "Lilly Wachowski" },
    ];
    render(<TitleDetails title={{ ...title, directors }} />);
    expect(screen.queryByText("Director", { selector: "dt" })).not.toBeInTheDocument();
    const links = within(fact("Directors")).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/person/9340-lana-wachowski",
      "/person/9339-lilly-wachowski",
    ]);
    expect(fact("Directors")).toHaveTextContent("Lana Wachowski, Lilly Wachowski");
  });

  it("shows the detail-size poster", () => {
    const { container } = render(<TitleDetails title={title} />);
    expect(container.querySelector("img")).toHaveAttribute("src", title.posterUrl);
  });

  it("hides fields TMDB does not have", () => {
    const sparse: Title = { id: 1, slug: "untitled", name: "Untitled", genres: [], directors: [], cast: [] };
    const { container } = render(<TitleDetails title={sparse} />);
    for (const term of ["Year", "Runtime", "Genres", "Rating", "Director", "Directors", "Cast"]) {
      expect(screen.queryByText(term, { selector: "dt" })).not.toBeInTheDocument();
    }
    expect(container).not.toHaveTextContent(/NaN|undefined/);
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("renders the actions slot", () => {
    render(<TitleDetails title={title} actions={<button type="button">Act</button>} />);
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
  });

  it("seeds the fallback gradient with the same colour key as its grid card", () => {
    const { container } = render(<TitleDetails title={{ ...title, posterUrl: undefined }} />);
    const { from, to } = posterColors(titleColorKey("movie", 603));
    expect(container.querySelector('[style*="linear-gradient"]')).toHaveStyle({
      backgroundImage: `linear-gradient(160deg, ${from}, ${to})`,
    });
  });
});
