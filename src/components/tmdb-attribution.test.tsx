import { render, screen } from "@testing-library/react";
import { TmdbAttribution } from "./tmdb-attribution";

describe("TmdbAttribution", () => {
  it("shows the required TMDB notice", () => {
    render(<TmdbAttribution />);
    expect(
      screen.getByText("This product uses the TMDB API but is not endorsed or certified by TMDB."),
    ).toBeInTheDocument();
  });

  it("links to TMDB", () => {
    render(<TmdbAttribution />);
    expect(screen.getByRole("link", { name: "TMDB" })).toHaveAttribute("href", "https://www.themoviedb.org/");
  });
});
