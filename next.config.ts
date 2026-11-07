import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Posters load straight from image.tmdb.org at fixed sizes; Vercel Hobby limits image optimization.
  images: { unoptimized: true },
};

export default nextConfig;
