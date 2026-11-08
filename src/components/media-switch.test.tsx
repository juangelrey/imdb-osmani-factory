import { render, screen, within } from "@testing-library/react";
import { MediaSwitch } from "./media-switch";

describe("MediaSwitch", () => {
  it("links Movies and TV through the href builder and marks the current kind", () => {
    render(<MediaSwitch kinds={["movie", "tv"]} current="tv" hrefForKind={(kind) => `/x?type=${kind}`} />);
    const nav = screen.getByRole("navigation", { name: "Movies or TV" });
    const movies = within(nav).getByRole("link", { name: "Movies" });
    const tv = within(nav).getByRole("link", { name: "TV" });
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
    expect(movies).toHaveAttribute("href", "/x?type=movie");
    expect(movies).not.toHaveAttribute("aria-current");
    expect(tv).toHaveAttribute("href", "/x?type=tv");
    expect(tv).toHaveAttribute("aria-current", "page");
  });

  it("shows the kinds it is given, in order, and marks People when current", () => {
    render(<MediaSwitch kinds={["movie", "tv", "person"]} current="person" hrefForKind={(kind) => `/x?type=${kind}`} />);
    const nav = screen.getByRole("navigation", { name: "Movies, TV or People" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Movies", "TV", "People"]);
    expect(within(nav).getByRole("link", { name: "People" })).toHaveAttribute("href", "/x?type=person");
    expect(within(nav).getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Movies" })).not.toHaveAttribute("aria-current");
  });

  it("marks none when the current kind is not among them", () => {
    render(<MediaSwitch kinds={["movie", "tv"]} current="person" hrefForKind={(kind) => `/x?type=${kind}`} />);
    expect(screen.queryByRole("link", { current: "page" })).not.toBeInTheDocument();
  });
});
