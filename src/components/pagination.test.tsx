import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { Pagination } from "./pagination";

// next/link keeps `transitionTypes` for its click handler; expose them so the test can read them.
vi.mock("next/link", () => ({
  default: ({ transitionTypes, ...props }: ComponentProps<"a"> & { transitionTypes?: string[] }) => (
    <a data-transition-types={transitionTypes?.join(" ")} {...props} />
  ),
}));

const hrefForPage = (page: number) => `/?page=${page}`;

describe("Pagination", () => {
  it("shows only Next on the first page", () => {
    render(<Pagination page={1} totalPages={5} hrefForPage={hrefForPage} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(nav).toHaveTextContent("Page 1 of 5");
    expect(screen.queryByRole("link", { name: /Previous/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?page=2");
  });

  it("shows both links on a middle page", () => {
    render(<Pagination page={3} totalPages={5} hrefForPage={hrefForPage} />);
    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/?page=2");
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/?page=4");
  });

  it("shows only Previous on the last page", () => {
    render(<Pagination page={5} totalPages={5} hrefForPage={hrefForPage} />);
    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/?page=4");
    expect(screen.queryByRole("link", { name: /Next/ })).not.toBeInTheDocument();
  });

  it("renders nothing when everything fits on one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} hrefForPage={hrefForPage} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("tags Next and Previous with opposite transition types, so they slide in opposite directions", () => {
    render(<Pagination page={3} totalPages={5} hrefForPage={hrefForPage} />);
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("data-transition-types", "nav-forward");
    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute("data-transition-types", "nav-back");
  });
});
