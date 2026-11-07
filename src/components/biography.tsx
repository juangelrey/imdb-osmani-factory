"use client";

import { useEffect, useId, useRef, useState } from "react";

interface BiographyProps {
  text: string;
}

/**
 * The biography clamped to about 4 lines, with TMDB's paragraph breaks kept.
 * A Read more / Show less toggle appears only when the clamped text overflows.
 */
export function Biography({ text }: BiographyProps) {
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    // Measure only while clamped; expanded text never overflows, but the toggle must stay.
    if (expanded) return;
    const measure = () => {
      const el = ref.current;
      if (el) setOverflows(el.scrollHeight > el.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [expanded, text]);

  return (
    <div className="space-y-2">
      <p
        ref={ref}
        id={id}
        className={`whitespace-pre-line leading-relaxed text-zinc-300 ${expanded ? "" : "line-clamp-4"}`}
      >
        {text}
      </p>
      {overflows && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((open) => !open)}
          className="text-sm font-semibold text-amber-300 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
