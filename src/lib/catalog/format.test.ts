import { formatRuntime } from "./format";

describe("formatRuntime", () => {
  it("formats hours and minutes", () => {
    expect(formatRuntime(127)).toBe("2h 7m");
  });

  it("drops zero minutes", () => {
    expect(formatRuntime(120)).toBe("2h");
  });

  it("drops zero hours", () => {
    expect(formatRuntime(45)).toBe("45m");
  });
});
