import { THEME_SCRIPT, THEME_STORAGE_KEY, parseThemeChoice, resolveTheme } from "./theme";

describe("THEME_STORAGE_KEY", () => {
  it("is namespaced like the watchlist key", () => {
    expect(THEME_STORAGE_KEY).toBe("reelbase:theme");
  });
});

describe("parseThemeChoice", () => {
  it.each(["system", "light", "dark"])("keeps the valid choice %s", (choice) => {
    expect(parseThemeChoice(choice)).toBe(choice);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["unknown", "sepia"],
    ["differently cased", "Dark"],
    ["not a string", 1],
  ])("reads a %s value as system", (_label, raw) => {
    expect(parseThemeChoice(raw)).toBe("system");
  });
});

describe("resolveTheme", () => {
  it("uses a stored light choice over a dark OS", () => {
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("uses a stored dark choice over a light OS", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows a light OS for the system choice", () => {
    expect(resolveTheme("system", true)).toBe("light");
  });

  it("follows a dark OS, or one with no preference, for the system choice", () => {
    expect(resolveTheme("system", false)).toBe("dark");
  });

  it("follows the OS when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("light");
  });

  it("treats an invalid stored value as system", () => {
    expect(resolveTheme("sepia", true)).toBe("light");
    expect(resolveTheme("sepia", false)).toBe("dark");
  });
});

/** Runs the inline <head> script against a stubbed storage and OS preference, returning the `data-theme` it sets. */
function runThemeScript({ stored, osPrefersLight, storageThrows = false }: {
  stored: string | null;
  osPrefersLight: boolean;
  storageThrows?: boolean;
}) {
  document.documentElement.removeAttribute("data-theme");
  const storage = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error("SecurityError");
      return key === THEME_STORAGE_KEY ? stored : null;
    },
  };
  const matchMedia = (query: string) => ({ matches: query === "(prefers-color-scheme: light)" && osPrefersLight });
  new Function("localStorage", "matchMedia", "document", THEME_SCRIPT)(storage, matchMedia, document);
  return document.documentElement.getAttribute("data-theme");
}

describe("THEME_SCRIPT", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it.each([
    ["light", false],
    ["dark", true],
    ["system", true],
    ["system", false],
    [null, true],
    [null, false],
    ["sepia", true],
  ] as const)("sets the same theme as resolveTheme for stored %s and a light OS %s", (stored, osPrefersLight) => {
    expect(runThemeScript({ stored, osPrefersLight })).toBe(resolveTheme(stored, osPrefersLight));
  });

  it("follows the OS when storage is unreadable", () => {
    expect(runThemeScript({ stored: "dark", osPrefersLight: true, storageThrows: true })).toBe("light");
  });

  it("is a static script with no interpolated values beyond its own constants", () => {
    expect(THEME_SCRIPT).not.toMatch(/<\/script/i);
    expect(THEME_SCRIPT).toContain(JSON.stringify(THEME_STORAGE_KEY));
  });
});
