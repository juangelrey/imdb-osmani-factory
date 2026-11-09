import regions from "@/lib/tmdb/fixtures/watch-provider-regions.json";
import { listRegions, resolveRegion } from "./regions";

const known = ["US", "ES", "GB", "DE", "FR"];

describe("resolveRegion", () => {
  it("uses the URL region over the cookie and the browser language", () => {
    expect(resolveRegion({ param: "ES", cookie: "GB", acceptLanguage: "de-DE" }, known)).toBe("ES");
  });

  it("uses the cookie when the URL has no region", () => {
    expect(resolveRegion({ cookie: "GB", acceptLanguage: "de-DE" }, known)).toBe("GB");
  });

  it("uses the browser language's country when there is no URL region or cookie", () => {
    expect(resolveRegion({ acceptLanguage: "es-ES" }, known)).toBe("ES");
  });

  it("falls back to US when nothing names a region", () => {
    expect(resolveRegion({}, known)).toBe("US");
  });

  it("takes GB from en-GB,en;q=0.9", () => {
    expect(resolveRegion({ acceptLanguage: "en-GB,en;q=0.9" }, known)).toBe("GB");
  });

  it("gives US for plain en, which names no country", () => {
    expect(resolveRegion({ acceptLanguage: "en" }, known)).toBe("US");
  });

  it("uses the first language tag that has a country", () => {
    expect(resolveRegion({ acceptLanguage: "en, fr-FR;q=0.8, de-DE;q=0.5" }, known)).toBe("FR");
  });

  it("skips a lowercase URL region and falls through to the cookie", () => {
    expect(resolveRegion({ param: "es", cookie: "GB" }, known)).toBe("GB");
  });

  it("skips malformed URL regions", () => {
    expect(resolveRegion({ param: "ESP", cookie: "GB" }, known)).toBe("GB");
    expect(resolveRegion({ param: "e1", cookie: "GB" }, known)).toBe("GB");
  });

  it("skips an unlisted URL region", () => {
    expect(resolveRegion({ param: "ZZ", cookie: "GB" }, known)).toBe("GB");
  });

  it("skips lowercase, malformed and unlisted cookies", () => {
    expect(resolveRegion({ cookie: "gb", acceptLanguage: "es-ES" }, known)).toBe("ES");
    expect(resolveRegion({ cookie: "ESP", acceptLanguage: "es-ES" }, known)).toBe("ES");
    expect(resolveRegion({ cookie: "e1", acceptLanguage: "es-ES" }, known)).toBe("ES");
    expect(resolveRegion({ cookie: "ZZ", acceptLanguage: "es-ES" }, known)).toBe("ES");
  });

  it("skips browser languages whose country is malformed or unlisted", () => {
    expect(resolveRegion({ acceptLanguage: "es-419" }, known)).toBe("US");
    expect(resolveRegion({ acceptLanguage: "pt-BR" }, known)).toBe("US");
  });

  it("skips an unlisted browser-language country for a later listed one", () => {
    expect(resolveRegion({ acceptLanguage: "pt-BR, es-ES;q=0.8" }, known)).toBe("ES");
  });

  it("reads a lowercase country in the browser language, since language tags are case-insensitive", () => {
    expect(resolveRegion({ acceptLanguage: "en-gb" }, known)).toBe("GB");
  });
});

describe("listRegions", () => {
  function stubFetch(body: unknown) {
    const fetchMock = vi.fn(async () => Response.json(body));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  function requestedUrl(fetchMock: { mock: { calls: unknown[][] } }) {
    return new URL(String(fetchMock.mock.calls[0][0]));
  }

  beforeEach(() => {
    vi.stubEnv("TMDB_READ_ACCESS_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fetches TMDB's watch-provider regions", async () => {
    const fetchMock = stubFetch(regions);
    await listRegions();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl(fetchMock).pathname).toBe("/3/watch/providers/regions");
  });

  it("maps each region to its code and English name, sorted A-Z by name", async () => {
    stubFetch(regions);
    expect(await listRegions()).toEqual([
      { code: "AR", name: "Argentina" },
      { code: "BR", name: "Brazil" },
      { code: "FR", name: "France" },
      { code: "DE", name: "Germany" },
      { code: "ES", name: "Spain" },
      { code: "GB", name: "United Kingdom" },
      { code: "US", name: "United States of America" },
    ]);
  });
});
