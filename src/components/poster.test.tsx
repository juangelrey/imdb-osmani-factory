import { render } from "@testing-library/react";
import { ViewTransition, type ReactElement } from "react";
import { Poster, posterTransitionName } from "./poster";

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

  it("names the poster for the shared morph, by kind and id, when given a transition name", () => {
    const element = Poster({ colorKey: "k", name: "Name", transitionName: posterTransitionName("tv", 603) }) as ReactElement<
      Record<string, unknown>
    >;
    expect(element.type).toBe(ViewTransition);
    expect(element.props).toMatchObject({ name: "poster-tv-603", share: "morph", default: "none" });
    expect(posterTransitionName("movie", 603)).toBe("poster-movie-603");
  });

  it("renders no view transition without a name, so timeline thumbnails never share one", () => {
    const element = Poster({ colorKey: "k", name: "Name", size: "thumb" }) as ReactElement;
    expect(element.type).not.toBe(ViewTransition);
  });
});
