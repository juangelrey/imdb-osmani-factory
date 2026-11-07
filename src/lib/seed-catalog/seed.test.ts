import seed from "@/data/titles.json";
import { GENRES } from "./types";

const entries = seed as unknown as Record<string, unknown>[];
const REQUIRED_FIELDS = ["slug", "name", "year", "runtime", "genres", "rating", "synopsis", "director", "cast"];
const currentYear = new Date().getFullYear();

const isNonEmptyString = (value: unknown) => typeof value === "string" && value.trim().length > 0;

describe("titles.json seed data", () => {
  it("holds about 50 titles", () => {
    expect(entries.length).toBeGreaterThanOrEqual(45);
    expect(entries.length).toBeLessThanOrEqual(60);
  });

  it("uses a unique slug for every title", () => {
    const slugs = entries.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  describe.each(entries.map((entry, index) => [String(entry.slug ?? `#${index}`), entry]))("%s", (_slug, entry) => {
    it("has exactly the required fields", () => {
      expect(Object.keys(entry).sort()).toEqual([...REQUIRED_FIELDS].sort());
    });

    it("has a kebab-case slug", () => {
      expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    });

    it("has a name, synopsis and director", () => {
      expect(isNonEmptyString(entry.name)).toBe(true);
      expect(isNonEmptyString(entry.synopsis)).toBe(true);
      expect(isNonEmptyString(entry.director)).toBe(true);
    });

    it("has a plausible year and runtime", () => {
      expect(Number.isInteger(entry.year)).toBe(true);
      expect(entry.year).toBeGreaterThanOrEqual(1920);
      expect(entry.year).toBeLessThanOrEqual(currentYear);
      expect(Number.isInteger(entry.runtime)).toBe(true);
      expect(entry.runtime).toBeGreaterThanOrEqual(60);
      expect(entry.runtime).toBeLessThanOrEqual(240);
    });

    it("has a rating from 0 to 10 with one decimal at most", () => {
      expect(typeof entry.rating).toBe("number");
      expect(entry.rating).toBeGreaterThanOrEqual(0);
      expect(entry.rating).toBeLessThanOrEqual(10);
      expect(Math.round((entry.rating as number) * 10) / 10).toBe(entry.rating);
    });

    it("has one to three known genres without repeats", () => {
      const genres = entry.genres as unknown[];
      expect(Array.isArray(genres)).toBe(true);
      expect(genres.length).toBeGreaterThanOrEqual(1);
      expect(genres.length).toBeLessThanOrEqual(3);
      expect(new Set(genres).size).toBe(genres.length);
      for (const genre of genres) expect(GENRES).toContain(genre);
    });

    it("has a cast of named people", () => {
      const cast = entry.cast as unknown[];
      expect(Array.isArray(cast)).toBe(true);
      expect(cast.length).toBeGreaterThanOrEqual(2);
      expect(cast.every(isNonEmptyString)).toBe(true);
    });
  });
});
