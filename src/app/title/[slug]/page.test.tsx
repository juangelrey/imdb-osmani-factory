import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { listTitles } from "@/lib/catalog/queries";
import TitlePage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("Title page", () => {
  it("pre-renders every slug and nothing else", () => {
    expect(generateStaticParams()).toEqual(listTitles().map(({ slug }) => ({ slug })));
    expect(dynamicParams).toBe(false);
  });

  it("renders the title for a known slug", async () => {
    render(await TitlePage(params("the-lantern-keepers-of-varro")));
    expect(screen.getByRole("heading", { level: 1, name: "The Lantern Keepers of Varro" })).toBeInTheDocument();
  });

  it("names the page after the title", async () => {
    expect(await generateMetadata(params("the-lantern-keepers-of-varro"))).toEqual({
      title: "The Lantern Keepers of Varro · Reelbase",
    });
  });

  it("returns a 404 for an unknown slug", async () => {
    await expect(TitlePage(params("does-not-exist"))).rejects.toThrow("not found");
    expect(notFound).toHaveBeenCalled();
  });
});

describe("Title page watchlist", () => {
  it("offers the watchlist button", async () => {
    render(await TitlePage(params("the-lantern-keepers-of-varro")));
    expect(screen.getByRole("button", { name: "Save to watchlist" })).toBeInTheDocument();
  });
});
