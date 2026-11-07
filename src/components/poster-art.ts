const ARTICLES = new Set(["the", "a", "an"]);

function hashSlug(slug: string): number {
  // FNV-1a: small, stable and well spread for short strings.
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export interface PosterColors {
  from: string;
  to: string;
}

export function posterColors(slug: string): PosterColors {
  const hash = hashSlug(slug);
  const hue = hash % 360;
  const shift = 40 + ((hash >>> 9) % 100);
  return {
    from: `hsl(${hue} 65% 45%)`,
    to: `hsl(${(hue + shift) % 360} 70% 22%)`,
  };
}

export function posterInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  const meaningful = words.length > 1 && ARTICLES.has(words[0].toLowerCase()) ? words.slice(1) : words;
  return meaningful
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}
