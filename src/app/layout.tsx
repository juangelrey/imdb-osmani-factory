import type { Metadata } from "next";
import { ViewTransition, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { TmdbAttribution } from "@/components/tmdb-attribution";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelbase",
  description: "Browse, search and save real movies from TMDB.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 text-zinc-100 antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {/*
            Every navigation and every loading-skeleton reveal is a transition, so the page content crossfades
            (the `page` class in globals.css). The header and footer have their own names and stay still.
          */}
          <ViewTransition default="page">{children}</ViewTransition>
        </main>
        <footer
          className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-500"
          style={{ viewTransitionName: "site-footer" }}
        >
          <TmdbAttribution />
        </footer>
      </body>
    </html>
  );
}
