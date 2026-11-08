import { DEFAULT_SEARCH_SORT, SEARCH_KINDS, SEARCH_SORT_KEYS, parseSearchKind, parseSearchSort } from "./search-params";

describe("parseSearchSort", () => {
  it("reads each search sort key", () => {
    expect(parseSearchSort("relevance")).toBe("relevance");
    expect(parseSearchSort("recency")).toBe("recency");
    expect(parseSearchSort("rating")).toBe("rating");
    expect(parseSearchSort(["relevance", "recency"])).toBe("relevance");
  });

  it("reads a missing or invalid sort as Recency", () => {
    expect(DEFAULT_SEARCH_SORT).toBe("recency");
    expect(parseSearchSort(undefined)).toBe("recency");
    expect(parseSearchSort("")).toBe("recency");
    expect(parseSearchSort("popularity")).toBe("recency");
    expect(parseSearchSort("RELEVANCE")).toBe("recency");
  });

  it("lists Recency first, as the default, then Rating and Relevance", () => {
    expect(SEARCH_SORT_KEYS).toEqual(["recency", "rating", "relevance"]);
  });
});

describe("parseSearchKind", () => {
  it("reads tv and person", () => {
    expect(parseSearchKind("tv")).toBe("tv");
    expect(parseSearchKind("person")).toBe("person");
    expect(parseSearchKind(["person", "tv"])).toBe("person");
  });

  it("reads a missing or invalid type as movie", () => {
    expect(parseSearchKind(undefined)).toBe("movie");
    expect(parseSearchKind("movie")).toBe("movie");
    expect(parseSearchKind("")).toBe("movie");
    expect(parseSearchKind("people")).toBe("movie");
    expect(parseSearchKind("PERSON")).toBe("movie");
  });

  it("lists Movies, TV and People in that order", () => {
    expect(SEARCH_KINDS).toEqual(["movie", "tv", "person"]);
  });
});
