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

describe("SiteHeader search", () => {
  it("includes the search box", () => {
    render(<SiteHeader />);
    expect(within(screen.getByRole("banner")).getByRole("search")).toBeInTheDocument();
  });
});

describe("SiteHeader view transition", () => {
  it("is named so it stays still while main crossfades", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("banner").style.viewTransitionName).toBe("site-header");
  });
});
