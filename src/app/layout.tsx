import type { Metadata } from "next";
import { ViewTransition, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { TmdbAttribution } from "@/components/tmdb-attribution";
import { THEME_SCRIPT } from "@/lib/theme/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelbase",
  description: "Browse, search and save real movies from TMDB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The inline script sets `data-theme` on <html> before first paint; React would otherwise flag that attribute.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Static text from theme.ts: no data from the request, storage or TMDB goes into it. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 text-zinc-100 antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {/*
            Every navigation and every loading-skeleton reveal is a transition, so the page content crossfades
            (the `page` class in globals.css). Pagination tags its links, so Next and Previous slide instead.
            The header and footer have their own names and stay still.
          */}
          <ViewTransition
            default="page"
            update={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page" }}
          >
            {children}
          </ViewTransition>
        </main>
        <footer
          className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-400"
          style={{ viewTransitionName: "site-footer" }}
        >
          <TmdbAttribution />
        </footer>
      </body>
    </html>
  );
}
