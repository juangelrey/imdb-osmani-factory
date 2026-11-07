import { render, screen } from "@testing-library/react";
import { SearchBox } from "./search-box";

describe("SearchBox", () => {
  it("is a GET search form that submits q to /search", () => {
    render(<SearchBox />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/search");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("searchbox", { name: "Search titles" })).toHaveAttribute("name", "q");
  });
});
