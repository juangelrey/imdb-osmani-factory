import { render, screen } from "@testing-library/react";
import { usePathname, useSearchParams } from "next/navigation";
import { SearchBox } from "./search-box";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

function at(pathname: string, search = "") {
  vi.mocked(usePathname).mockReturnValue(pathname);
  vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams(search) as unknown as ReturnType<typeof useSearchParams>);
}

/** The values the form would submit, as a query string. */
function submitted() {
  const form = screen.getByRole("search") as HTMLFormElement;
  return new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
}

describe("SearchBox", () => {
  it("is a GET search form that submits q to /search", () => {
    at("/");
    render(<SearchBox />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/search");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("searchbox", { name: "Search titles and people" })).toHaveAttribute("name", "q");
    expect(screen.getByRole("searchbox")).toHaveAttribute("placeholder", "Search titles and people");
    expect(submitted()).toBe("q=");
  });

  it.each([
    ["/", "type=tv&genre=18"],
    ["/search", "q=breaking&type=tv&page=2"],
  ])("keeps type=tv when on %s?%s", (pathname, search) => {
    at(pathname, search);
    render(<SearchBox />);
    expect(submitted()).toBe("q=&type=tv");
  });

  it.each([
    ["/search", "q=nolan&type=person"],
    ["/search", "q=nolan&type=person&page=2"],
  ])("keeps type=person when on %s?%s", (pathname, search) => {
    at(pathname, search);
    render(<SearchBox />);
    expect(submitted()).toBe("q=&type=person");
  });

  it.each([
    ["/", ""],
    ["/", "type=person"],
    ["/person/525-christopher-nolan", "type=person"],
    ["/search", "q=matrix"],
    ["/search", "q=matrix&type=movie"],
    ["/tv/1396-breaking-bad", "type=tv"],
    ["/watchlist", "type=tv"],
  ])("searches movies when on %s?%s", (pathname, search) => {
    at(pathname, search);
    render(<SearchBox />);
    expect(submitted()).toBe("q=");
  });
});
