import { DEFAULT_SEARCH_SORT, SEARCH_SORT_KEYS, parseSearchSort } from "./search-params";

describe("parseSearchSort", () => {
  it("reads each search sort key", () => {
    expect(parseSearchSort("relevance")).toBe("relevance");
    expect(parseSearchSort("recency")).toBe("recency");
    expect(parseSearchSort(["relevance", "recency"])).toBe("relevance");
  });

  it("reads a missing or invalid sort as Recency", () => {
    expect(DEFAULT_SEARCH_SORT).toBe("recency");
    expect(parseSearchSort(undefined)).toBe("recency");
    expect(parseSearchSort("")).toBe("recency");
    expect(parseSearchSort("popularity")).toBe("recency");
    expect(parseSearchSort("RELEVANCE")).toBe("recency");
  });

  it("lists Recency first, as the default", () => {
    expect(SEARCH_SORT_KEYS[0]).toBe("recency");
    expect(SEARCH_SORT_KEYS).toContain("relevance");
  });
});
