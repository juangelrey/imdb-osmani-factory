import { render, screen, within } from "@testing-library/react";
import { toShow } from "@/lib/catalog/map";
import type { Show } from "@/lib/catalog/types";
import tvDetails from "@/lib/tmdb/fixtures/tv-details.json";
import tvSparse from "@/lib/tmdb/fixtures/tv-details-sparse.json";
import type { TmdbTvDetails } from "@/lib/tmdb/schema";
import { ShowDetails } from "./show-details";

const show: Show = toShow(tvDetails as TmdbTvDetails);
const sparse: Show = toShow(tvSparse as TmdbTvDetails);

function fact(term: string) {
  const dt = screen.getByText(term, { selector: "dt" });
  return dt.nextElementSibling as HTMLElement;
}

describe("ShowDetails", () => {
  it("renders every field inside an article", () => {
    const { container } = render(<ShowDetails show={show} />);
    const article = screen.getByRole("article");
    expect(within(article).getByRole("heading", { level: 1, name: "Breaking Bad" })).toBeInTheDocument();
    expect(within(article).getByText(show.synopsis!)).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("src", show.posterUrl);
    expect(fact("Years")).toHaveTextContent("2008–2013");
    expect(fact("Seasons")).toHaveTextContent("5");
    expect(fact("Episodes")).toHaveTextContent("62");
    expect(fact("Genres")).toHaveTextContent("Drama, Crime");
    expect(fact("Rating")).toHaveTextContent("8.9 / 10");
  });

  it("links the creators and the top 10 cast to their person pages", () => {
    render(<ShowDetails show={show} />);
    expect(within(fact("Created by")).getByRole("link", { name: "Vince Gilligan" })).toHaveAttribute(
      "href",
      "/person/66633-vince-gilligan",
    );
    const cast = within(fact("Cast")).getAllByRole("link");
    expect(cast).toHaveLength(10);
    expect([cast[0].textContent, cast[0].getAttribute("href")]).toEqual(["Bryan Cranston", "/person/17419-bryan-cranston"]);
  });

  it("labels a single year \"Year\"", () => {
    render(<ShowDetails show={{ ...show, years: "2019" }} />);
    expect(fact("Year")).toHaveTextContent("2019");
    expect(screen.queryByText("Years", { selector: "dt" })).not.toBeInTheDocument();
  });

  it("hides every empty part for the sparse fixture and shows the gradient poster", () => {
    const { container } = render(<ShowDetails show={sparse} />);
    expect(screen.getByRole("heading", { level: 1, name: "Untitled Pilot" })).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("UP")).toBeInTheDocument();
    for (const term of ["Year", "Years", "Seasons", "Episodes", "Genres", "Rating", "Created by", "Cast"]) {
      expect(screen.queryByText(term, { selector: "dt" })).not.toBeInTheDocument();
    }
    expect(container).not.toHaveTextContent(/NaN|undefined/);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("shows actions under the heading", () => {
    render(<ShowDetails show={show} actions={<button type="button">Save</button>} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
