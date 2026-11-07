import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-zinc-400">We couldn&apos;t find what you were looking for.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded bg-amber-400 px-4 py-2 font-semibold text-zinc-950 hover:bg-amber-300"
      >
        Back to all titles
      </Link>
    </section>
  );
}
