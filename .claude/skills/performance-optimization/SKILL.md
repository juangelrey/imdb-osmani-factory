---
name: performance-optimization
description: Optimizes the app's frontend performance. Use when performance requirements exist, when you suspect a performance regression, when Core Web Vitals (LCP, INP, CLS) or load times need improvement, when a page or interaction feels slow or janky, or when profiling reveals a bottleneck.
---

# Performance Optimization

Measure before optimizing. Without evidence of a problem, leave the code simple.

## Core Web Vitals Targets

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## Workflow

### 1. Measure

Measure a production build: the branch's preview deploy (start no dev server). In Chrome DevTools, use Lighthouse and the Performance panel with **CPU throttling at 4× to 6×** and a network preset, so a mid-range phone's problems show on a fast laptop. Record the baseline numbers.

For interaction-level INP detail, the `web-vitals` attribution build names the target and splits the time into input delay, processing and presentation:

```ts
import { onINP } from "web-vitals/attribution";
onINP(({ value, attribution }) => console.log(value, attribution));
```

### 2. Identify the bottleneck

| Symptom | Likely cause | Look at |
|---|---|---|
| Slow LCP | Oversized hero image, render-blocking resources, slow upstream fetch on the server | Network waterfall, image bytes |
| High CLS | Images without dimensions, late content, font swap | Layout-shift attribution |
| Poor INP | Long tasks (> 50ms) on the main thread, large re-renders | Long tasks in the Performance trace |
| Slow first load | Large client bundle | Bundle size, what ships to the client |
| Jank during animation | Animating layout properties, forced reflows | Rendering and Layout entries in the trace |

### 3. Fix the one thing

- **Unnecessary re-renders.** An object or function created in render is a new reference every time and re-renders every memoized child that receives it. Hoist constants out of the component; keep state as low in the tree as it can live. Reserve the framework's memoization helpers for work the profile shows is expensive.

  ```ts
  // Module scope: one stable reference, not a new object per render
  const DEFAULT_SORT = { by: "popularity", order: "desc" } as const;
  ```

- **Large client bundle.** Keep work on the server where the framework allows; the client bundle carries only what client entry points import. Load heavy, rarely-used client UI with a dynamic import, showing a placeholder while it loads:

  ```ts
  const { VideoPlayer } = await import("./video-player"); // fetched on first use
  ```

  The bundler tree-shakes ESM named imports already; profile before changing import styles.

- **Images.** Render images through the framework's image component, or `<img>` with `width` and `height`, so they reserve space (CLS). Prioritize the LCP image; let the rest lazy-load. Serve each image at the size it renders: if nothing resizes images for you (check the image config), pick the source size that matches the rendered size, and size and compress local images before committing them.

- **Poor INP.** Break long tasks so input runs between chunks. Inside a long loop, yield to the main thread:

  ```ts
  async function processAll<T>(items: T[], work: (item: T) => void) {
    for (const item of items) {
      work(item);
      if ("scheduler" in globalThis && "yield" in scheduler) await scheduler.yield();
      else await new Promise((r) => setTimeout(r, 0));
    }
  }
  ```

  Update the UI for the interaction first, then defer non-urgent work (the framework's transition API, `requestIdleCallback`). Virtualize long lists.

- **Animation jank.** Animate only `transform` and `opacity`; they skip layout and paint. Batch DOM reads before writes to avoid forced reflows.

### 4. Verify: keep or revert

Re-measure exactly as you measured the baseline: same page, same throttling, same number of runs. Change one thing at a time, and compare the delta against run-to-run variance, not just the mean.

| Result vs. baseline | Action |
|---|---|
| Beyond noise, tests green | **Keep.** Put the before/after numbers in the commit message. |
| Within noise | **Revert.** |
| Worse | **Revert.** |
| Better, but a test went red | **Revert.** |

A neutral change is a revert: kept code is maintained forever and must pay for itself. An "optimization" that wins by dropping needed work is a regression.

### 5. Log every attempt

Reverted work leaves no trace in git, so a dead idea gets tried again. Record each attempt in the PR description:

| Idea | Baseline → result | Verdict | Why |
|---|---|---|---|
| Memoize the result card | INP 240ms → 235ms | reverted | Inside noise (±15ms) |
| Virtualize the results grid | INP 240ms → 90ms | kept | Long tasks gone from the trace |

Read the log before proposing an experiment.

## Verification

- [ ] Core Web Vitals are within "Good"
- [ ] The client bundle didn't grow without reason
