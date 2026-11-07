import "server-only";

const BASE_URL = "https://api.themoviedb.org/3";

/** How long TMDB responses stay in the Next.js fetch cache. */
export const TMDB_REVALIDATE_SECONDS = 3600;

export type TmdbParams = Record<string, string | number | boolean | undefined>;

/** A failed TMDB request. `status` is undefined when no response arrived. Never carries the token. */
export class TmdbError extends Error {
  constructor(
    readonly path: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(
      status === undefined ? `TMDB request to ${path} failed` : `TMDB request to ${path} failed with status ${status}`,
      options,
    );
    this.name = "TmdbError";
  }
}

function readToken(): string {
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("TMDB_READ_ACCESS_TOKEN is not set. Add the TMDB v4 Read Access Token to the environment.");
  }
  return token;
}

function buildUrl(path: string, params: TmdbParams): URL {
  const url = new URL(BASE_URL + path);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url;
}

/** GET a TMDB v3 endpoint on the server, cached for an hour. */
export async function tmdbFetch<T>(path: string, params: TmdbParams = {}): Promise<T> {
  const token = readToken();
  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: TMDB_REVALIDATE_SECONDS },
    });
  } catch (cause) {
    throw new TmdbError(path, undefined, { cause });
  }
  if (!response.ok) throw new TmdbError(path, response.status);
  return (await response.json()) as T;
}
