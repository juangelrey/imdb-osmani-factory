import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

import { resolveSentryEnv } from "./src/lib/observability/sentry-env";

const nextConfig: NextConfig = {
  // Keeps `next dev` from writing its agent-rules block back into AGENTS.md.
  agentRules: false,
  // Posters load straight from image.tmdb.org at fixed sizes; Vercel Hobby limits image optimization.
  images: { unoptimized: true },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/sourcemaps/uploading/bundler-plugin-options/

  org: "juangelrey",

  project: "reelbase",

  // Same name the SDK tags events with, so uploaded source maps match. Unset without a SHA (local, CI).
  release: { name: resolveSentryEnv({ VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA }).release },

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
