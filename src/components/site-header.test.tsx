import { render, screen, within } from "@testing-library/react";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders a banner with navigation to home and the watchlist", () => {
    render(<SiteHeader />);
    const banner = screen.getByRole("banner");
    const nav = within(banner).getByRole("navigation", { name: "Main" });
    expect(within(banner).getByRole("link", { name: "Reelbase" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "Watchlist" })).toHaveAttribute("href", "/watchlist");
  });
});
