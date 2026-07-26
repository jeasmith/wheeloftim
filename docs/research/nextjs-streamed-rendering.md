# "The beta version of streamed rendering" — what it actually is, and whether it earns its place

**Status:** research note, July 2026
**Question:** the owner asked for "the beta version of streamed rendering" in the Next.js App Router. Which feature is that, and does it compose with a Convex-backed real-time estimation poker room?

---

## TL;DR

The feature is **Cache Components**, enabled by the top-level `cacheComponents: true` flag in `next.config.ts`. It is the successor to, and a superset of, Partial Prerendering (PPR) and the `use cache` directive. Vercel shipped and labelled it **beta**.

The honest verdict on Convex:

- **The static shell is real and free.** A Convex-only client component (`useQuery` over the websocket) renders its loading state during prerender, so the estimation room's chrome and skeleton land in the static shell **whether or not you enable `cacheComponents`**.
- **PPR's streaming buys nothing on the room itself.** PPR streams the *server's* RSC payload over the initial HTTP response. Convex's live data arrives over a *separate* websocket opened after hydration. The two do not interact. There is no server-side dynamic hole in a `useQuery`-driven room for PPR to stream into.
- **The one place it does buy something is `preloadQuery`**, which trades a static shell for a first paint with real data. That is a genuine tradeoff, not a free win, and it comes with a Convex consistency caveat that actively fights PPR's multi-boundary streaming model.
- **Recommendation:** enable `cacheComponents` globally (it is the direction of travel and the landing page benefits), but treat the estimation room as a **prerendered shell + client-side realtime** page. Do not reach for `preloadQuery` or extra Suspense boundaries there. On the room, PPR-style streaming is ceremony.

---

## 1. Version situation: what is actually installed

Before anything else — the local install is stale, and the two versions differ in a way that matters.

| | Version | Source |
|---|---|---|
| `package.json` pin | `next@16.3.0-canary.96` | `package.json` line 29 |
| Actually in `node_modules` | `next@16.1.6` | `node_modules/next/package.json` |
| React pinned | `19.2.8` | `package.json` |
| React installed | `19.2.0` / `19.2.4` | `node_modules/.pnpm/` |

**The bundled docs are not present in this install.** Next.js 16 is documented to ship version-accurate markdown inside the package, but `node_modules/next/dist/docs/` does not exist in 16.1.6 as installed here, and the only markdown in the package is `README.md` and `license.md`. So this note is sourced from three places, in descending order of trust:

1. **The installed TypeScript declarations and compiled source** (`next@16.1.6`) — version-exact for what runs today.
2. **The pinned canary's declarations**, fetched from the registry CDN at `unpkg.com/next@16.3.0-canary.96/dist/server/config-shared.d.ts` — version-exact for what will run after the next install.
3. **nextjs.org docs**, which serve version-stamped markdown (the pages cited below report `version: 16.2.11`, `lastUpdated: 2026-05-13`).

Where 16.1.6 and the canary differ, that is called out explicitly below.

> **Note on stale docs:** because nextjs.org currently documents 16.2.11 and the pin is 16.3.0-canary.96, every claim below was cross-checked against the canary's own type declarations. One canary-only addition was found (`partialPrefetching`, see §4).

---

## 2. The candidates, and which one is meant

| Candidate | What it actually is | Status at 16.x | Verdict |
|---|---|---|---|
| **Cache Components** | Umbrella model: `use cache` + PPR + dynamic-by-default rendering, behind one flag | **Beta**, opt-in, top-level `cacheComponents` flag | **This is the feature** |
| **Partial Prerendering (PPR)** | Static shell + dynamic content streamed into holes marked by `Suspense` | No longer independently configurable; it *is* the default rendering behaviour once Cache Components is on | Subsumed |
| **`use cache` directive** | Marks a function/component's return value as cacheable; compiler derives the cache key | A *component* of Cache Components; enabled by the same flag | Subsumed |
| **Streaming metadata** | Prevents `generateMetadata` from blocking the shell; `htmlLimitedBots` controls bot behaviour | Stable and on by default; `htmlLimitedBots` is now a **top-level** config key in 16.1.6 | Not it |
| **Suspense streaming SSR** | Plain React streaming SSR — works with no flag at all | Stable since the App Router shipped | Not it (but see §6 — this is what the room actually uses) |

### Why "Cache Components" is the answer

