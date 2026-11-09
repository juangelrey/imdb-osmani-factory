import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BrowseState } from "@/lib/catalog/browse-params";
import { RegionSelect } from "./region-select";

// Already A-Z by name, as `listRegions` returns them.
const regions = [
  { code: "ES", name: "Spain" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States of America" },
];

const state: BrowseState = { kind: "movie", genres: [], region: "US", regionFromUrl: false, providers: [], sort: "popularity", page: 1 };

function form() {
  return screen.getByRole("form", { name: "Region" });
}

function hiddenFields() {
  return Array.from(form().querySelectorAll<HTMLInputElement>('input[type="hidden"]')).map(({ name, value }) => [name, value]);
}

describe("RegionSelect", () => {
  it("is a labelled GET form to /region listing regions A-Z with the current one selected", () => {
    render(<RegionSelect regions={regions} state={{ ...state, region: "GB" }} />);
    expect(form()).toHaveAttribute("action", "/region");
    expect(form()).toHaveAttribute("method", "get");
    const select = screen.getByRole("combobox", { name: "Region" });
    expect(select).toHaveAttribute("name", "region");
    expect(select).toHaveValue("GB");
    expect(within(select).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Spain",
      "United Kingdom",
      "United States of America",
    ]);
    expect(within(form()).getByRole("button", { name: "Apply" })).toHaveAttribute("type", "submit");
  });

  it("carries the current genres, type and sort as hidden fields, without page or region", () => {
    render(
      <RegionSelect
        regions={regions}
        state={{ kind: "tv", genres: [18, 35], region: "ES", regionFromUrl: true, providers: [], sort: "rating", page: 4 }}
      />,
    );
    expect(hiddenFields()).toEqual([
      ["type", "tv"],
      ["genre", "18,35"],
      ["sort", "rating"],
    ]);
  });

  it("carries every selected service, so the new region's page decides which to keep", () => {
    render(<RegionSelect regions={regions} state={{ ...state, genres: [28], providers: [8, 15, 337] }} />);
    expect(hiddenFields()).toEqual([
      ["genre", "28"],
      ["providers", "8,15,337"],
    ]);
  });

  it("carries nothing for the default movie browse", () => {
    render(<RegionSelect regions={regions} state={{ ...state, page: 3 }} />);
    expect(hiddenFields()).toEqual([]);
    expect(screen.getByRole("combobox", { name: "Region" })).toHaveValue("US");
  });

  it("submits as soon as a region is chosen", async () => {
    const user = userEvent.setup();
    render(<RegionSelect regions={regions} state={state} />);
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    form().addEventListener("submit", submit);
    await user.selectOptions(screen.getByRole("combobox", { name: "Region" }), "ES");
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
