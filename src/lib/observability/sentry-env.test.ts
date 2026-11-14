import { resolveSentryEnv } from "./sentry-env";

describe("resolveSentryEnv", () => {
  describe("environment", () => {
    it("maps a Vercel production deploy to production", () => {
      expect(resolveSentryEnv({ VERCEL_ENV: "production" }).environment).toBe("production");
    });

    it("maps a Vercel preview deploy to preview", () => {
      expect(resolveSentryEnv({ VERCEL_ENV: "preview" }).environment).toBe("preview");
    });

    it("maps Vercel development to development", () => {
      expect(resolveSentryEnv({ VERCEL_ENV: "development" }).environment).toBe("development");
    });

    it("falls back to development when there are no Vercel variables", () => {
      expect(resolveSentryEnv({}).environment).toBe("development");
    });

    it("falls back to development when VERCEL_ENV is empty", () => {
      expect(resolveSentryEnv({ VERCEL_ENV: "" }).environment).toBe("development");
    });

    it("falls back to development for an unknown VERCEL_ENV", () => {
      expect(resolveSentryEnv({ VERCEL_ENV: "staging" }).environment).toBe("development");
    });
  });

  describe("release", () => {
    it("is the commit SHA when one is set", () => {
      const sha = "35de4ec0c1f2a3b4c5d6e7f8091a2b3c4d5e6f70";

      expect(resolveSentryEnv({ VERCEL_GIT_COMMIT_SHA: sha }).release).toBe(sha);
    });

    it("is undefined when the SHA is missing", () => {
      expect(resolveSentryEnv({ VERCEL_ENV: "production" }).release).toBeUndefined();
    });

    it("is undefined when the SHA is empty", () => {
      expect(resolveSentryEnv({ VERCEL_GIT_COMMIT_SHA: "" }).release).toBeUndefined();
    });
  });
});
