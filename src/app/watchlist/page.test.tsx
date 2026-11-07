import { render, screen } from "@testing-library/react";
import WatchlistPage from "./page";

describe("Watchlist page", () => {
  it("renders the heading and the watchlist view", () => {
    localStorage.clear();
    render(<WatchlistPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Your watchlist" })).toBeInTheDocument();
    expect(screen.getByText("Your watchlist is empty.")).toBeInTheDocument();
  });
});