The name maps to "beta" + "streamed rendering" exactly. Vercel's Next.js 15.4 post, previewing 16, uses the label verbatim:

> **Cache Components (beta)**: Consolidates experimental caching features (Dynamic IO, `use cache`, and Partial Prerendering) into a unified `cacheComponents` flag, simplifying performance optimization strategies.
>
> — [Next.js 15.4 blog, "Looking ahead: Next.js 16"](https://nextjs.org/blog/next-15-4) (applies to: 15.4, previewing 16.0)

And the current config reference describes precisely "streamed rendering":

> Next.js prerenders a static HTML shell that is served immediately while dynamic content streams in when ready, letting you mix static and dynamic content within a single route.
>
> — [`cacheComponents` config reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) (page reports version 16.2.11)

### The relationships (does Cache Components subsume PPR? — yes)

This is settled, not a matter of interpretation. The `cacheComponents` reference states:

> Additionally, `cacheComponents` implements **Partial Prerendering (PPR)** as the default behavior in the App Router. This means the `experimental.ppr` configuration flag and the `experimental_ppr` route segment configuration are no longer necessary and have been removed.
>
> — [`cacheComponents` config reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) (16.2.11)

Its version history confirms the consolidation of three former flags into one:

> | 16.0.0 | `cacheComponents` introduced. This flag controls the `ppr`, `useCache`, and `dynamicIO` flags as a single, unified configuration. |

The installed 16.1.6 source agrees, and is blunter about it. From `node_modules/next/dist/server/config-shared.d.ts`:

```ts
/**
 * @deprecated This configuration option has been merged into `cacheComponents`.
 * The Partial Prerendering feature is still available via `cacheComponents`.
 */
ppr?: ExperimentalPPRConfig;
```

```ts
/** @deprecated use top-level `cacheComponents` instead */
cacheComponents?: boolean;   // inside ExperimentalConfig
```

So the hierarchy is:

```
cacheComponents: true          ← the one flag you set
├── PPR                        ← rendering behaviour; static shell + streamed holes
├── use cache                  ← opt-in caching directive (+ cacheLife, cacheTag)
├── dynamic-by-default         ← formerly dynamicIO; nothing is cached unless you say so
└── Activity-based navigation  ← routes are hidden, not unmounted (see §7)
```

---

## 3. Stability, and how Next.js itself classifies it

Three independent signals, all from the installed 16.1.6 build:

**It is no longer experimental.** The flag is top-level, not under `experimental`. In `node_modules/next/dist/server/lib/app-info-log.js`, `cacheComponents` is logged as its own first-class startup banner entry (`parts.push('Cache Components')`) rather than being listed among experimental features — which are enumerated separately and validated against `experimentalSchema`.

**It is not yet the default.** `NextConfigComplete` in the same declarations file defaults it to `false`, and `config.js` carries an explicit internal escape hatch with a revealing comment:

```js
// TODO: Remove this once we've made Cache Components the default.
if (process.env.__NEXT_CACHE_COMPONENTS === 'true' && ...) {
    config.cacheComponents = true;
}
```

**Sub-APIs have already graduated.** `cacheLife` and `cacheTag` are exported unprefixed from `next/cache` in 16.1.6, with `unstable_cacheLife` / `unstable_cacheTag` retained only as aliases. The v16 upgrade guide confirms: "`cacheLife` and `cacheTag` are now stable — the `unstable_` prefix is no longer needed" ([Version 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)).

So: **beta, opt-in, top-level, stabilising, and clearly intended to become the default.** That is a reasonable thing to adopt on a greenfield project.

### Configuration

The full config for this repo would be a two-line change to the existing `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,        // ← the feature
  experimental: {
    useTypeScriptCli: true,     // already present in this repo
  },
};

export default nextConfig;
```

Optionally, custom cache profiles (top-level, not experimental):

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    marketing: { stale: 3600, revalidate: 86400, expire: 604800 },
  },
};
```

Built-in `cacheLife` profiles in 16.1.6, from `node_modules/next/cache.d.ts` — note `stale` is 300s for every profile except `seconds`:

| Profile | stale | revalidate | expire |
|---|---|---|---|
| `seconds` | 30s | 1s | 1m |
| `minutes` | 5m | 1m | 1h |
| `hours` | 5m | 1h | 1d |
| `days` | 5m | 1d | 1w |
| `weeks` | 5m | 1w | 30d |
| `max` | 5m | 30d | never |
| `default` | 5m | 15m | never |

---

## 4. Migration path if it changes before release

The risk here is low and the blast radius is small, for four reasons.

**The flag rename already happened, and Next.js auto-migrates.** `experimental.dynamicIO` → `experimental.cacheComponents` → top-level `cacheComponents`. The installed `config.js` handles the second hop automatically via `warnOptionHasBeenMovedOutOfExperimental(result, 'cacheComponents', 'cacheComponents', ...)` — a warning, not a break.

**The one hard break is already behind us.** `experimental.ppr` now throws rather than warns, which is worth knowing because it means you cannot half-migrate. From `config.js` in 16.1.6:

```js
throw new HardDeprecatedConfigError(
  `\`experimental.ppr\` has been merged into \`cacheComponents\`. ...`
);
```

Since this project has never used `experimental.ppr`, this is a non-issue — but it does mean **you should not copy PPR setup from any Next.js 15 tutorial.** The upgrade guide is explicit that "PPR in Next.js 16 works differently than in Next.js 15 canaries" ([Version 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)).

**The migration surface is a single boolean.** Turning `cacheComponents` off reverts to the legacy caching model. The only code that would need revisiting is any `use cache` directive and any `Suspense` boundary added solely to satisfy the prerender checker — and `Suspense` boundaries are harmless without the flag.

**Canary drift to watch.** The pinned `16.3.0-canary.96` adds one Cache-Components-dependent option absent from 16.1.6, confirmed by diffing the two declaration files:

```ts
/**
 * Opts the whole app into Partial Prefetching: `<Link prefetch={true}>`
 * prefetches only the static parts of a route, never its dynamic data.
 * ... Requires `cacheComponents: true`.
 */
