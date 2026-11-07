import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPage from "./error";

describe("Error page", () => {
  it("explains the problem without technical details", () => {
    render(<ErrorPage error={new Error("TMDB request to /movie/1 failed with status 500")} retry={() => {}} />);
    expect(screen.getByRole("heading", { name: "Something went wrong loading movies" })).toBeInTheDocument();
    expect(screen.queryByText(/status 500/)).not.toBeInTheDocument();
  });

  it("retries when asked", async () => {
    const retry = vi.fn();
    render(<ErrorPage error={new Error("boom")} retry={retry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("links back home", () => {
    render(<ErrorPage error={new Error("boom")} retry={() => {}} />);
    expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
  });
});
