import {
  STORAGE_KEY,
  addEntry,
  createWatchlistStore,
  entryFromTitle,
  hasEntry,
  parseWatchlist,
  readWatchlist,
  removeEntry,
  serializeWatchlist,
  writeWatchlist,
  type WatchlistEntry,
} from "./watchlist";

const matrix: WatchlistEntry = {
  id: 603,
  slug: "the-matrix",
  name: "The Matrix",
  year: 1999,
  rating: 8.2,
  posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
};
const inception: WatchlistEntry = { id: 27205, slug: "inception", name: "Inception", year: 2010, rating: 8.4 };

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
  it("is the v2 key", () => {
    expect(STORAGE_KEY).toBe("reelbase:watchlist:v2");
  });
});

describe("entryFromTitle", () => {
  it("keeps only the snapshot fields", () => {
    expect(
      entryFromTitle({
        ...matrix,
        runtime: 136,
        genres: [{ id: 28, name: "Action" }],
        synopsis: "s",
        posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
        director: "Lana Wachowski",
        cast: ["Keanu Reeves"],
      }),
    ).toEqual(matrix);
  });
});

describe("parseWatchlist", () => {
  it("reads a JSON array of entries", () => {
    expect(parseWatchlist(JSON.stringify([matrix, inception]))).toEqual([matrix, inception]);
  });

  it.each([
    ["missing", null],
    ["empty", ""],
    ["not JSON", "{oops"],
    ["an object", JSON.stringify({ entries: [matrix] })],
    ["null", "null"],
    ["v1 slug strings", '["the-lantern-keepers-of-varro"]'],
  ])("reads %s data as empty", (_label, raw) => {
    expect(parseWatchlist(raw)).toEqual([]);
  });

  it("drops malformed entries and keeps the valid ones", () => {
    const raw = JSON.stringify([
      { ...matrix, id: "603" },
      { ...matrix, id: -1 },
      { ...matrix, name: 42 },
      { ...matrix, rating: "high" },
      { ...matrix, year: "1999" },
      { ...matrix, posterPath: "https://evil.example/x.jpg" },
      null,
      inception,
    ]);
    expect(parseWatchlist(raw)).toEqual([inception]);
  });

  it("keeps an entry without a rating", () => {
    const unrated = { id: 1, slug: "untitled", name: "Untitled" };
    expect(parseWatchlist(JSON.stringify([unrated]))).toEqual([unrated]);
  });

  it("drops duplicate ids, keeping the first", () => {
    expect(parseWatchlist(JSON.stringify([matrix, { ...matrix, name: "Dupe" }]))).toEqual([matrix]);
  });

  it("drops unknown fields", () => {
    expect(parseWatchlist(JSON.stringify([{ ...inception, extra: "<script>" }]))).toEqual([inception]);
  });
});

describe("serializeWatchlist", () => {
  it("round-trips through parseWatchlist", () => {
    expect(parseWatchlist(serializeWatchlist([inception, matrix]))).toEqual([inception, matrix]);
  });
});

describe("addEntry / removeEntry / hasEntry", () => {
  it("adds an entry to the end once", () => {
    expect(addEntry([matrix], inception)).toEqual([matrix, inception]);
    expect(addEntry([matrix], { ...matrix, name: "Again" })).toEqual([matrix]);
  });

  it("removes by id and ignores a missing one", () => {
    expect(removeEntry([matrix, inception], 603)).toEqual([inception]);
    expect(removeEntry([matrix], 27205)).toEqual([matrix]);
  });

  it("does not mutate its input", () => {
    const list = [matrix];
    addEntry(list, inception);
    removeEntry(list, 603);
    expect(list).toEqual([matrix]);
  });

  it("reports membership by id", () => {
    expect(hasEntry([matrix], 603)).toBe(true);
    expect(hasEntry([matrix], 27205)).toBe(false);
  });
});

describe("readWatchlist / writeWatchlist", () => {
  it("writes and reads back through storage", () => {
    const storage = new MemoryStorage();
    expect(writeWatchlist(storage, [matrix])).toBe(true);
    expect(readWatchlist(storage)).toEqual([matrix]);
  });

  it("never reads the v1 key", () => {
    const storage = new MemoryStorage();
    storage.setItem("reelbase:watchlist:v1", '["the-lantern-keepers-of-varro"]');
    expect(readWatchlist(storage)).toEqual([]);
  });

  it("reads as empty and reports failure when storage is missing or throws", () => {
    expect(readWatchlist(undefined)).toEqual([]);
    expect(readWatchlist(throwingStorage)).toEqual([]);
    expect(writeWatchlist(undefined, [matrix])).toBe(false);
    expect(writeWatchlist(throwingStorage, [matrix])).toBe(false);
  });
});

describe("createWatchlistStore", () => {
  function setup(storage: Pick<Storage, "getItem" | "setItem"> | undefined = new MemoryStorage()) {
    const target = new EventTarget();
    const store = createWatchlistStore({ getStorage: () => storage, events: target });
    return { store, storage, target };
  }

  it("starts empty and the server snapshot is always empty", () => {
    const { store } = setup();
    expect(store.getSnapshot()).toEqual([]);
    expect(store.getServerSnapshot()).toEqual([]);
  });

  it("returns the same snapshot reference until the data changes", () => {
    const { store } = setup();
    store.add(matrix);
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    store.add(inception);
    expect(store.getSnapshot()).not.toBe(first);
    expect(store.getSnapshot()).toEqual([matrix, inception]);
  });

  it("notifies subscribers on add and remove, and stops after unsubscribe", () => {
    const { store } = setup();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.add(matrix);
    store.remove(603);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.add(matrix);
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
    expect(() => store.add(matrix)).not.toThrow();
    expect(store.getSnapshot()).toEqual([]);
  });

  it("reads corrupt storage as empty and recovers on the next write", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "{oops");
    const { store } = setup(storage);
    expect(store.getSnapshot()).toEqual([]);
    store.add(matrix);
    expect(store.getSnapshot()).toEqual([matrix]);
  });
});
