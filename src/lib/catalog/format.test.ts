import { formatRuntime } from "./format";

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
