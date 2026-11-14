import { isMarqueeHome } from "./flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMarqueeHome", () => {
  it("is off when no LaunchDarkly SDK key is set", async () => {
    vi.stubEnv("LAUNCHDARKLY_SDK_KEY", "");
    expect(await isMarqueeHome()).toBe(false);
  });
});
