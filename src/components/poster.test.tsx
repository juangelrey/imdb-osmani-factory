import { render } from "@testing-library/react";
import { Poster } from "./poster";

const posterUrl = "https://image.tmdb.org/t/p/w342/abc.jpg";

describe("Poster", () => {
  it.each(["grid", "detail", "profile"] as const)("fills its container at %s size", (size) => {
    const { container } = render(<Poster colorKey="k" name="Name" posterUrl={posterUrl} size={size} />);
    expect(container.querySelector("img")).toHaveClass("w-full");
  });

  it("lets the caller set a thumbnail's width, for the image and the placeholder alike", () => {
    const image = render(<Poster colorKey="k" name="Name" posterUrl={posterUrl} size="thumb" className="w-10" />);
    expect(image.container.querySelector("img")).toHaveClass("w-10");
    expect(image.container.querySelector("img")).not.toHaveClass("w-full");

    const placeholder = render(<Poster colorKey="k" name="Name" size="thumb" className="w-10" />);
    const gradient = placeholder.container.querySelector('[aria-hidden="true"]');
    expect(gradient).toHaveClass("w-10", "aspect-[2/3]");
    expect(gradient).not.toHaveClass("w-full");
  });
});
