import { posterColors, posterInitials } from "./poster-art";

describe("posterColors", () => {
  it("is deterministic for a slug", () => {
    expect(posterColors("glass-harbor")).toEqual(posterColors("glass-harbor"));
  });

  it("gives different slugs different colours", () => {
    expect(posterColors("glass-harbor")).not.toEqual(posterColors("ember-road"));
  });

  it("returns two valid HSL colours", () => {
    const { from, to } = posterColors("ember-road");
    for (const colour of [from, to]) {
      expect(colour).toMatch(/^hsl\(\d{1,3} \d{1,3}% \d{1,3}%\)$/);
    }
  });
});

describe("posterInitials", () => {
  it("uses the first letters of the first two words", () => {
    expect(posterInitials("Glass Harbor")).toBe("GH");
  });

  it("skips a leading article", () => {
    expect(posterInitials("The Quiet Orbit")).toBe("QO");
  });

  it("keeps the article when it is the only word", () => {
    expect(posterInitials("The")).toBe("T");
  });

  it("uses one letter for a single-word name", () => {
    expect(posterInitials("ember")).toBe("E");
  });

  it("ignores punctuation and extra spaces", () => {
    expect(posterInitials("  “Saltwind”   overture ")).toBe("SO");
  });
});
