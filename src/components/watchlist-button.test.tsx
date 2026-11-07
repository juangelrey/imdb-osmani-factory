import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEY, type WatchlistEntry } from "@/lib/watchlist/watchlist";
import { WatchlistButton } from "./watchlist-button";

const ENTRY: WatchlistEntry = { id: 603, slug: "the-matrix", name: "The Matrix", year: 1999, rating: 8.2, posterPath: "/m.jpg" };

beforeEach(() => {
  localStorage.clear();
});

describe("WatchlistButton", () => {
  it("adds and removes the movie snapshot, reflecting state with aria-pressed", async () => {
    const user = userEvent.setup();
    render(<WatchlistButton entry={ENTRY} />);
    const button = screen.getByRole("button", { name: "Save to watchlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveTextContent("Save to watchlist");

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveTextContent("Saved");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([ENTRY]);

    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });

  it("shows a saved movie as pressed after a reload", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([ENTRY]));
    render(<WatchlistButton entry={ENTRY} />);
    expect(screen.getByRole("button", { name: "Save to watchlist" })).toHaveAttribute("aria-pressed", "true");
  });

  it("treats corrupt storage as an empty watchlist", async () => {
    localStorage.setItem(STORAGE_KEY, "{oops");
    const user = userEvent.setup();
    render(<WatchlistButton entry={ENTRY} />);
    const button = screen.getByRole("button", { name: "Save to watchlist" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps every button for the same movie in sync", async () => {
    const user = userEvent.setup();
    render(
      <>
        <WatchlistButton entry={ENTRY} />
        <WatchlistButton entry={ENTRY} />
      </>,
    );
    const [first, second] = screen.getAllByRole("button", { name: "Save to watchlist" });
    await user.click(first);
    expect(second).toHaveAttribute("aria-pressed", "true");
  });

  it("updates when another tab changes the watchlist", () => {
    render(<WatchlistButton entry={ENTRY} />);
    act(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([ENTRY]));
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });
    expect(screen.getByRole("button", { name: "Save to watchlist" })).toHaveAttribute("aria-pressed", "true");
  });
});
