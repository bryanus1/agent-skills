# Performance

**Measure first.** Without a metric or a profile, an optimization is a hypothesis. Tools: React DevTools Profiler, Lighthouse, WebPageTest, `web-vitals` in production. Key metrics: **LCP** (< 2.5 s), **INP** (< 200 ms), **CLS** (< 0.1).

## Loading (usually the heaviest part)

- **Images**: modern format (WebP/AVIF), responsive sizes (`srcset`/`sizes` or the framework's image component), `width`/`height` to avoid layout shifts, `loading="lazy"` off-screen and priority only for the main image (LCP).
- **JavaScript**: split by route and load heavy pieces on demand (editors, charts, maps) with `import()`/`lazy`; check the bundle (an analyzer) before adding large libraries; import only what you use (avoid `import _ from 'lodash'`).
- **Fonts**: `font-display: swap`, character subsets, preload the critical font.
- **Data**: don't request more than you show; paginate; cache; in SSR, avoid waterfalls of sequential requests (run them in parallel).
- **Third parties** (analytics, chats): load them deferred; each one costs.

## Rendering

- **Long lists** (hundreds+): pagination or virtualization (TanStack Virtual, react-window).
- **Unnecessary renders**: fix the cause first (state held too high, values recreated and passed to memoized children, a context with a value that always changes). Only then `memo`, `useMemo`, `useCallback`, and check with the Profiler that it improved.
- **Expensive work** on the main thread (sorting, filtering thousands of items, parsing): `useDeferredValue`/`startTransition` to keep input smooth, or move it to a Web Worker.
- **Search inputs**: debounce the requests, not the input state.
- **Layout**: avoid alternating DOM reads and writes (layout thrashing); animate `transform`/`opacity`, not `width`/`top`.

## When not to optimize

Components that render in under a few milliseconds, screens with few elements, code that runs once. Poorly maintained memoization usually costs more than it saves.
