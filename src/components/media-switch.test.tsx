import { render, screen, within } from "@testing-library/react";
import { MediaSwitch } from "./media-switch";

describe("MediaSwitch", () => {
  it("links Movies and TV through the href builder and marks the current kind", () => {
    render(<MediaSwitch current="tv" hrefForKind={(kind) => `/x?type=${kind}`} />);
    const nav = screen.getByRole("navigation", { name: "Movies or TV" });
    const movies = within(nav).getByRole("link", { name: "Movies" });
    const tv = within(nav).getByRole("link", { name: "TV" });
    expect(movies).toHaveAttribute("href", "/x?type=movie");
    expect(movies).not.toHaveAttribute("aria-current");
    expect(tv).toHaveAttribute("href", "/x?type=tv");
    expect(tv).toHaveAttribute("aria-current", "page");
  });
});
