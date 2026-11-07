import Image from "next/image";
import { posterColors, posterInitials } from "./poster-art";

const SIZES = {
  grid: { width: 342, height: 513 },
  detail: { width: 500, height: 750 },
} as const;

interface PosterProps {
  /** Seeds the fallback gradient. */
  colorKey: string;
  name: string;
  posterUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** The TMDB poster, or a generated gradient with initials when there is none. Decorative only. */
export function Poster({ colorKey, name, posterUrl, size = "grid", className = "" }: PosterProps) {
  if (posterUrl) {
    return (
      <Image
        src={posterUrl}
        alt=""
        {...SIZES[size]}
        unoptimized
        loading={size === "detail" ? "eager" : "lazy"}
        className={`aspect-[2/3] h-auto w-full rounded-md bg-zinc-800 object-cover ${className}`}
      />
    );
  }

  const { from, to } = posterColors(colorKey);
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
