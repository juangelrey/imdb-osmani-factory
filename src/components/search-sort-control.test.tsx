import { render, screen, within } from "@testing-library/react";
import { SearchSortControl } from "./search-sort-control";

describe("SearchSortControl", () => {
  it("links to Recency, Rating and Relevance in that order, with the hrefs the caller builds", () => {
    render(<SearchSortControl current="recency" hrefForSort={(sort) => `/search?q=x&sort=${sort}`} />);
    const nav = screen.getByRole("navigation", { name: "Sort results" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Recency", "Rating", "Relevance"]);
    expect(within(nav).getByRole("link", { name: "Rating" })).toHaveAttribute("href", "/search?q=x&sort=rating");
    expect(within(nav).getByRole("link", { name: "Relevance" })).toHaveAttribute("href", "/search?q=x&sort=relevance");
  });

  it("marks only the current sort with aria-current", () => {
    render(<SearchSortControl current="relevance" hrefForSort={() => "/search"} />);
    const nav = screen.getByRole("navigation", { name: "Sort results" });
    expect(within(nav).getByRole("link", { name: "Relevance" })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByRole("link", { name: "Recency" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Rating" })).not.toHaveAttribute("aria-current");
  });
});
