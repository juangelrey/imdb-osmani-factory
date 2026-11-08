export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours}h`, rest && `${rest}m`].filter(Boolean).join(" ") || "0m";
}

/** Split a "YYYY-MM-DD" date into numbers; undefined unless it is a real calendar date. */
function parseDate(date: string): [number, number, number] | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day ? [year, month, day] : undefined;
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** "1930-05-31" → "May 31, 1930", the same in every time zone; undefined for anything else. */
export function formatDate(date: string): string | undefined {
  const parts = parseDate(date);
  return parts && dateFormat.format(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2018-03-21" → "21 Mar 2018", for the career timeline; undefined for anything else. */
export function formatShortDate(date: string): string | undefined {
  const parts = parseDate(date);
  return parts && `${parts[2]} ${SHORT_MONTHS[parts[1] - 1]} ${parts[0]}`;
}

/** Whole years from `from` to `to` (both "YYYY-MM-DD"); undefined if either is invalid or `to` is earlier. */
export function ageOn(from: string, to: string): number | undefined {
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end) return undefined;
  const beforeBirthday = end[1] < start[1] || (end[1] === start[1] && end[2] < start[2]);
  const age = end[0] - start[0] - (beforeBirthday ? 1 : 0);
  return age >= 0 ? age : undefined;
}