partialPrefetching?: boolean | 'unstable_eager';
```

This is additive and opt-in. Note `'unstable_eager'` is documented in-source as "Internal migration aid; not part of the public API" — do not use it.

---

## 5. The key question: does it compose with Convex?

Short answer: **it does not conflict, but on a live subscription-driven page it also does not help.** The two systems operate on different transports at different times, and understanding that is the whole answer.

### The two transports

| | PPR / Cache Components | Convex realtime |
|---|---|---|
| Transport | Initial HTTP response (streamed RSC payload) | Websocket, opened after hydration |
| Lifetime | One-shot, ends when the response completes | Persistent, for the life of the page |
| Pushes updates? | No | Yes |
| Server involvement | Next.js server renders holes | Convex backend pushes; Next.js is not involved |

PPR streams a *response*. Convex streams *state*. PPR's job is finished before Convex's job begins.

### Why a `useQuery` room is already fully prerenderable

This is the counter-intuitive bit that dissolves most of the question. A Convex client component does not `await` anything on the server. Convex's own docs state:

> By default Client Components will not wait for Convex data to be loaded, and your UI will render in a "loading" state.
>
> — [Convex, Next.js Server Rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering) (Convex docs, current; feature marked beta by Convex)

`useQuery` returns `undefined` until the websocket delivers data. During prerender there is no websocket, so the component renders its skeleton branch synchronously. Next.js prerenders client components to HTML at build time like any other component.

Consequence: **the estimation room, built with `ConvexProvider` + `useQuery`, is a 100% static route.** Its skeleton is the entire static shell. There is no dynamic hole. There is nothing for PPR to stream.

And you get that today, with `cacheComponents` off, from ordinary App Router static rendering. Enabling Cache Components does not improve it, because it was already optimal.

> This is the rigorous version of "this is ceremony on the estimation room." It is not that PPR breaks — it is that PPR's entire value proposition (mixing prerendered and request-time server content in one response) has no referent on a page where all the varying content arrives client-side over a different connection.

### The one case where it does something: `preloadQuery`

`preloadQuery` fetches Convex data on the server and hands it to a client component that stays reactive:

```tsx
// server component
const preloaded = await preloadQuery(api.rooms.get, { roomId });
return <Room preloaded={preloaded} />;

