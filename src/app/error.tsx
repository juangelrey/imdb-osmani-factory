"use client";

import Link from "next/link";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

export default function ErrorPage({ retry }: ErrorPageProps) {
  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-2xl font-bold">Something went wrong loading movies</h1>
      <p className="text-zinc-400">The movie database may be busy or unavailable. Try again in a moment.</p>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
        >
          Try again
        </button>
        <Link href="/" className="text-sm font-semibold text-amber-400 hover:text-amber-300">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
