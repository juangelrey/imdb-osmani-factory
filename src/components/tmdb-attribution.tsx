const TMDB_URL = "https://www.themoviedb.org/";

/** The attribution TMDB's API terms require on every page. */
export function TmdbAttribution() {
  return (
    <p className="flex flex-wrap items-center justify-center gap-2">
      <a
        href={TMDB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold tracking-wide text-sky-400 hover:text-sky-300"
      >
        TMDB
      </a>
      <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
    </p>
  );
}
