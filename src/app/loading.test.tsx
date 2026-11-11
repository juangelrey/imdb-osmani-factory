import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "./layout";
import HomeLoading from "./loading";
import PersonLoading from "./person/[id]/loading";
import SearchLoading from "./search/loading";
import TitleLoading from "./title/[id]/loading";
import ShowLoading from "./tv/[id]/loading";

vi.mock("@/components/site-header", () => ({ SiteHeader: () => <header>header</header> }));

describe("loading skeletons", () => {
  it.each([
    ["/", HomeLoading],
    ["/search", SearchLoading],
    ["/title/[id]", TitleLoading],
    ["/tv/[id]", ShowLoading],
    ["/person/[id]", PersonLoading],
  ])("%s announces a busy loading region", (_route, Loading) => {
    render(<Loading />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(within(region).getByText("Loading…")).toHaveClass("sr-only");
  });

  it("browse and search show a full page of placeholder cards", () => {
    const { unmount } = render(<HomeLoading />);
    // The 20th result is the hero above the cards.
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(19);
    unmount();
    render(<SearchLoading />);
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(20);
  });

  it("pulses only when motion is allowed", () => {
    render(<TitleLoading />);
    const region = screen.getByRole("status");
    expect(region.className).toContain("motion-safe:animate-pulse");
    expect(region.className).not.toMatch(/(^|\s)animate-pulse/);
  });
});

describe("RootLayout view transitions", () => {
  it("names the footer so it stays still while main crossfades", () => {
    const html = renderToStaticMarkup(<RootLayout>page</RootLayout>);
    expect(html).toMatch(/<footer[^>]*style="view-transition-name:site-footer"/);
  });
});
