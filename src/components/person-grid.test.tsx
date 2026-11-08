import { render, screen, within } from "@testing-library/react";
import type { PersonSummary } from "@/lib/catalog/types";
import { PersonGrid } from "./person-grid";

const nolan: PersonSummary = {
  id: 525,
  slug: "christopher-nolan",
  name: "Christopher Nolan",
  knownFor: "Directing",
  profileUrl: "https://image.tmdb.org/t/p/w185/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
};

describe("PersonGrid", () => {
  it("renders a card per person linking to their person page, with name and department", () => {
    render(<PersonGrid people={[nolan]} emptyMessage="Nobody." />);
    const grid = screen.getByRole("list", { name: "People" });
    const link = within(grid).getByRole("link", { name: /Christopher Nolan/ });
    expect(link).toHaveAttribute("href", "/person/525-christopher-nolan");
    expect(within(link).getByText("Directing")).toBeInTheDocument();
  });

  it("shows the TMDB profile photo, lazily", () => {
    const { container } = render(<PersonGrid people={[nolan]} emptyMessage="" />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", nolan.profileUrl);
    expect(img).toHaveAttribute("alt", "");
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("falls back to a placeholder with initials without a photo, and leaves out a missing department", () => {
    const { container } = render(
      <PersonGrid people={[{ ...nolan, profileUrl: undefined, knownFor: undefined }]} emptyMessage="" />,
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText("CN")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveTextContent(/^CNChristopher Nolan$/);
  });

  it("shows the empty message when there is nobody", () => {
    render(<PersonGrid people={[]} emptyMessage="No people match “zzz”." />);
    expect(screen.getByText("No people match “zzz”.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
