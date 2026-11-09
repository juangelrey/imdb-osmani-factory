import { NextResponse, type NextRequest } from "next/server";
import { REGION_COOKIE } from "@/lib/catalog/regions";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * The region form's target. A valid code (`^[A-Z]{2}$`; the home page skips any TMDB doesn't list) is saved
 * in the region cookie, and the visitor goes home with `?region=` after the carried browse params, on page 1.
 * Only choosing a region here writes the cookie, so opening a shared `?region=` link never overwrites it.
 * A malformed code saves nothing and goes home.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const region = params.get("region") ?? "";
  if (!/^[A-Z]{2}$/.test(region)) return NextResponse.redirect(new URL("/", request.url), 303);

  // Every param but region and page is carried as is, so filters added to browse later ride along.
  const query = new URLSearchParams([...params].filter(([name]) => name !== "region" && name !== "page"));
  query.set("region", region);
  // Literal commas, as `browseHref` writes them (`genre=28,35`).
  const response = NextResponse.redirect(new URL(`/?${query.toString().replaceAll("%2C", ",")}`, request.url), 303);
  response.cookies.set(REGION_COOKIE, region, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
  });
  return response;
}
