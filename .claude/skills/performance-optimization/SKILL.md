---
name: performance-optimization
description: Optimizes the app's frontend performance. Use when performance requirements exist, when you suspect a performance regression, when Core Web Vitals (LCP, INP, CLS) or load times need improvement, when a page or interaction feels slow or janky, or when profiling reveals a bottleneck.
---

# Performance Optimization

Measure before optimizing. Without evidence of a problem, leave the code simple.

## Target

Every Core Web Vital in its "Good" range.

## Workflow

### 1. Measure

Measure a production build in a browser, with CPU and network throttling close to a mid-range phone, over several runs; start no dev server. Record the median and spread as the baseline. If you can't run a browser against a production build, report the measurement as outstanding instead of estimating it.

For interaction-level INP detail, record the interaction in the Performance panel: it names the target and splits the time into input delay, processing and presentation.

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
- **Large client bundle.** Keep work on the server where the framework allows. Load heavy, rarely-used client UI on demand with the framework's lazy-loading API, showing a placeholder while it loads.
- **Images.** Render images through the framework's image component, or `<img>` with `width` and `height`, so they reserve space (CLS). Prioritize the LCP image; let the rest lazy-load. Serve each image at the size it renders: if nothing resizes images for you (check the image config), pick the source size that matches the rendered size, and size and compress local images before committing them.
- **Poor INP.** Break long tasks so no task runs past about 50ms. Inside a long loop, yield to the main thread (`scheduler.yield()` where supported, else a macrotask) once the current slice has used its budget, not after every item. Update the UI for the interaction first, then defer non-urgent work (the framework's transition API, `requestIdleCallback`). Virtualize long lists.
- **Animation jank.** Animate only `transform` and `opacity`; they skip layout and paint. Batch DOM reads before writes to avoid forced reflows.

### 4. Verify: keep or revert

Re-measure exactly as you measured the baseline: same page, same throttling, same number of runs, one change at a time. Keep the change only when it beats the baseline by more than the run-to-run spread with every test green, and put the before/after numbers in its commit message; revert anything else. Kept code must pay for itself; a win that drops needed work is a regression.

### 5. Log every attempt

Reverted work leaves no trace in git, so a dead idea gets tried again. Record each attempt (idea, baseline → result, verdict, why) as a comment on the ticket being worked, and read that log before proposing an experiment.
