import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { TitleCard } from "./title-card";

const linkProps = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("next/link", () => ({
  default: ({ children, href, prefetch, ...props }: ComponentProps<"a"> & { prefetch?: unknown }) => {
    linkProps.push({ href, prefetch, ...props });
    return (
      <a href={String(href)} {...props}>
        {children}
      </a>
    );
  },
}));

describe("TitleCard", () => {
  beforeEach(() => linkProps.splice(0));

  it("links to the title with the default prefetch, so grids add no full detail renders (#40 decision 11)", () => {
    render(<TitleCard title={{ key: "movie-603", colorKey: "603", transitionName: "poster-movie-603", href: "/title/603-the-matrix", name: "The Matrix", year: 1999 }} />);
    expect(screen.getByRole("link", { name: /The Matrix/ })).toHaveAttribute("href", "/title/603-the-matrix");
    expect(linkProps).toHaveLength(1);
    expect(linkProps[0].prefetch).toBeUndefined();
  });
});
