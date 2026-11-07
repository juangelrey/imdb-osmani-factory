import "server-only";
import { TmdbError, tmdbFetch } from "@/lib/tmdb/client";
import type { TmdbMovieDetails } from "@/lib/tmdb/schema";
import { toTitle } from "./map";
import type { Title } from "./types";

/** A movie with credits, or undefined when TMDB does not know the id. Other failures throw. */
export async function getTitle(id: number): Promise<Title | undefined> {
  try {
    return toTitle(await tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, { append_to_response: "credits" }));
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) return undefined;
    throw error;
  }
}
