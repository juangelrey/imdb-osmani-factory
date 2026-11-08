import Image from "next/image";
import { ViewTransition, type ReactElement } from "react";
import type { TitleKind } from "@/lib/catalog/types";
import { posterColors, posterInitials } from "./poster-art";

const SIZES = {
  grid: { width: 342, height: 513 },
  detail: { width: 500, height: 750 },
  /** A TMDB h632 profile photo. */
  profile: { width: 421, height: 632 },
  /** A TMDB w92 poster, for career timeline rows. */
  thumb: { width: 92, height: 138 },
  /** A TMDB w185 poster, for the career preview card. */
  preview: { width: 185, height: 278 },
} as const;

/**
 * Sizes that fill their container. A thumbnail or preview has no built-in width, so the caller's width
 * class applies; with both, Tailwind's `w-full` would win and the thumbnail would stretch.
 */
const FILL: ReadonlySet<keyof typeof SIZES> = new Set(["grid", "detail", "profile"]);

/** Sizes shown in long lists, below the fold: their images load lazily. */
const LAZY: ReadonlySet<keyof typeof SIZES> = new Set(["grid", "thumb", "preview"]);

interface PosterProps {
  /** Seeds the fallback gradient. */
  colorKey: string;
  name: string;
  posterUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Alt text, for an image that is content rather than decoration (a profile photo). */
  alt?: string;
  /**
   * Names the poster for the shared-element morph: a grid card and the detail page with the same name morph into
   * each other on navigation. It must be unique on the page, so build it with `posterTransitionName`.
   */
  transitionName?: string;
}

/** The morph name for a title's poster. Kind and id, because a movie and a show can share a TMDB id. */
export function posterTransitionName(kind: TitleKind, id: number): string {
  return `poster-${kind}-${id}`;
}

/**
 * The TMDB poster, or a generated gradient with initials when there is none.
 * Decorative unless `alt` is given; then the image or gradient is announced with that text.
 */
export function Poster({ transitionName, ...props }: PosterProps) {
  const poster = <PosterArt {...props} />;
  if (!transitionName) return poster;
  // `default="none"` keeps the poster out of unrelated transitions; the explicit `share` keeps the morph.
  return (
    <ViewTransition name={transitionName} share="morph" default="none">
      {poster}
    </ViewTransition>
  );
}

function PosterArt({
  colorKey,
  name,
  posterUrl,
  size = "grid",
  className = "",
  alt,
}: Omit<PosterProps, "transitionName">): ReactElement {
  if (posterUrl) {
    return (
      <Image
        src={posterUrl}
        alt={alt ?? ""}
        {...SIZES[size]}
        unoptimized
        loading={LAZY.has(size) ? "lazy" : "eager"}
        className={`aspect-[2/3] h-auto ${FILL.has(size) ? "w-full" : ""} rounded-md bg-zinc-800 object-cover ${className}`}
      />
    );
  }

  const { from, to } = posterColors(colorKey);
  return (
    <div
      {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
      className={`flex aspect-[2/3] items-center justify-center rounded-md ${size === "thumb" ? "text-xs" : size === "preview" ? "text-2xl" : "text-4xl"} font-black tracking-wider text-white/90 shadow-inner ${className}`}
      style={{ backgroundImage: `linear-gradient(160deg, ${from}, ${to})` }}
    >
      {posterInitials(name)}
    </div>
  );
}
