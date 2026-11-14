import "server-only";
import { init, type LDClient, type LDContext } from "@launchdarkly/node-server-sdk";

/** Reelbase has no accounts, so every visitor is one context: a flag is on or off for everyone. */
const VISITOR: LDContext = { kind: "user", key: "visitor", anonymous: true };

/** How long the first evaluation waits for LaunchDarkly's flag data before serving the defaults. */
const INIT_TIMEOUT_SECONDS = 5;

// Kept on `globalThis` so a dev-server reload reuses the connection: the free plan allows five.
const store = globalThis as typeof globalThis & { launchDarkly?: Promise<LDClient> };

/** The shared client, or undefined when `LAUNCHDARKLY_SDK_KEY` is not set (tests, CI, a fresh clone). */
function client(): Promise<LDClient> | undefined {
  const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY?.trim();
  if (!sdkKey) return undefined;
  if (!store.launchDarkly) {
    const ld = init(sdkKey);
    // A client that has not initialized still answers, with each flag's default, and keeps connecting.
    store.launchDarkly = ld.waitForInitialization({ timeout: INIT_TIMEOUT_SECONDS }).then(
      () => ld,
      () => ld,
    );
  }
  return store.launchDarkly;
}

/** Whether the home page shows the marquee layout (`marquee-home`). Off when LaunchDarkly can't be reached. */
export async function isMarqueeHome(): Promise<boolean> {
  const ld = await client();
  return ld ? ld.boolVariation("marquee-home", VISITOR, false) : false;
}
