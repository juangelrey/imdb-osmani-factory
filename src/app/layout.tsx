import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reelbase",
  description: "A small catalogue of invented movies.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 text-zinc-100 antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-500">
          Reelbase is a sample app. Every title and person in it is invented.
        </footer>
      </body>
    </html>
  );
}
