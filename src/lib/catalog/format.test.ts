import { ageOn, formatDate, formatRuntime, formatShortDate, truncateText } from "./format";

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

describe("formatShortDate", () => {
  it("formats a TMDB date as day, short month and year, in UTC", () => {
    expect(formatShortDate("2018-03-21")).toBe("21 Mar 2018");
    expect(formatShortDate("1992-08-07")).toBe("7 Aug 1992");
    expect(formatShortDate("2024-09-01")).toBe("1 Sep 2024");
    expect(formatShortDate("2024-12-31")).toBe("31 Dec 2024");
  });

  it.each(["", "2018", "2018-3-21", "2018-02-30", "not a date"])("returns undefined for %j", (date) => {
    expect(formatShortDate(date)).toBeUndefined();
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

describe("truncateText", () => {
  it("keeps text within the limit as it is", () => {
    expect(truncateText("A short synopsis.", 300)).toBe("A short synopsis.");
    expect(truncateText("x".repeat(300), 300)).toBe("x".repeat(300));
  });

  it("cuts longer text at the last word boundary within the limit and adds an ellipsis", () => {
    expect(truncateText("One two three four", 12)).toBe("One two…");
    expect(truncateText("One two, three four", 9)).toBe("One two…");
    const long = "word ".repeat(100).trim();
    const cut = truncateText(long, 300);
    expect(cut.length).toBeLessThanOrEqual(301);
    expect(cut).toMatch(/word…$/);
  });

  it("cuts mid-word when the first word alone is longer than the limit", () => {
    expect(truncateText("Supercalifragilistic", 5)).toBe("Super…");
  });
});

