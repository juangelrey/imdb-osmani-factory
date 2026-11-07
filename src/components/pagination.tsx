import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

const linkClass = "rounded-md border border-zinc-700 px-3 py-1 text-zinc-200 hover:border-amber-400 hover:text-amber-300";

export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm text-zinc-400">
      <span className="min-w-20">
        {page > 1 && (
          <Link href={hrefForPage(page - 1)} rel="prev" className={linkClass}>
            ← Previous
          </Link>
        )}
      </span>
      <span>
        Page {page} of {totalPages}
      </span>
      <span className="min-w-20 text-right">
        {page < totalPages && (
          <Link href={hrefForPage(page + 1)} rel="next" className={linkClass}>
            Next →
          </Link>
        )}
      </span>
    </nav>
  );
}
