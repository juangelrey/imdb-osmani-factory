import Image from "next/image";
import { posterColors, posterInitials } from "./poster-art";

const SIZES = {
  grid: { width: 342, height: 513 },
  detail: { width: 500, height: 750 },
  /** A TMDB h632 profile photo. */
  profile: { width: 421, height: 632 },
} as const;

interface PosterProps {
  /** Seeds the fallback gradient. */
  colorKey: string;
  name: string;
  posterUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Alt text, for an image that is content rather than decoration (a profile photo). */
  alt?: string;
}

/**
 * The TMDB poster, or a generated gradient with initials when there is none.
 * Decorative unless `alt` is given; then the image or gradient is announced with that text.
 */
export function Poster({ colorKey, name, posterUrl, size = "grid", className = "", alt }: PosterProps) {
  if (posterUrl) {
    return (
      <Image
        src={posterUrl}
        alt={alt ?? ""}
        {...SIZES[size]}
        unoptimized
        loading={size === "grid" ? "lazy" : "eager"}
        className={`aspect-[2/3] h-auto w-full rounded-md bg-zinc-800 object-cover ${className}`}
      />
    );
  }

  const { from, to } = posterColors(colorKey);
  return (
    <div
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      className={`flex aspect-[2/3] items-center justify-center rounded-md text-4xl font-black tracking-wider text-white/90 shadow-inner ${className}`}
      style={{ backgroundImage: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      {posterInitials(name)}
    </div>
  );
}