// client component — hydrates from server data, then goes live
const room = usePreloadedQuery(props.preloaded);
```

This eliminates the loading flash on first paint. But it is explicitly incompatible with static rendering:

> `preloadQuery` uses the `cache: 'no-store'` policy so any Server Components using it will not be eligible for static rendering.
>
> — [Convex, Next.js Server Rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering)

Under Cache Components, that uncached await **must** sit inside a `Suspense` boundary or the build fails:

> When the `cacheComponents` feature is enabled, Next.js expects a parent `Suspense` boundary around any component that awaits data that should be accessed on every user request.
>
> — [`Uncached data was accessed outside of <Suspense>`](https://nextjs.org/docs/messages/blocking-route)

So `preloadQuery` + Cache Components is the *one* genuinely composed pattern: static shell → `Suspense` fallback in the shell → server streams the preloaded snapshot → client hydrates and the websocket takes over. That is PPR doing real work.

### Two reasons to still not do it on the estimation room

**It is strictly slower to interactive, for zero durable benefit.** The preload adds a server→Convex round trip to the critical path of the HTML response, and the data it delivers is stale within milliseconds — a poker room's state changes on every vote. You pay a latency cost on the response to avoid a skeleton that the websocket would have filled in anyway.

**Convex's consistency model actively fights PPR's multi-boundary pattern.** PPR encourages many independent `Suspense` boundaries streaming in parallel. Convex warns against exactly that:

> `preloadQuery` and `fetchQuery` use the `ConvexHTTPClient` under the hood. This client is stateless. This means that two calls to `preloadQuery` are not guaranteed to return consistent data based on the same database state. ... To prevent rendering an inconsistent UI avoid using multiple `preloadQuery` calls on the same page.
>
> — [Convex, Next.js Server Rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering)

A room showing participants, the current story, and revealed votes from three parallel preloads could render three mutually inconsistent snapshots. The reactive `ConvexReactClient` gives guaranteed consistency; the HTTP client used by `preloadQuery` does not. **Realtime correctness argues for fewer server boundaries, PPR performance argues for more.** On this page, correctness wins.

---

## 6. What this means for the two products

### Boundary map

```
app/
├── layout.tsx              ← static shell; ConvexProvider ('use client') lives here.
│                             A client provider does NOT block prerendering.
│
├── page.tsx                ← LANDING PAGE
│                             Good fit. Fully static, or 'use cache' if it ever
│                             gains CMS/dynamic content. Real benefit.
│
├── wheel/page.tsx          ← SPIN THE WHEEL
│                             Fully static. Names live in localStorage, read after
│                             hydration. Cache Components changes nothing — already optimal.
│
└── rooms/[roomId]/page.tsx ← ESTIMATION ROOM
                              Static shell (chrome + skeleton) + client-side realtime.
                              PPR/streaming = ceremony. See below.
