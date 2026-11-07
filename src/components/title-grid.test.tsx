import { render, screen } from "@testing-library/react";
import type { CardTitle } from "./card-title";
import { TitleGrid } from "./title-grid";

const matrix: CardTitle = {
  key: "603",
  href: "/title/603-the-matrix",
  name: "The Matrix",
  year: 1999,
  rating: 8.218,
  posterUrl: "https://image.tmdb.org/t/p/w342/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
};

describe("TitleGrid", () => {
  it("renders a card per title linking to its page, with name, year and rating", () => {
    render(<TitleGrid titles={[matrix]} emptyMessage="Nothing here." />);
    expect(screen.getByRole("link", { name: /The Matrix/ })).toHaveAttribute("href", "/title/603-the-matrix");
    expect(screen.getByText("1999")).toBeInTheDocument();
    expect(screen.getByText("Rating 8.2 out of 10")).toBeInTheDocument();
  });

  it("shows the TMDB poster at grid size", () => {
    const { container } = render(<TitleGrid titles={[matrix]} emptyMessage="" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", matrix.posterUrl);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("falls back to the generated poster without a poster URL", () => {
    const { container } = render(<TitleGrid titles={[{ ...matrix, posterUrl: undefined }]} emptyMessage="" />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("hides a missing year instead of showing NaN or undefined", () => {
    render(<TitleGrid titles={[{ ...matrix, year: undefined }]} emptyMessage="" />);
    const card = screen.getByRole("link", { name: /The Matrix/ });
    expect(card).not.toHaveTextContent(/NaN|undefined/);
    expect(screen.getByText("Rating 8.2 out of 10")).toBeInTheDocument();
  });

  it("shows the empty message and no list when there are no titles", () => {
    render(<TitleGrid titles={[]} emptyMessage="No titles match this genre." />);
    expect(screen.getByText("No titles match this genre.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
