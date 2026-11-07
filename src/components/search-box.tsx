export function SearchBox() {
  return (
    <form role="search" action="/search" method="get" className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
      <label htmlFor="site-search" className="sr-only">
        Search titles
      </label>
      <input
        id="site-search"
        type="search"
        name="q"
        placeholder="Search titles"
        autoComplete="off"
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none sm:max-w-xs"
      />
    </form>
  );
}
