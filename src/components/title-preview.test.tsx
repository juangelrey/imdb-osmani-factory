import { act, fireEvent, render, screen } from "@testing-library/react";
import { onTestFinished } from "vitest";
import userEvent from "@testing-library/user-event";
import { TitlePreview } from "./title-preview";

const unforgiven = {
  colorKey: "unforgiven",
  name: "Unforgiven",
  href: "/title/33-unforgiven",
  year: 1992,
  rating: 7.9,
  synopsis: "A retired outlaw takes on one last job.",
  posterUrl: "https://image.tmdb.org/t/p/w185/54roTwbX9fltg85zjsmrooXAs12.jpg",
};

function renderPreview(props: Partial<typeof unforgiven> = {}) {
  return render(
    <TitlePreview {...unforgiven} {...props}>
      <span>thumb</span>
    </TitlePreview>,
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trigger = (name = "Unforgiven") => screen.getByRole("button", { name: `Preview ${name}` });
const card = (name = "Unforgiven") => screen.queryByRole("dialog", { name });

describe("TitlePreview", () => {
  const user = () => userEvent.setup();
  const showPopover = vi.fn();
  const hidePopover = vi.fn();

  // jsdom has no Popover API; stub it so the component takes the same path as a browser.
  beforeEach(() => {
    showPopover.mockReset();
    hidePopover.mockReset();
    Object.assign(HTMLElement.prototype, { showPopover, hidePopover });
  });
  afterEach(() => {
    const proto = HTMLElement.prototype as Partial<Record<"showPopover" | "hidePopover", unknown>>;
    delete proto.showPopover;
    delete proto.hidePopover;
  });

  it("shows the card as a manual popover, so the browser never light-dismisses it on the click that opened it", async () => {
    const u = user();
    renderPreview();
    await u.click(trigger());
    const dialog = screen.getByRole("dialog", { name: "Unforgiven" });
    expect((dialog as HTMLElement & { popover?: string }).popover).toBe("manual");
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(showPopover.mock.contexts[0]).toBe(dialog);
  });

  it("opens on a quick click and stays open", async () => {
    const u = user();
    renderPreview();
    await u.click(trigger());
    await act(() => wait(500));
    expect(card()).toBeInTheDocument();
  });

  it("stays open when the thumbnail is clicked while the card is open from hover", async () => {
    const u = user();
    renderPreview();
    await u.hover(trigger());
    await act(() => wait(350));
    expect(card()).toBeInTheDocument();
    await u.click(trigger());
    await act(() => wait(500));
    expect(card()).toBeInTheDocument();
    expect(hidePopover).not.toHaveBeenCalled();
  });

  it("closes on Escape from inside the card, returning focus to the thumbnail without reopening", async () => {
    const u = user();
    renderPreview();
    await u.tab();
    await u.tab();
    expect(screen.getByRole("link", { name: "Open" })).toHaveFocus();
    await u.keyboard("{Escape}");
    expect(trigger()).toHaveFocus();
    expect(card()).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it.each([
    ["scroll", () => fireEvent.scroll(window)],
    ["resize", () => fireEvent(window, new Event("resize"))],
  ])("closes on %s where the card is placed without anchor positioning", async (_, event) => {
    const supports = vi.spyOn(CSS, "supports").mockReturnValue(false);
    onTestFinished(() => supports.mockRestore());
    const u = user();
    renderPreview();
    await u.click(trigger());
    expect(card()).toBeInTheDocument();
    act(event);
    expect(card()).toBeNull();
  });

  it("stays open on scroll where CSS anchor positioning keeps the card on its thumbnail", async () => {
    const u = user();
    renderPreview();
    await u.click(trigger());
    act(() => fireEvent.scroll(window));
    expect(card()).toBeInTheDocument();
  });

  it("opens about 300 ms after the pointer rests on the thumbnail, and closes when it leaves", async () => {
    const u = user();
    renderPreview();
    await u.hover(trigger());
    expect(card()).toBeNull();
    await act(() => wait(250));
    expect(card()).toBeNull();
    await act(() => wait(100));
    expect(card()).toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    await u.unhover(trigger());
    await act(() => wait(300));
    expect(card()).toBeNull();
  });

  it("does not open when the pointer leaves before the delay", async () => {
    const u = user();
    renderPreview();
    await u.hover(trigger());
    await act(() => wait(100));
    await u.unhover(trigger());
    await act(() => wait(500));
    expect(card()).toBeNull();
  });

  it("stays open while the pointer moves from the thumbnail into the card", async () => {
    const u = user();
    renderPreview();
    await u.hover(trigger());
    await act(() => wait(300));
    await u.hover(screen.getByRole("dialog"));
    await act(() => wait(500));
    expect(card()).toBeInTheDocument();
  });

  it("opens on keyboard focus and closes on Escape, returning focus to the thumbnail", async () => {
    const u = user();
    renderPreview();
    await u.tab();
    expect(trigger()).toHaveFocus();
    expect(card()).toBeInTheDocument();

    await u.keyboard("{Escape}");
    expect(card()).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("opens on a tap, and a tap outside closes it", async () => {
    renderPreview();
    fireEvent.pointerDown(trigger(), { pointerType: "touch" });
    fireEvent.click(trigger());
    expect(card()).toBeInTheDocument();

    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(card()).toBeNull();
  });

  it("closes when focus moves past the card", async () => {
    const u = user();
    render(
      <>
        <TitlePreview {...unforgiven}>
          <span>thumb</span>
        </TitlePreview>
        <a href="/elsewhere">Elsewhere</a>
      </>,
    );
    await u.tab();
    await u.tab();
    expect(screen.getByRole("link", { name: "Open" })).toHaveFocus();
    await u.tab();
    expect(card()).toBeNull();
  });

  it("keeps only one card open at a time", async () => {
    const u = user();
    render(
      <>
        <TitlePreview {...unforgiven}>
          <span>thumb</span>
        </TitlePreview>
        <TitlePreview {...unforgiven} colorKey="gran-torino" name="Gran Torino" href="/title/13223-gran-torino">
          <span>thumb</span>
        </TitlePreview>
      </>,
    );
    await u.click(trigger("Unforgiven"));
    expect(card("Unforgiven")).toBeInTheDocument();
    await u.click(trigger("Gran Torino"));
    expect(card("Gran Torino")).toBeInTheDocument();
    expect(card("Unforgiven")).toBeNull();
  });

  it("shows the poster, year, rating, a clamped synopsis and an Open link to the title page", async () => {
    const u = user();
    renderPreview();
    await u.click(trigger());
    const dialog = screen.getByRole("dialog", { name: "Unforgiven" });
    expect(dialog.querySelector("img")).toHaveAttribute("src", unforgiven.posterUrl);
    expect(dialog).toHaveTextContent("1992");
    expect(dialog).toHaveTextContent("Rating 7.9 out of 10");
    expect(screen.getByText(unforgiven.synopsis)).toHaveClass("line-clamp-4");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute("href", "/title/33-unforgiven");
  });

  it("hides the year, rating and synopsis when absent, and shows the gradient without a poster", async () => {
    const u = user();
    renderPreview({ year: undefined, rating: undefined, synopsis: undefined, posterUrl: undefined });
    await u.click(trigger());
    const dialog = screen.getByRole("dialog", { name: "Unforgiven" });
    expect(dialog.querySelector("img")).toBeNull();
    expect(dialog).toHaveTextContent("U");
    expect(dialog).not.toHaveTextContent(/Rating|1992/);
    expect(dialog.querySelector("[data-synopsis]")).toBeNull();
    expect(dialog.querySelector("[data-facts]")).toBeNull();
  });
});
