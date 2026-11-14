export type SentryEnvironment = "production" | "preview" | "development";

// Pure so every runtime shares the same rules: callers pass their own literal
// `process.env.X` reads (the `NEXT_PUBLIC_` ones on the client).
export function resolveSentryEnv(env: {
  VERCEL_ENV?: string;
  VERCEL_GIT_COMMIT_SHA?: string;
}): { environment: SentryEnvironment; release: string | undefined } {
  const environment =
    env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview" ? env.VERCEL_ENV : "development";

  return { environment, release: env.VERCEL_GIT_COMMIT_SHA || undefined };
}
