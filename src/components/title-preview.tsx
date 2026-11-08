"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Poster } from "./poster";

/** How long the pointer rests on a thumbnail before its card opens. */
const OPEN_DELAY_MS = 300;
/** Grace time for the pointer to cross from the thumbnail into the card. */
const CLOSE_DELAY_MS = 150;
/** Gap between the thumbnail and the card, and the card's distance from the viewport edge. */
const GAP_PX = 12;
const EDGE_PX = 16;

/** Closes the card that is open now, so opening another one closes it: one card at a time. */
let closeOpenCard: (() => void) | undefined;

interface TitlePreviewProps {
  /** The thumbnail, which becomes the card's trigger. */
  children: ReactNode;
  /** Seeds the fallback gradient. */
  colorKey: string;
  name: string;
  /** The title page the card's "Open" link goes to. */
  href: string;
  year?: number;
  rating?: number;
  synopsis?: string;
  /** The w185 poster. */
  posterUrl?: string;
}

/**
 * A thumbnail that opens a floating preview card on hover (after about 300 ms), on focus and on
 * tap. The card is a native `popover="auto"` in the top layer, so it never shifts the layout; it is
 * placed with CSS anchor positioning where supported, else by `placeCard`. Escape, a click
 * outside, the pointer leaving, or focus moving past it closes the card.
 */
export function TitlePreview({ children, colorKey, name, href, year, rating, synopsis, posterUrl }: TitlePreviewProps) {
  const id = useId();
  const anchor = `--preview-${id.replace(/[^a-zA-Z0-9-]/g, "")}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false);

  const clearTimer = () => clearTimeout(timer.current);
  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);
  const show = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(true);
  }, []);

  // One card at a time; and the open card listens for Escape and clicks outside. A native auto
  // popover does both too, but browsers without the Popover API rely on these.
  useEffect(() => {
    if (!open) return;
    if (closeOpenCard !== close) closeOpenCard?.();
    closeOpenCard = close;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      triggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !cardRef.current?.contains(target)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      if (closeOpenCard === close) closeOpenCard = undefined;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  // Promote the card to the top layer as a `popover="auto"`, and follow the browser when it light-dismisses it.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const trigger = triggerRef.current;
    if (!open || !card || !trigger) return;
    // Set imperatively: where the Popover API is missing, a `popover` attribute would hide the card.
    if (typeof card.showPopover === "function" && !card.matches(":popover-open")) {
      card.popover = "auto";
      card.showPopover();
    }
    if (!supportsAnchors()) placeCard(card, trigger);
    const onToggle = (event: Event) => {
      if ((event as ToggleEvent).newState === "closed") close();
    };
    card.addEventListener("toggle", onToggle);
    return () => card.removeEventListener("toggle", onToggle);
  }, [open, close]);

  useEffect(() => clearTimer, []);

  const onPointerEnter = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearTimer();
    if (!open) timer.current = setTimeout(show, OPEN_DELAY_MS);
  };
  const onPointerLeave = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearTimer();
    if (open) timer.current = setTimeout(close, CLOSE_DELAY_MS);
  };
  const onBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && !event.currentTarget.contains(next)) close();
  };
  const hoverHandlers = { onPointerEnter, onPointerLeave };

  return (
    <span className="shrink-0" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Preview ${name}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-card` : undefined}
        onFocus={show}
        onClick={show}
        {...hoverHandlers}
        style={{ anchorName: anchor } as React.CSSProperties}
        className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        {children}
      </button>
      {open && (
        <div
          ref={cardRef}
          id={`${id}-card`}
          role="dialog"
          aria-labelledby={`${id}-name`}
          {...hoverHandlers}
          style={{ positionAnchor: anchor } as React.CSSProperties}
          className="title-preview z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-zinc-100 shadow-xl shadow-black/50"
        >
          <div className="flex gap-3">
            <Poster colorKey={colorKey} name={name} posterUrl={posterUrl} size="preview" className="w-24 shrink-0" />
            <div className="min-w-0 space-y-1.5">
              <p id={`${id}-name`} className="font-semibold leading-snug break-words">
                {name}
              </p>
              {(year !== undefined || rating !== undefined) && (
                <p data-facts className="flex gap-3 text-xs text-zinc-400">
                  {year !== undefined && <span>{year}</span>}
                  {rating !== undefined && (
                    <span>
                      <span className="sr-only">Rating {rating.toFixed(1)} out of 10</span>
                      <span aria-hidden="true">★ {rating.toFixed(1)}</span>
                    </span>
                  )}
                </p>
              )}
              {synopsis && (
                <p data-synopsis className="line-clamp-4 text-xs leading-relaxed text-zinc-300">
                  {synopsis}
                </p>
              )}
              <Link
                href={href}
                className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                Open
              </Link>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

function supportsAnchors(): boolean {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("anchor-name: --a");
}

/**
 * Fallback placement for browsers without CSS anchor positioning: to the right of the thumbnail,
 * else below or above it, always clamped inside the viewport. The card is `position: fixed`.
 */
function placeCard(card: HTMLElement, trigger: HTMLElement) {
  const t = trigger.getBoundingClientRect();
  const { width, height } = card.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const clamp = (value: number, max: number) => Math.max(EDGE_PX, Math.min(value, max - EDGE_PX));

  let left: number;
  let top: number;
  if (t.right + GAP_PX + width <= vw - EDGE_PX) {
    left = t.right + GAP_PX;
    top = clamp(t.top, vh - height);
  } else {
    left = clamp(t.left + t.width / 2 - width / 2, vw - width);
    top = t.bottom + GAP_PX + height <= vh - EDGE_PX ? t.bottom + GAP_PX : t.top - GAP_PX - height;
    top = clamp(top, vh - height);
  }
  card.style.left = `${left}px`;
  card.style.top = `${top}px`;
}
