import {
  STORAGE_KEY,
  addSlug,
  createWatchlistStore,
  hasSlug,
  parseWatchlist,
  readWatchlist,
  removeSlug,
  serializeWatchlist,
  writeWatchlist,
} from "./watchlist";

const known = new Set(["glass-harbor", "ember-road", "the-quiet-orbit"]);

class MemoryStorage implements Pick<Storage, "getItem" | "setItem"> {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

const throwingStorage: Pick<Storage, "getItem" | "setItem"> = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("QuotaExceededError");
  },
};

describe("STORAGE_KEY", () => {
  it("is versioned", () => {
    expect(STORAGE_KEY).toBe("reelbase:watchlist:v1");
  });
});

describe("parseWatchlist", () => {
  it("reads a JSON array of known slugs", () => {
    expect(parseWatchlist('["ember-road","glass-harbor"]', known)).toEqual(["ember-road", "glass-harbor"]);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["not JSON", "{oops"],
    ["an object", '{"slugs":["ember-road"]}'],
    ["a string", '"ember-road"'],
    ["null", "null"],
    ["a number", "42"],
  ])("reads %s data as empty", (_label, raw) => {
    expect(parseWatchlist(raw, known)).toEqual([]);
  });

  it("keeps any string slug when no known set is given", () => {
    expect(parseWatchlist('["anything",3,"anything"]')).toEqual(["anything"]);
  });

  it("drops non-strings, unknown slugs and duplicates", () => {
    expect(parseWatchlist('["ember-road",7,null,"gone","ember-road",{"a":1}]', known)).toEqual(["ember-road"]);
  });
});

describe("serializeWatchlist", () => {
  it("round-trips through parseWatchlist", () => {
    const slugs = ["the-quiet-orbit", "ember-road"];
    expect(parseWatchlist(serializeWatchlist(slugs), known)).toEqual(slugs);
  });
});

describe("addSlug / removeSlug / hasSlug", () => {
  it("adds a slug to the end once", () => {
    expect(addSlug(["ember-road"], "glass-harbor")).toEqual(["ember-road", "glass-harbor"]);
    expect(addSlug(["ember-road"], "ember-road")).toEqual(["ember-road"]);
  });

  it("removes a slug and ignores a missing one", () => {
    expect(removeSlug(["ember-road", "glass-harbor"], "ember-road")).toEqual(["glass-harbor"]);
    expect(removeSlug(["ember-road"], "glass-harbor")).toEqual(["ember-road"]);
  });

  it("does not mutate its input", () => {
    const list = ["ember-road"];
    addSlug(list, "glass-harbor");
    removeSlug(list, "ember-road");
    expect(list).toEqual(["ember-road"]);
  });

  it("reports membership", () => {
    expect(hasSlug(["ember-road"], "ember-road")).toBe(true);
    expect(hasSlug(["ember-road"], "glass-harbor")).toBe(false);
  });
});

describe("readWatchlist / writeWatchlist", () => {
  it("writes and reads back through storage", () => {
    const storage = new MemoryStorage();
    expect(writeWatchlist(storage, ["glass-harbor"])).toBe(true);
    expect(storage.getItem(STORAGE_KEY)).toBe('["glass-harbor"]');
    expect(readWatchlist(storage, known)).toEqual(["glass-harbor"]);
  });

  it("reads as empty and reports failure when storage is missing or throws", () => {
    expect(readWatchlist(undefined, known)).toEqual([]);
    expect(readWatchlist(throwingStorage, known)).toEqual([]);
    expect(writeWatchlist(undefined, ["ember-road"])).toBe(false);
    expect(writeWatchlist(throwingStorage, ["ember-road"])).toBe(false);
  });
});

describe("createWatchlistStore", () => {
  function setup(storage: Pick<Storage, "getItem" | "setItem"> | undefined = new MemoryStorage()) {
    const target = new EventTarget();
    const store = createWatchlistStore({ getStorage: () => storage, knownSlugs: known, events: target });
    return { store, storage, target };
  }

  it("starts empty and the server snapshot is always empty", () => {
    const { store } = setup();
    expect(store.getSnapshot()).toEqual([]);
    expect(store.getServerSnapshot()).toEqual([]);
  });

  it("returns the same snapshot reference until the data changes", () => {
    const { store } = setup();
    store.add("ember-road");
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    store.add("glass-harbor");
    expect(store.getSnapshot()).not.toBe(first);
    expect(store.getSnapshot()).toEqual(["ember-road", "glass-harbor"]);
  });

  it("notifies subscribers on add and remove, and stops after unsubscribe", () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.add("ember-road");
    store.remove("ember-road");
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.add("ember-road");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies subscribers when another tab changes the key", () => {
    const { store, target } = setup();
    const listener = vi.fn();
    store.subscribe(listener);
    target.dispatchEvent(Object.assign(new Event("storage"), { key: "other" }));
    expect(listener).not.toHaveBeenCalled();
    target.dispatchEvent(Object.assign(new Event("storage"), { key: STORAGE_KEY }));
    target.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("does not throw and reads as empty when storage throws", () => {
    const { store } = setup(throwingStorage);
    expect(() => store.add("ember-road")).not.toThrow();
    expect(store.getSnapshot()).toEqual([]);
  });

  it("reads corrupt storage as empty", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{oops");
    const { store } = setup(storage);
    expect(store.getSnapshot()).toEqual([]);
    store.add("ember-road");
    expect(store.getSnapshot()).toEqual(["ember-road"]);
  });
});
