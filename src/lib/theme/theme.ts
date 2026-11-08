/** The visitor's theme choice, saved per browser. Only the choice is stored, never the resolved theme. */
export const THEME_STORAGE_KEY = "reelbase:theme";

export const THEME_CHOICES = ["system", "light", "dark"] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];
/** The theme the page shows, set as `data-theme` on `<html>`. */
export type Theme = "light" | "dark";

export const OS_LIGHT_QUERY = "(prefers-color-scheme: light)";

/** A stored value narrowed to a choice. Anything missing, unknown or malformed is System. */
export function parseThemeChoice(raw: unknown): ThemeChoice {
  return raw === "light" || raw === "dark" ? raw : "system";
}

/**
 * The theme to show: a stored Light or Dark wins, else the OS preference. An OS with no preference gets Dark,
 * the app's original look. Callers pass `null` when storage can't be read.
 */
export function resolveTheme(stored: unknown, osPrefersLight: boolean): Theme {
  const choice = parseThemeChoice(stored);
  if (choice !== "system") return choice;
  return osPrefersLight ? "light" : "dark";
}

/**
 * Runs in `<head>` before first paint (layout.tsx) and mirrors `resolveTheme`; theme.test.ts checks they agree.
 * Static: built only from the constants above, so a future CSP can allow it by hash.
 */
export const THEME_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){var l=false;try{l=matchMedia(${JSON.stringify(OS_LIGHT_QUERY)}).matches}catch(e){}t=l?"light":"dark"}document.documentElement.setAttribute("data-theme",t)})()`;
