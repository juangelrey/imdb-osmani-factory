import { ageOn, formatDate, formatRuntime } from "./format";

describe("formatRuntime", () => {
  it("formats hours and minutes", () => {
    expect(formatRuntime(127)).toBe("2h 7m");
  });

  it("drops zero minutes", () => {
    expect(formatRuntime(120)).toBe("2h");
  });

  it("shows 0m for a zero runtime", () => {
    expect(formatRuntime(0)).toBe("0m");
  });

  it("drops zero hours", () => {
    expect(formatRuntime(45)).toBe("45m");
  });
});

describe("formatDate", () => {
  it("formats a TMDB date in UTC, whatever the local time zone", () => {
    expect(formatDate("1930-05-31")).toBe("May 31, 1930");
    expect(formatDate("2024-01-01")).toBe("January 1, 2024");
  });

  it.each(["", "1930", "1930-5-31", "1930-02-30", "not a date"])("returns undefined for %j", (date) => {
    expect(formatDate(date)).toBeUndefined();
  });
});

describe("ageOn", () => {
  it("counts whole years between two dates", () => {
    expect(ageOn("1930-05-31", "2026-11-07")).toBe(96);
  });

  it("turns a year older on the birthday, not before", () => {
    expect(ageOn("1930-05-31", "2026-05-30")).toBe(95);
    expect(ageOn("1930-05-31", "2026-05-31")).toBe(96);
  });

  it("returns undefined for an invalid date or an end before the start", () => {
    expect(ageOn("", "2026-11-07")).toBeUndefined();
    expect(ageOn("1930-05-31", "1920-01-01")).toBeUndefined();
  });
});