```

### Landing page — good fit, modest benefit

Static marketing content prerenders to a shell with or without the flag. The flag earns its place here only *prospectively*: if the landing page later pulls dynamic content (live room count, "N teams estimating now"), Cache Components lets you stream just that fragment into an otherwise-static page instead of making the whole route dynamic. Today the honest benefit is close to zero; the value is optionality.

If you do add a live counter, the correct shape is a cached server fragment, not a Convex subscription:

```tsx
async function RoomCount() {
  'use cache'
  cacheLife('minutes')
  return <p>{await fetchQuery(api.rooms.count)} teams estimating</p>
}
```

Note `fetchQuery` (non-reactive), not `preloadQuery` — a marketing stat does not need a websocket, and `'use cache'` puts it in the shell.

### Wheel — neutral

Client-side only, `localStorage`-backed. Prerenders to a static shell already. No `use cache`, no `Suspense`, no change. The flag neither helps nor hurts.

### Estimation room — poor fit

The prerendered/dynamic boundary falls in an unusual place: **there isn't one on the server.** The whole route prerenders; the realtime boundary is the websocket, which is a client-side concern Next.js has no visibility into.

Recommended shape:

```tsx
// app/rooms/[roomId]/page.tsx
export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  return (
    <RoomShell>                      {/* static: header, layout, card deck chrome */}
      <Suspense fallback={<RoomSkeleton />}>
        <RoomClient params={params} />   {/* 'use client' — Convex useQuery */}
      </Suspense>
    </RoomShell>
  );
}
```

The `Suspense` here is **not for PPR** — it is because `params` is a promise, and under Cache Components awaiting `params` without a boundary triggers the blocking-route error. The `blocking-route` docs list this exact case:

> Awaiting `params` in a Page or Layout ... `const { id } = await params` directly in a Page component is a common trigger for this error.
>
> — [`Uncached data was accessed outside of <Suspense>`](https://nextjs.org/docs/messages/blocking-route)

The cheapest fix is to pass the `params` promise down and `use()` it inside the client component, or add a `loading.tsx` to the segment. Either way, this is a Cache Components *tax* on the room, not a benefit — a small, one-time, entirely manageable tax.

---

## 7. XState and heavily client-side components — the real gotcha

This is where Cache Components has a genuine, non-obvious behavioural impact, and it has nothing to do with streaming.

### Cache Components changes navigation semantics

> When `cacheComponents` is enabled, Next.js uses React's `Activity` component to preserve component state during client-side navigation. Rather than unmounting the previous route when you navigate away, Next.js sets the Activity mode to `"hidden"`. ... **Effects are cleaned up when a route is hidden, and recreated when it becomes visible again.**
>
> — [`cacheComponents` config reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) (16.2.11)

Next.js preserves up to 3 routes this way ([Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state), 16.2.11). So navigating room → landing → room does **not** remount the room. State survives; effects are torn down and re-run.

### What that does to Convex

Convex's `useQuery` subscribes in an effect. On Activity-hide, the subscription is cleaned up; on re-show, it resubscribes. The docs describe this as intended behaviour:

> When Activity hides content, React runs effect cleanup functions just like it does on unmount. This means timers, subscriptions, and media playback pause automatically if you have proper cleanup.
>
> — [Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state) (16.2.11)

This is mostly *desirable* — a hidden room stops consuming a live subscription. The gotcha is that **preserved `useState` may briefly render stale data from before the route was hidden**, until the resubscription delivers a fresh snapshot. For an estimation room, stale votes rendering for a few hundred milliseconds is a real UX bug worth thinking about. Deriving "is this data fresh" from the Convex query's own `undefined`-while-loading signal, rather than caching results in local state, avoids it.

### What that does to XState — better news than expected

XState's React integration was **explicitly designed for this**. `@xstate/react`'s `useActorRef` starts the actor in an effect and, on cleanup, calls `stopRootWithRehydration` rather than a plain `stop()`. The source comment names the API directly:

```ts
// persist snapshot here in a custom way allows us to persist inline actors and to preserve actor references
// we do it to avoid setState in useEffect when the effect gets "reconnected"
// this currently only happens in Strict Effects but it simulates the Offscreen aka Activity API
```

— [`stopRootWithRehydration.ts`, statelyai/xstate](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/src/stopRootWithRehydration.ts) (`main`)

It walks the actor tree, persists each actor's snapshot, mutes observers, stops the root, then restores `_snapshot` and resets `_processingStatus` so a later `start()` resumes from the persisted state instead of the machine's initial state.

Practical consequences:

- **Machine state survives Activity hide/show.** The actor resumes where it left off; entry actions on the initial state do not re-fire.
- **`invoke`d actors are stopped and restarted.** A machine that invokes a callback actor wrapping a timer, an interval, or a websocket will re-run that setup on re-show. Usually correct — but make sure invoked side effects are idempotent and have real cleanup.
- **`reactStrictMode: true` is already set in this repo's `next.config.ts`**, so the double-invoke path that exercises `stopRootWithRehydration` is already being hit in development. Activity is the same code path. That is a useful early-warning system: if a machine misbehaves under StrictMode today, it will misbehave under Activity in production.

### Other Activity gotchas worth knowing

- **Effects run on every hide→show, not just mount.** Guard genuine once-per-mount logic with a ref; refs survive the cycle ([Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state), 16.2.11).
- **Hidden routes stay in the DOM with `display: none`.** This breaks naive E2E selectors — the same docs recommend Playwright's `getByRole`, which filters by visibility via the accessibility tree. Relevant if this project adds browser tests to its current Vitest setup.
- **Transient UI must be reset explicitly.** A dialog or dropdown left open when navigating away will still be open on return; reset it in a `useLayoutEffect` cleanup.

---

## 8. Recommendation

**Enable `cacheComponents: true`.** It is the direction of travel — the flag is top-level rather than experimental, `cacheLife`/`cacheTag` have already dropped their `unstable_` prefixes, and the source carries a `TODO: Remove this once we've made Cache Components the default`. Adopting it on a greenfield two-page app costs almost nothing and avoids a later migration.

But adopt it with clear eyes about where the value is:

