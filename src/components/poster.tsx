import { posterColors, posterInitials } from "./poster-art";

interface PosterProps {
  slug: string;
  name: string;
  className?: string;
}

/** A generated poster: a gradient and initials derived from the title. Decorative only. */
export function Poster({ slug, name, className = "" }: PosterProps) {
  const { from, to } = posterColors(slug);
  return (
    <div
      aria-hidden="true"
      className={`flex aspect-[2/3] items-center justify-center rounded-md text-4xl font-black tracking-wider text-white/90 shadow-inner ${className}`}
      style={{ backgroundImage: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      {posterInitials(name)}
    </div>
  );
}
