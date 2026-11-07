import { render, screen } from "@testing-library/react";
import type { Person } from "@/lib/catalog/types";
import { PersonDetails } from "./person-details";

const person: Person = {
  id: 190,
  slug: "clint-eastwood",
  name: "Clint Eastwood",
  knownFor: "Acting",
  born: "May 31, 1930",
  died: "November 5, 2020 (aged 90)",
  birthplace: "San Francisco, California, USA",
  career: [],
};

function fact(term: string) {
  const dt = screen.getByText(term, { selector: "dt" });
  return dt.nextElementSibling as HTMLElement;
}

describe("PersonDetails", () => {
  it("lists every fact under the name", () => {
    render(<PersonDetails person={person} />);
    expect(fact("Known for")).toHaveTextContent("Acting");
    expect(fact("Born")).toHaveTextContent("May 31, 1930");
    expect(fact("Died")).toHaveTextContent("November 5, 2020 (aged 90)");
    expect(fact("Birthplace")).toHaveTextContent("San Francisco, California, USA");
  });

  it("hides each missing fact", () => {
    render(<PersonDetails person={{ ...person, died: undefined, birthplace: undefined }} />);
    expect(screen.queryByText("Died", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.queryByText("Birthplace", { selector: "dt" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("term")).toHaveLength(2);
  });

  it("renders no facts list when every fact is missing", () => {
    const { container } = render(<PersonDetails person={{ id: 1, slug: "x", name: "X", career: [] }} />);
    expect(container.querySelector("dl")).toBeNull();
  });

  it("shows the biography under its heading", () => {
    render(<PersonDetails person={{ ...person, biography: "An American actor and director." }} />);
    expect(screen.getByRole("heading", { name: "Biography" })).toBeInTheDocument();
    expect(screen.getByText("An American actor and director.")).toBeInTheDocument();
  });

  it("hides the biography section when there is no biography", () => {
    render(<PersonDetails person={person} />);
    expect(screen.queryByRole("heading", { name: "Biography" })).not.toBeInTheDocument();
  });
});
