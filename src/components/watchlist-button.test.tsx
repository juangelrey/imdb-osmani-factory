import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY } from "@/lib/watchlist/watchlist";
import { WatchlistButton } from "./watchlist-button";

const SLUG = "the-lantern-keepers-of-varro";

beforeEach(() => {
  localStorage.clear();
});

describe("WatchlistButton", () => {
  it("adds and removes the title, reflecting state with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<WatchlistButton slug={SLUG} />);
    const button = screen.getByRole("button", { name: "Save to watchlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");

    expect(button).toHaveTextContent("Save to watchlist");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveTextContent("Saved");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([SLUG]);

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  it("shows a saved title as pressed after a reload", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([SLUG]));
    render(<WatchlistButton slug={SLUG} />);
    expect(screen.getByRole("button", { name: "Save to watchlist" })).toHaveAttribute("aria-pressed", "true");
  });

  it("treats corrupt storage as an empty watchlist", async () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    const user = userEvent.setup();
    render(<WatchlistButton slug={SLUG} />);
    const button = screen.getByRole("button", { name: "Save to watchlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps every button for the same title in sync", async () => {
    const user = userEvent.setup();
    render(
      <>
        <WatchlistButton slug={SLUG} />
        <WatchlistButton slug={SLUG} />
      </>,
    );
    const [first, second] = screen.getAllByRole("button", { name: "Save to watchlist" });
    await user.click(first);
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("updates when another tab changes the watchlist", () => {
    render(<WatchlistButton slug={SLUG} />);
    act(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([SLUG]));
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });
    expect(screen.getByRole("button", { name: "Save to watchlist" })).toHaveAttribute("aria-pressed", "true");
  });
});