| Surface | Verdict | Why |
|---|---|---|
| **Landing page** | **Earns its place** | Static shell today; `use cache` gives a clean path to streaming a live stat later without making the route dynamic |
| **Wheel** | **Neutral** | Already a fully static, `localStorage`-driven client page. No change |
| **Estimation room** | **Ceremony** | No server-side dynamic hole exists. The shell is free without the flag; realtime arrives over a websocket PPR knows nothing about |

**Concrete guidance for the room:**

1. Do **not** use `preloadQuery`. It converts a free static shell into a dynamic route, adds a Convex round trip to the response critical path, and delivers data that is stale on arrival.
2. Do **not** add `Suspense` boundaries hoping for streaming wins. Add exactly one, to satisfy the `params` promise — or use `loading.tsx`, or pass the promise down and `use()` it client-side.
3. Never use multiple `preloadQuery` calls on one page. Convex's HTTP client gives no cross-call consistency guarantee, and PPR's parallel-boundary model makes this failure mode easy to walk into.
4. Budget real attention for **Activity**, not for streaming. Route state preservation is the change that will actually affect this app's behaviour: stale-data flashes on the Convex side, and `invoke` restarts on the XState side.

**The one-line answer to the owner's question:** the feature is Cache Components, it is genuinely beta and worth turning on, and it composes with Convex without conflict — but on the estimation room it is a no-op dressed as an optimisation. The real win it delivers to a Convex app is not streaming; it is that the room's static shell paints instantly while the websocket connects, and that is behaviour the App Router already gave you.

---

## Sources

Every claim above traces to one of these. Version applicability noted.

**Installed package (version-exact, `next@16.1.6`)**
- `node_modules/next/package.json` — installed version
- `node_modules/next/dist/server/config-shared.d.ts` — `cacheComponents`, deprecated `experimental.ppr`, deprecated `experimental.cacheComponents`, top-level `htmlLimitedBots`, `NextConfigComplete` defaults
- `node_modules/next/dist/server/config.js` — `HardDeprecatedConfigError` for `experimental.ppr`; `warnOptionHasBeenMovedOutOfExperimental`; `__NEXT_CACHE_COMPONENTS` escape hatch and the "make Cache Components the default" TODO
- `node_modules/next/dist/server/lib/app-info-log.js` — Cache Components logged separately from experimental features
- `node_modules/next/cache.d.ts` — stable `cacheLife`/`cacheTag`, `updateTag`, `refresh`; built-in cache profiles
- `node_modules/next/dist/compiled/next-server/app-page.runtime.dev.js` — the `blocking-route` error string

**Pinned canary (version-exact, `next@16.3.0-canary.96`)**
- `https://unpkg.com/next@16.3.0-canary.96/dist/server/config-shared.d.ts` — confirms `cacheComponents` shape unchanged; adds `partialPrefetching`

**Official Next.js docs** (pages report `version: 16.2.11`, `lastUpdated: 2026-05-13`)
- [`cacheComponents` config reference](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents) — PPR as default behaviour, version history, Activity navigation
- [Caching (getting started)](https://nextjs.org/docs/app/getting-started/caching) — how rendering works, static shell, streaming uncached data, opting out of the shell
- [Preserving UI state with Activity](https://nextjs.org/docs/app/guides/preserving-ui-state) — effect cleanup on hide, 3-route limit, testing implications
- [`Uncached data was accessed outside of <Suspense>`](https://nextjs.org/docs/messages/blocking-route) — enforcement rules, `params` trigger, `--debug-prerender`
- [Version 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — PPR removal, `dynamicIO`/`useCache` deprecation, `cacheLife`/`cacheTag` stable

**Official Next.js blog**
- [Next.js 15.4](https://nextjs.org/blog/next-15-4) — the "**Cache Components (beta)**" label (applies to 15.4, previewing 16.0)
- [Next.js 16](https://nextjs.org/blog/next-16) — Cache Components announcement, PPR flag removal (16.0)

**Convex** (Next.js server rendering support is marked beta by Convex)
- [Next.js Server Rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering) — client components render a loading state; `preloadQuery` uses `no-store` and forfeits static rendering; `preloadQuery`/`fetchQuery` use the stateless `ConvexHTTPClient` with no cross-call consistency

**XState**
- [`stopRootWithRehydration.ts`](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/src/stopRootWithRehydration.ts) (`main`) — snapshot rehydration explicitly written to simulate the Offscreen/Activity API
- [`useActorRef.ts`](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/src/useActorRef.ts) (`main`) — actor started in an effect, stopped with rehydration on cleanup
