import { render, screen, within } from "@testing-library/react";
import { ProviderFilter } from "./provider-filter";
import type { BrowseState } from "@/lib/catalog/browse-params";
import type { Provider } from "@/lib/catalog/providers";

const LOGO = (path: string) => `https://image.tmdb.org/t/p/w92/${path}.jpg`;

/** A region's top 12, in display order, as `listProviders` returns them. */
const PROVIDERS: Provider[] = [
  { id: 8, name: "Netflix", logoUrl: LOGO("netflix") },
  { id: 9, name: "Amazon Prime Video", logoUrl: LOGO("prime") },
  { id: 350, name: "Apple TV", logoUrl: LOGO("appletv") },
  { id: 337, name: "Disney Plus", logoUrl: LOGO("disney") },
  { id: 15, name: "Hulu", logoUrl: LOGO("hulu") },
  { id: 2285, name: "JustWatch TV Free", logoUrl: LOGO("jwfree") },
  { id: 257, name: "fuboTV", logoUrl: LOGO("fubo") },
  { id: 1899, name: "Max", logoUrl: LOGO("max") },
  { id: 386, name: "Peacock Premium", logoUrl: LOGO("peacock") },
  { id: 531, name: "Paramount Plus", logoUrl: LOGO("paramount") },
  { id: 300, name: "Pluto TV", logoUrl: LOGO("pluto") },
  { id: 73, name: "Tubi TV", logoUrl: LOGO("tubi") },
];

const BASE: BrowseState = { kind: "movie", genres: [], sort: "popularity", page: 1, region: "US", regionFromUrl: false, providers: [] };

function renderFilter(state: Partial<BrowseState> = {}, providers = PROVIDERS) {
  render(<ProviderFilter providers={providers} state={{ ...BASE, ...state }} />);
  return screen.queryByRole("navigation", { name: "Streaming service" });
}

describe("ProviderFilter", () => {
  it("shows a pill per service, in the order given, after Any service", () => {
    const nav = renderFilter()!;
    const names = within(nav).getAllByRole("link").map((link) => link.getAttribute("aria-label") ?? link.textContent);
    expect(names).toEqual(["Any service", ...PROVIDERS.map(({ name }) => name)]);
  });

  it("shows each logo from image.tmdb.org at a fixed size, with the service name as alt", () => {
    const nav = renderFilter()!;
    const logos = within(nav).getAllByRole("img");
    expect(logos).toHaveLength(12);
    logos.forEach((logo, index) => {
      expect(logo).toHaveAttribute("alt", PROVIDERS[index].name);
      expect(logo).toHaveAttribute("src", PROVIDERS[index].logoUrl);
      expect(logo).toHaveAttribute("width", "20");
      expect(logo).toHaveAttribute("height", "20");
    });
  });

  it("keeps a pill for a service without a logo, named by its text", () => {
    const nav = renderFilter({}, [{ id: 8, name: "Netflix", logoUrl: undefined }])!;
    expect(within(nav).queryAllByRole("img")).toHaveLength(0);
    expect(within(nav).getByRole("link", { name: "Netflix" })).toHaveTextContent("Netflix");
  });

  it("marks every selected service current and nothing else", () => {
    const nav = renderFilter({ providers: [8, 337] })!;
    expect(within(nav).getByRole("link", { name: "Netflix" })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByRole("link", { name: "Disney Plus" })).toHaveAttribute("aria-current", "true");
    expect(within(nav).getByRole("link", { name: "Hulu" })).not.toHaveAttribute("aria-current");
    expect(within(nav).getByRole("link", { name: "Any service" })).not.toHaveAttribute("aria-current");
  });

  it("marks Any service current when no service is selected", () => {
    expect(within(renderFilter()!).getByRole("link", { name: "Any service" })).toHaveAttribute("aria-current", "true");
  });

  it("adds an unselected service in ascending order and removes a selected one", () => {
    const nav = renderFilter({ providers: [8, 337] })!;
    expect(within(nav).getByRole("link", { name: "Hulu" })).toHaveAttribute("href", "/?providers=8,15,337");
    expect(within(nav).getByRole("link", { name: "Netflix" })).toHaveAttribute("href", "/?providers=337");
    expect(within(nav).getByRole("link", { name: "Disney Plus" })).toHaveAttribute("href", "/?providers=8");
  });

  it("clears every service with Any service", () => {
    expect(within(renderFilter({ providers: [8, 337] })!).getByRole("link", { name: "Any service" })).toHaveAttribute("href", "/");
  });

  it("returns to page 1 and keeps the kind, genres, sort and an explicit region", () => {
    const nav = renderFilter({ kind: "tv", genres: [18, 35], providers: [8], sort: "rating", page: 3, region: "ES", regionFromUrl: true })!;
    expect(within(nav).getByRole("link", { name: "Any service" })).toHaveAttribute("href", "/?type=tv&genre=18,35&region=ES&sort=rating");
    expect(within(nav).getByRole("link", { name: "Hulu" })).toHaveAttribute(
      "href",
      "/?type=tv&genre=18,35&providers=8,15&region=ES&sort=rating",
    );
  });

  it("leaves a region from the cookie or browser language out of the pills", () => {
    const nav = renderFilter({ region: "GB", regionFromUrl: false })!;
    expect(within(nav).getByRole("link", { name: "Netflix" })).toHaveAttribute("href", "/?providers=8");
  });

  it("credits JustWatch next to the filter, linking to justwatch.com", () => {
    renderFilter();
    expect(screen.getByRole("link", { name: "Streaming data by JustWatch" })).toHaveAttribute("href", "https://www.justwatch.com/");
  });

  it("renders nothing, credit included, when the region lists no services", () => {
    expect(renderFilter({}, [])).toBeNull();
    expect(screen.queryByText(/JustWatch/)).not.toBeInTheDocument();
  });
});
