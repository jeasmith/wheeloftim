# Convex + XState + Next.js App Router

Research notes for extending Wheel of Tim into a two-product platform, where the
second product is real-time multiplayer estimation poker.

**Status:** research only. Nothing here has been implemented or installed.
**Researched:** 2026-07-26, against official Convex docs, official XState/Stately
docs, official Next.js docs, the Flags SDK docs, and the published source of
`convex-js`, `convex-backend`, `convex-helpers` and `xstate`.

**How to read this:** sections 1–8 answer the eight questions in the ticket.
Section 9 is the friction log — the places where the three technologies genuinely
pull against each other. Section 10 is the recommendation.

---

## 0. Answer in one paragraph

Convex owns every fact that two people in the room must agree on; XState owns
every fact that dies when you close the tab. The reveal state of a poker round is
the former, so it lives in Convex and is enforced by the query function stripping
unrevealed votes before they reach the wire. The client machine never *stores* the
room as authoritative context — it receives the server's projection as events and
models only the local interaction lifecycle (joining, submitting, disconnected,
retrying). Convex and Vercel do not really conflict: Vercel keeps hosting, routing,
proxy, flags and analytics; Convex takes the entire data plane. Convex even ships
as a Vercel Marketplace product. The one real casualty is static rendering of any
page that preloads Convex data.

---

## 1. Who owns what state?

### 1.1 There is no official integration, and that is fine

There is no first-party XState↔Convex adapter, and no Convex-published guidance on
using a state machine library. That is not a red flag: the two libraries answer
different questions. Convex answers *"what is true?"*; XState answers *"what is
this client doing about it?"*

The closest thing to authoritative guidance comes from David Khourshid (XState's
author), answering the same question about TanStack Query in
[statelyai/xstate discussion #1813](https://github.com/statelyai/xstate/discussions/1813):

> XState is conceptually a state orchestrator, so it's responsible for
> orchestrating both client- and server-side state, and more. However, **that
> doesn't mean it has to be responsible for managing server-side state**, but the
> way it manages it is ideally framework-agnostic (and, in this case, ideally
> separate from the notion of React components).

Read that as: the machine may *react to* and *orchestrate around* server state
without *owning* it. That is exactly the split below.

### 1.2 What makes Convex the authority

Three properties of Convex queries mean any attempt to mirror server state in
machine context is strictly worse than reading it directly:

- **Reactivity.** `useQuery` subscribes over a WebSocket; when the underlying data
  changes the component re-renders with the new result, with no polling or manual
  invalidation ([Convex React](https://docs.convex.dev/client/react/overview#reactivity),
  [Under the hood](https://docs.convex.dev/client/react/overview#under-the-hood)).
- **Consistency.** Convex guarantees that all `useQuery` call sites in your app
  render a single consistent snapshot of the database — you cannot get a UI where
  one subscription has the new data and another has the old
  ([Consistency](https://docs.convex.dev/client/react/overview#consistency)).
  A machine that caches a copy of server state in `context` re-introduces exactly
  the inconsistency Convex spent effort eliminating.
- **Mutation durability.** Convex React retries mutations until they are confirmed
  written, guarantees exactly-once execution despite retries, and warns the user
  if they try to close the tab with mutations outstanding
  ([Retries](https://docs.convex.dev/client/react/overview#retries)). A hand-rolled
  retry region in a machine would duplicate this, worse.

### 1.3 The split

| Fact | Owner | Why |
| --- | --- | --- |
| Room exists, room code, deck | Convex | Everyone must agree |
| Who is in the room | Convex (Presence component) | Everyone must agree |
| Current round, `revealedAt` | Convex | Everyone must agree; it's the security boundary |
| Individual votes | Convex | Everyone must agree; must be withheld server-side |
| "I have typed a name but not joined yet" | XState | Dies with the tab |
| "My vote is in flight / failed / retrying" | XState | Per-client interaction lifecycle |
| "Show the reveal animation, then the tally" | XState | Presentation timing, per-client |
| "Socket is disconnected, show the stale banner" | XState | Per-client, driven by client transport |
| Wheel spin animation phase (product 1) | XState | Pure client-side, no server involvement |

The rule of thumb, in one line: **if two browsers must agree on it, Convex owns
it; if it evaporates on refresh and nobody else notices, XState owns it; if it can
be derived, derive it at read time and store it nowhere.**

### 1.4 The deep module that makes this bearable

Per Ousterhout, the point of the split is that *neither* Convex nor XState should
be visible to the UI. Define one module per product surface whose interface is the
narrow thing components consume:

```ts
// lib/poker/useRoomSession.ts — the only module that imports convex/react or xstate
export interface RoomSession {
  phase: "joining" | "voting" | "revealing" | "revealed";
  participants: Participant[];      // from Convex
  myVote: Card | null;              // from Convex (only ever my own)
  tally: Tally | null;              // from Convex, null until revealed
  submission: "idle" | "pending" | "failed";  // from XState
  connection: "live" | "stale";     // from XState, fed by Convex transport
  vote(card: Card): void;
  reveal(): void;
  startNextRound(): void;
}
```

Components import `useRoomSession`. They never see `api.poker.*`, never see a
machine snapshot, never see `undefined`-means-loading. Swapping the state library,
or moving a fact from client to server, becomes a change inside one module. This
is also what makes Storybook and Chromatic cheap (§8.3): stories render the
presentational components with a plain `RoomSession` object.

---

## 2. Convex, RSC and the App Router

### 2.1 What must be a client component

Anything reactive. Convex is explicit:

> To keep your UI automatically reactive to changes in your Convex database it
> needs to use Client Components. The `ConvexReactClient` will maintain a
> connection to your deployment and will get updates as data changes and **that
> must happen on the client**.
> — [Convex + Next.js App Router](https://docs.convex.dev/client/nextjs/app-router/)

So `ConvexProvider` is a `"use client"` boundary, and every component calling
`useQuery`/`useMutation` is inside it. Next.js's own guidance is that the provider
should wrap `{children}` as deep in the tree as possible rather than the whole
document, so the static parts of your Server Components stay optimizable
([Context providers](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers)).
Note also that `"use client"` is a *module graph* boundary: Server Components
passed as `children` to a client component are still rendered on the server
([Interleaving](https://nextjs.org/docs/app/getting-started/server-and-client-components#interleaving-server-and-client-components)).
That's the escape hatch for keeping marketing copy, headers and layout on the
server while the live poker table is a client island.

### 2.2 What Convex's Next.js integration actually gives you

`convex/nextjs` exports four server-side functions. Server rendering support is
flagged **beta** in the docs
([Server Rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering)):

- **`preloadQuery(query, args?, options?)`** — call in a Server Component, pass the
  opaque `Preloaded` payload to a client component, which calls
  `usePreloadedQuery(preloaded)`. You get server-rendered initial data **and**
  continued reactivity after hydration. This is the one that matters for us.
- **`preloadedQueryResult(preloaded)`** — read the value server-side, e.g. to decide
  whether to render the client component at all (room exists? 404 if not).
- **`fetchQuery` / `fetchMutation` / `fetchAction`** — one-shot, non-reactive, for
  Server Components, Server Actions and Route Handlers.

Two constraints from the same page that shape the architecture:

1. **`preloadQuery` uses `cache: 'no-store'`, so any Server Component using it is
   not eligible for static rendering.** That is a real cost, discussed in §9.4.
2. **`preloadQuery`/`fetchQuery` use the stateless `ConvexHTTPClient`, so two calls
   are not guaranteed to see the same database state.** The docs say plainly:
   "To prevent rendering an inconsistent UI avoid using multiple `preloadQuery`
   calls on the same page." One preload per page, then let the reactive client
   client take over.

Deployment URL comes from `NEXT_PUBLIC_CONVEX_URL`, or an explicit `url` option in
the third argument.

### 2.3 Practical shape for a room page

```tsx
// app/poker/[roomId]/page.tsx — Server Component
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { RoomClient } from "./RoomClient";

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  // ONE preload only — see the consistency note above.
  const preloadedRoom = await preloadQuery(api.poker.roomView, { roomId });
  if (preloadedQueryResult(preloadedRoom) === null) notFound();
  return <RoomClient preloadedRoom={preloadedRoom} />;
}
```

```tsx
// app/poker/[roomId]/RoomClient.tsx
"use client";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import type { api } from "@/convex/_generated/api";

export function RoomClient({ preloadedRoom }: { preloadedRoom: Preloaded<typeof api.poker.roomView> }) {
  const room = usePreloadedQuery(preloadedRoom); // server-rendered, then live
  // ...
}
```

---

## 3. XState in React 19: the current API

`@xstate/react` is at **6.1.0** and declares `react: "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"`
as a peer dependency, with React 19 in its own devDependencies
([package.json](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/package.json)).
React 19 is supported; there is no React-19-specific API.

The public surface is small. From
[`packages/xstate-react/src/index.ts`](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/src/index.ts):

```ts
export { createActorContext } from './createActorContext.ts';
export { shallowEqual } from './shallowEqual.ts';
export { useActor } from './useActor.ts';
export { useActorRef } from './useActorRef.ts';
export { useSelector } from './useSelector.ts';

// deprecated
export { useMachine } from './useMachine.ts';
```

**`useMachine` is marked deprecated in source.** The docs describe it as "an alias
for the `useActor(...)` hook"
([@xstate/react](https://stately.ai/docs/xstate-react#usemachinemachine-options)),
so it still works, but new code should not use it.

Recommended usage, per the same docs:

- **`useActorRef(logic, options?)`** returns a static actor reference that **does
  not re-render** when state changes. The docs recommend it "when you want
  fine-grained control, e.g. to add logging, or minimize re-renders", in contrast
  to `useActor(...)` "that would flush each update from the machine to the React
  component".
- **`useSelector(actorRef, selector, compare?)`** subscribes to a slice and only
  re-renders "if the selected value changes, as determined by the optional
  `compare` function". Selectors should be defined outside the component. For
  object/array selections, use the exported `shallowEqual` comparator, because the
  default comparison is `===`.
- **`createActorContext(logic)`** gives you `Provider`, `useSelector` and
  `useActorRef` bound to one actor via React Context — the right shape for "one
  machine per room page, consumed by several components".
- **`setup({ types, actors, actions, guards }).createMachine(...)`** is the v5 way
  to declare a machine with strong typing and named implementations
  ([Setup](https://stately.ai/docs/setup)). Named actors are what let us swap the
  real Convex subscription for a fake one in tests via `machine.provide({ actors })`.

For this project: **`createActorContext` + `useSelector`, never `useMachine`.**
Selecting slices rather than consuming whole snapshots matters here because a
poker room gets a server push every time anyone joins, votes or reveals, and we
don't want the whole subtree re-rendering on each one.

---

## 4. Driving a machine from a Convex subscription

There are three viable bridges. They differ in how much React is in the loop.

### 4.1 Option A — `useEffect` → `send` (simplest, React in the loop)

Take the reactive value from the hook and send it as an event. This is the
approach Khourshid describes for React Query in the
[State Machines and Actors with XState v5 webinar](https://www.youtube.com/watch?v=1NsSHkao-q4)
("if data comes in you could just … send `{type: 'data'}` and pass the data in
there … everything is abstracted in this single abstraction called an event").
Mechanically:

```tsx
"use client";
const room = useQuery(api.poker.roomView, { roomId });   // reactive
const actorRef = RoomMachineContext.useActorRef();

useEffect(() => {
  if (room === undefined) return;                        // still loading
  actorRef.send({ type: "server.room", room });
}, [room, actorRef]);
```

Honest assessment: this works, it is obvious, and it is what most people do. Its
weaknesses are that the machine's inputs are now tied to a component's render
cycle (the thing Khourshid explicitly called non-ideal in
[#1813](https://github.com/statelyai/xstate/discussions/1813)), and that the
subscription lifetime is the component's lifetime, not the actor's.

### 4.2 Option B — invoke a `fromCallback` actor that wraps the subscription (recommended)

XState's `fromCallback` is designed for precisely this: wrap an external event
source, `sendBack(...)` events to the parent, and return a cleanup function
([Callback Actors](https://stately.ai/docs/callback-actors)). Convex exposes a
non-React subscription primitive that fits it exactly:
`ConvexReactClient.watchQuery(query, args)` returns a
[`Watch`](https://docs.convex.dev/api/interfaces/react.Watch) with
`onUpdate(callback)` (returns an unsubscribe function) and `localQueryResult()`
(returns the current value or `undefined`). Note the documented gotcha: `onUpdate`
is **not** invoked for a result already present locally, so you must read
`localQueryResult()` once on start.

```ts
// lib/poker/roomSubscription.ts
import { fromCallback, type EventObject } from "xstate";
import type { ConvexReactClient } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { RoomView } from "./types";

type Input = { client: ConvexReactClient; roomId: string };

export const roomSubscription = fromCallback<EventObject, Input>(
  ({ sendBack, input }) => {
    const watch = input.client.watchQuery(api.poker.roomView, { roomId: input.roomId });

    const push = () => {
      const room = watch.localQueryResult();
      if (room !== undefined) sendBack({ type: "server.room", room });
    };

    const unsubscribe = watch.onUpdate(push);
    push(); // onUpdate does not fire for an already-known local result
    return unsubscribe;
  },
);
```

```ts
// lib/poker/roomMachine.ts
import { setup, assign } from "xstate";
import { roomSubscription } from "./roomSubscription";

type RoomInput = { client: ConvexReactClient; roomId: string };

export const roomMachine = setup({
  types: {
    context: {} as { source: RoomInput; room: RoomView | null; error: string | null },
    events: {} as
      | { type: "server.room"; room: RoomView }
      | { type: "vote"; card: Card }
      | { type: "vote.ok" }
      | { type: "vote.failed"; message: string },
    input: {} as RoomInput,
  },
  actors: { roomSubscription },   // named → swappable in tests and Storybook
}).createMachine({
  context: ({ input }) => ({ source: input, room: null, error: null }),
  invoke: {
    id: "room",
    src: "roomSubscription",
    input: ({ context }) => context.source,
  },
  initial: "loading",
  on: {
    // Server truth is absorbed, never invented.
    "server.room": { actions: assign({ room: ({ event }) => event.room }) },
  },
  states: {
    loading: { always: { guard: ({ context }) => context.room !== null, target: "live" } },
    live: {
      initial: "idle",
      states: {
        idle:    { on: { vote: "submitting" } },
        submitting: {
          on: { "vote.ok": "idle", "vote.failed": "failed" },
        },
        failed:  { on: { vote: "submitting" } },
      },
    },
  },
});
```

Why this is the better shape: the subscription's lifetime is the *actor's*
lifetime, the machine is testable without React at all (start the actor with a
fake `roomSubscription` via `machine.provide({ actors: { roomSubscription: fake } })`),
and the component is reduced to `useSelector` calls.

The same trick applies to transport state:
[`client.subscribeToConnectionState(cb)`](https://docs.convex.dev/api/classes/react.ConvexReactClient#subscribetoconnectionstate)
returns an unsubscribe function and is a natural second `fromCallback` actor
feeding a parallel `connection` region. The Convex docs mark this API as
**unstable**, so wrap it behind our own module rather than sprinkling it around.

### 4.3 Option C — `fromObservable`

`fromObservable(({ input }) => observable)` exists and is the idiomatic wrapper for
RxJS-style sources ([Observable Actors](https://stately.ai/docs/observable-actors)).
Convex does not expose an `Observable`, so you would write an adapter around
`watchQuery().onUpdate` anyway — which is what Option B does, with one less
dependency and no RxJS. Skip it.

### 4.4 The rule that keeps the machine from fighting you

Only one place in the whole machine may `assign` to `context.room`: the
`server.room` handler. No mutation success handler, no optimistic path, no guard
may write domain facts into context. If you obey that, the machine cannot diverge
from the server, and "the machine is stale" ceases to be a class of bug. Optimism
is Convex's job anyway — see
[Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates),
which applies the local change to the *query result*, so it flows back through the
same `server.room` channel.

---

## 5. Multiplayer: hidden votes and presence

### 5.1 Yes, Convex query functions can filter per user, and that is the right place

A Convex query is an ordinary server-side function with a
[`QueryCtx`](https://docs.convex.dev/generated-api/server#queryctx); whatever it
returns is what goes over the WebSocket. Nothing else is sent. So "hide unrevealed
votes" is implemented by not putting them in the return value:

```ts
// convex/poker.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const roomView = query({
  args: { roomId: v.string(), sessionId: v.string() },
  handler: async (ctx, { roomId, sessionId }) => {
    const room = await ctx.db
      .query("rooms").withIndex("by_code", (q) => q.eq("code", roomId)).unique();
    if (room === null) return null;

    const votes = await ctx.db
      .query("votes").withIndex("by_round", (q) => q.eq("roundId", room.currentRoundId)).collect();

    const revealed = room.revealedAt !== undefined;

    return {
      code: room.code,
      revealed,
      // Everyone sees WHO has voted. Nobody sees WHAT until reveal.
      voters: votes.map((v) => ({ sessionId: v.sessionId, hasVoted: true })),
      // My own card is mine to see.
      myVote: votes.find((v) => v.sessionId === sessionId)?.card ?? null,
      // Values only exist in the payload once the server says so.
      cards: revealed ? votes.map((v) => ({ sessionId: v.sessionId, card: v.card })) : null,
      tally: revealed ? tallyOf(votes) : null,
    };
  },
});
```

The `cards`/`tally` fields are *absent from the payload* pre-reveal. Not hidden by
CSS, not filtered client-side — never serialised. That satisfies the mandate.
(This sketch is deliberately one function for readability; point (b) below argues
for splitting the per-user `myVote` out into its own query, which is what the
recommendation in §10 assumes.)

Reveal is a mutation that sets `revealedAt`; Convex's reactivity then re-runs every
subscribed `roomView` and pushes the newly-visible cards to all clients
([Realtime](https://docs.convex.dev/realtime)). There is no fan-out code to write.

Two things to get right:

**(a) The per-user argument must be unguessable.** Convex's best-practices page is
explicit:

> Access control checks should either use `ctx.auth.getUserIdentity()` or a
> function argument that is **unguessable** (e.g. a UUID, or a Convex ID, provided
> that this ID is never exposed to any client but the one user). In particular,
> don't use a function argument which could be spoofed (e.g. email) for access
> control checks.
> — [Use some form of access control for all public functions](https://docs.convex.dev/understanding/best-practices/#use-some-form-of-access-control-for-all-public-functions)

If the poker product ships without login (likely, for a team tool), the per-user
key is a client-generated session UUID. `convex-helpers` has exactly this:
`SessionProvider` + `useSessionQuery` on the client and `SessionIdArg` +
`customQuery` on the server, so `sessionId` is threaded automatically rather than
passed by hand
([convex-helpers: session tracking](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md#session-tracking-via-client-side-sessionid-storage)).
Be honest about the threat model: a session UUID protects against *casual* peeking
(a colleague opening devtools on their own machine), not against someone who has
obtained another player's UUID. For estimation poker among a team that is a
reasonable trade; write it down rather than discovering it later.

**(b) Per-user reads cost you cache sharing.** Convex's cache key includes the
caller's identity *only if the query read `ctx.auth`* — see
[`RequestedCacheKey`/`StoredCacheKey` in the backend source](https://github.com/get-convex/convex-backend/blob/main/crates/application/src/cache/mod.rs),
where the comment reads "if a query does not check `ctx.auth`, then
`RequestedCacheKey` contains the identity, but `StoredCacheKey` does not", and the
`identity: None` variant is documented as "queries that did not read `ctx.auth`".
Passing `sessionId` as an *argument* has the same effect via a different mechanism:
different args are different cache entries. Convex's own Presence component warns
about this in its example code — "Avoid adding per-user reads so all subscriptions
can share same cache"
([presence README](https://github.com/get-convex/presence/blob/main/README.md)).

The practical consequence: **split the query.** One shared, cache-friendly query
returning the room-wide view (who's here, who has voted, revealed?, tally when
revealed) with no per-user reads, and one tiny per-user query returning just
`myVote`. Two subscriptions, but Convex guarantees they render consistently
([Consistency](https://docs.convex.dev/client/react/overview#consistency)), and the
expensive one is shared across every participant.

### 5.2 Presence

Convex publishes a first-party **Presence component**,
[`@convex-dev/presence`](https://github.com/get-convex/presence/blob/main/README.md):
"a live-updating list of users in a 'room' including their status for when they
were last online". Install into `convex/convex.config.ts` via `app.use(presence)`,
expose `heartbeat` / `list` / `disconnect` functions, and use the `usePresence`
React hook which handles heartbeats and graceful disconnect on tab close
(`sendBeacon`). The README explains the design: a single deployment-wide
batch-worker sleeps until the next session timeout, so heartbeats do not schedule
work and clients only get updates on real join/leave events. It ships a `FacePile`
component you can use or copy.

Use it. Rolling our own presence means either polling or per-heartbeat query
invalidation, both of which the component exists to avoid.

Note the README's own comment on the `disconnect` mutation: "Can't check auth here
because it's called over http from sendBeacon." Presence identity is therefore
weaker than vote identity — fine, since presence is not a security boundary.

### 5.3 A trap: timers

Convex's best practices say **don't use `Date.now()` in queries**
([why](https://docs.convex.dev/understanding/best-practices/#date-in-queries)):
subscribed queries re-run when *data* changes, not when the clock changes, so a
time-dependent query returns stale results and churns the cache. Anything like
"auto-reveal after 60s" or "round expires" must be either a
[scheduled function](https://docs.convex.dev/scheduling/scheduled-functions) that
flips a boolean field, or a client-side countdown in the XState machine (via
`after`) that sends an explicit reveal mutation. Store `revealedAt` as a fact; do
not compute "is it revealed yet?" from the current time in a query.

---

## 6. Convex vs Vercel-native: where the line is

### 6.1 There is less conflict than the framing suggests

Convex is a **Vercel Marketplace product**: you can create, deploy and pay for
Convex through Vercel, with projects auto-configured to deploy
([Using Convex with Vercel](https://docs.convex.dev/production/hosting/vercel)).
"Prefer Vercel-native" and "use Convex" are not opposed positions; Convex *is* the
Vercel-native answer to "I need a reactive backend", in the same way Neon is the
Vercel-native answer to "I need Postgres".

### 6.2 The division

| Concern | Owner | Evidence |
| --- | --- | --- |
| Hosting, CDN, builds, preview URLs | **Vercel** | [Vercel hosting guide](https://docs.convex.dev/production/hosting/vercel) |
| Proxy / middleware (redirects, rewrites, headers) | **Vercel** | [`proxy.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) |
| Feature flags | **Vercel** (Flags SDK) | [flags-sdk.dev](https://flags-sdk.dev/) |
| Web analytics, Speed Insights | **Vercel** (already in `package.json`) | — |
| Database, schema, indexes | **Convex** | [Schemas](https://docs.convex.dev/database/schemas) |
| Realtime push / subscriptions | **Convex** | [Realtime](https://docs.convex.dev/realtime) |
| Server-side business logic & authorization | **Convex** | [Queries](https://docs.convex.dev/functions/query-functions) |
| Scheduled/background work | **Convex** | [Scheduled functions](https://docs.convex.dev/scheduling/scheduled-functions) |
| File storage | **Convex** | [File storage](https://docs.convex.dev/file-storage/overview) |
| Auth token issuance (if needed) | **Third party** (Clerk / WorkOS / Auth0) | §7 |

Deployment wiring: override the Vercel build command to
`npx convex deploy --cmd 'pnpm build'` and set `CONVEX_DEPLOY_KEY`. Convex preview
deployments give each Vercel preview branch its own isolated backend with its own
data, optionally seeded via `--preview-run 'functionName'`
([Preview Deployments](https://docs.convex.dev/production/hosting/vercel#preview-deployments)).
That is genuinely good and worth adopting: PR previews get a clean database.

### 6.3 Where they actually rub

- **Route Handlers vs Convex HTTP actions.** Both exist; both can receive webhooks.
  Convex's own docs frame Next.js Route Handlers as "similar to Convex HTTP
  Actions" and show calling Convex from them
  ([Server Actions and Route Handlers](https://docs.convex.dev/client/nextjs/app-router/server-rendering#server-actions-and-route-handlers)).
  Pick one per use case and write the rule down. Suggested rule: if the handler
  needs the database, it's a Convex HTTP action; if it's a Vercel-platform concern
  (OG images, flags discovery endpoint), it's a Route Handler.
- **Server Actions.** They work with `fetchMutation`, but they add a hop
  (browser → Vercel function → Convex) for something the browser could do directly
  over the already-open WebSocket, and they lose Convex's automatic mutation
  retries. Prefer `useMutation` from the client; reserve Server Actions for cases
  needing a server-only secret.
- **Caching.** Two caching systems now exist: Next.js's, and Convex's function
  cache. `preloadQuery` sidesteps the first with `no-store`. Do not try to layer
  `use cache` / `cacheLife` over Convex reads; let Convex's cache and reactivity
  do the work.

No genuine blocker. One real cost, in §9.4.

---

## 7. Auth options, if identity arrives later

Convex authenticates with OpenID Connect ID tokens (JWTs), so "most authentication
providers" work ([Authentication](https://docs.convex.dev/auth/overview)). Options,
in the order I'd consider them:

1. **Clerk** — Convex's docs call out that it "has great Next.js and React Native
   support", and there's a scaffold: `npm create convex@latest -- -t nextjs-clerk`.
   Critically, Clerk's Next.js SDK provides tokens on *both* the client (for the
   WebSocket, via `ConvexProviderWithClerk`) and the server (via
   `auth().getToken()` for `preloadQuery`/`fetchQuery`), which is what you need for
   authenticated SSR
   ([server-side auth](https://docs.convex.dev/client/nextjs/app-router/server-rendering#server-side-authentication)).
   One operational gotcha from the hosting docs: **Clerk does not support
   `*.vercel.app` domains, so a custom domain is required**.
2. **WorkOS AuthKit** — Convex lists it as "built for B2B apps and free for up to
   1M users". Plausible fit for a team tool.
3. **Auth0** — "more established with more bells and whistles"; `ConvexProviderWithAuth0`
   is shipped in `convex/react-auth0`.
4. **Convex Auth** (`@convex-dev/auth`) — runs inside your own Convex deployment, no
   third-party signup. But the docs state it is **beta**, has fewer features, and
   "Support for Next.js is under active development … experimental". Not a
   good bet for a Next.js App Router app right now.
5. **No auth (session UUIDs)** — the right starting point for estimation poker, via
   `convex-helpers` sessions (§5.1a). Design the Convex functions so identity is a
   single `ctx`-level concept — `customQuery` lets you inject a resolved caller onto
   `ctx` (the helper's own example adds `ctx.anonymousUser`) — so swapping
   session-UUID for a real identity later touches one file.

In functions, identity is always `await ctx.auth.getUserIdentity()`, returning
`tokenIdentifier`, `subject`, `issuer` plus provider claims
([Auth in Functions](https://docs.convex.dev/auth/functions-auth)).

---

## 8. Testing: this is the strong point

### 8.1 `convex-test` — a JS mock backend, no network

Yes, there is a library, and it is first-party:
[`convex-test`](https://docs.convex.dev/testing/convex-test) "provides a mock
implementation of the Convex backend in JavaScript". It runs under Vitest with
`@edge-runtime/vm`; there is no daemon, no container, no network. Perfect for the
no-integrated-infrastructure constraint.

What it gives you:

- `convexTest(schema, modules)` → `t`, then `t.query(...)`, `t.mutation(...)`,
  `t.action(...)` against public *and* internal functions.
- `t.run(ctx => ...)` to seed the mock database directly.
- `t.withIdentity({ name: "Sarah" })` to exercise auth-dependent branches — the
  docs' own example asserts that Lee cannot see Sarah's tasks. **This is exactly
  the shape of our "unrevealed votes must not reach the wire" test.**
- `t.fetch(...)` for HTTP actions; `vi.useFakeTimers()` +
  `t.finishInProgressScheduledFunctions()` / `t.finishAllScheduledFunctions()` for
  scheduled work — i.e. deterministic, idempotent time control.
- `vi.stubGlobal("fetch", ...)` for third-party calls in actions.

Vitest 4 (which this repo already uses) is explicitly supported via the `projects`
array to run `convex/**` under `edge-runtime` and everything else under `jsdom`:

```ts
// vitest.config.ts — shape from the Convex docs, adapted
export default defineConfig({
  test: {
    projects: [
      { extends: true, test: { name: "convex", include: ["convex/**/*.test.{ts,js}"], environment: "edge-runtime" } },
      { extends: true, test: { name: "frontend", include: ["**/*.test.{ts,tsx}"], exclude: ["convex/**"], environment: "jsdom" } },
    ],
  },
});
```

CI is just `npm run test` in a GitHub Action — Convex's
[CI page](https://docs.convex.dev/testing/ci) shows nothing more than checkout,
setup-node, install, test. No secrets, no deployment.

**Documented limitations** (from the same page — worth quoting in the ADR so nobody
is surprised): error message contents differ; size/time limits are not enforced;
ID formats differ; the runtime is a mock of Vercel's Edge Runtime rather than the
real Convex runtime, so built-in availability can differ; text search doesn't rank;
vector search isn't indexed; **cron jobs are unsupported** (trigger manually). For
higher fidelity there is a real
[local Convex backend](https://docs.convex.dev/testing/convex-backend), but that
needs infrastructure — keep it out of CI.

### 8.2 Testing the machine

XState machines are pure logic: `createActor(machine.provide({ actors: { roomSubscription: fake } }))`,
send events, assert on snapshots. No React, no network, no clock (as long as you
avoid real `after` delays or use fake timers). Because §4.2 makes the subscription a
*named actor*, the fake is a one-line substitution. This is the single biggest
testability argument for Option B over Option A.

### 8.3 Testing React components that call Convex hooks

Three known approaches, in descending order of preference:

1. **Don't.** If §1.4's deep module holds, presentational components take a plain
   `RoomSession` prop and need no Convex at all. This is also what makes Storybook
   and Chromatic viable without a backend, which matters because a story that
   renders `useQuery` will otherwise throw ("a Convex client has not been
   provided").
2. **Inject a fake client into `ConvexProvider`.** Convex's own dashboard Storybook
   does this: `mockConvexReactClient().registerQueryFake(someQuery, () => value)`
   wrapped in a `<ConvexProvider client={mockClient}>` decorator, with the comment
   "DeploymentProvider normally creates a real ConvexReactClient that opens a
   WebSocket connection. Replace the real provider chain with a lightweight
   ConvexProvider backed by a mock client"
   ([docsPageDecorator.tsx](https://github.com/get-convex/convex-backend/blob/main/npm-packages/dashboard-storybook/.storybook/docsPageDecorator.tsx)).
   That helper is internal to the Convex repo, not published — but it is ~50 lines
   and is the pattern to copy for our own `.storybook` decorator.
3. **Mock the module.** The Convex Stack article
   [Testing React Components with Convex](https://stack.convex.dev/testing-react-components-with-convex)
   shows `vi.mock("convex/react", ...)` overriding `useQueryGeneric`/`useMutationGeneric`
   ("Not a typo! useQuery in code calls useQueryGeneric under the hood!"). Note that
   this article is old — it references a `ConvexReactClientFake` at
   `convex-helpers/src/fakeConvexClient`, a path that no longer exists in
   `convex-helpers` `main`. Treat it as a pattern, not a dependency, and verify
   before relying on it.

---

## 9. Friction log — where these genuinely fight

### 9.1 Two homes for the same fact (the central tension)

Unavoidable in principle, tractable in practice. Mitigation is the discipline in
§4.4: exactly one `assign` may write domain facts, fed only by the server. If a
reviewer sees `assign({ revealed: true })` anywhere near a mutation callback, that's
the bug.

### 9.2 `undefined` is overloaded

`useQuery` returns `undefined` while loading
([Fetching data](https://docs.convex.dev/client/react/overview#fetching-data)), and
separately, a query returning `undefined` is "**translated to `null`** on the
client" ([Query responses](https://docs.convex.dev/functions/query-functions#query-responses)).
So `undefined` = "no answer yet" and `null` = "the answer is nothing". A machine
that treats these the same will show "room not found" during load. Encode both as
distinct machine states (`loading` vs `notFound`). Convex has an experimental
`useQuery_experimental` returning a `{ status: "pending" | "success" | "error" }`
object which is a much better fit for machine events — but it is experimental, so
wrap it if used.

### 9.3 Push-based data vs re-render-avoiding actors

Convex pushes; `useActorRef` deliberately doesn't re-render. Option A (§4.1) bridges
them through React's render cycle, which reintroduces the coupling XState is trying
to avoid. Option B (§4.2) resolves it cleanly — but it requires reaching past
`useQuery` to `watchQuery`, an API Convex explicitly marks "**Most application code
should not call this method directly**". That warning is about people hand-rolling
`useQuery`; using it inside an actor is a legitimate different use case, but it is
a lower-level API and should be confined to one file so an API change costs one
edit.

### 9.4 `preloadQuery` kills static rendering (the real Vercel/Convex cost)

`preloadQuery` uses `cache: 'no-store'`, so "any Server Components using it will
not be eligible for static rendering"
([Server Rendering](https://docs.convex.dev/client/nextjs/app-router/server-rendering)).
Meanwhile the Flags SDK's entire `precompute` mechanism exists to *preserve* static
rendering when flags vary a page
([Precompute](https://flags-sdk.dev/docs/frameworks/next/precompute)). On a page
that both preloads Convex data and reads a flag, precompute buys you nothing —
the page is dynamic regardless. It is not a breakage, but the two features' value
propositions cancel out.

Sensible resolution: keep the marketing/landing surfaces flag-driven and static; on
the live room page, skip `preloadQuery` entirely and accept a client-side loading
state (Convex's default behaviour: "Client Components will not wait for Convex data
to be loaded, and your UI will render in a 'loading' state"). A poker room is
behind a room code and is not SEO-relevant; a well-designed skeleton beats a
dynamic render. Use `preloadQuery` only where first paint with real data actually
matters.

### 9.5 Flags are server-only; the reactive UI is client-only

The Flags SDK is deliberately server-evaluated — Max Stoiber's endorsement quoted
on [flags-sdk.dev](https://flags-sdk.dev/) names "Server-only → No client-side
loading spinners" as a *feature*. `flag()` is called from a Server Component,
Route Handler or proxy. Our live poker UI is a client island. So **flag values must
be evaluated in the Server Component and passed as props** across the `"use client"`
boundary. That's easy but it must be a convention, or someone will try to call a
flag inside a client component and be confused.

Also worth flagging for Next 16: the Flags SDK's precompute docs now show
`proxy.ts`, matching Next.js's rename — "The `middleware` file convention is
deprecated and has been renamed to `proxy`"
([proxy.js reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)).
And `precompute` requires a `FLAGS_SECRET` env var (32 random bytes, base64) —
which contradicts today's "no environment variable to configure" property of this
repo. Adding Convex adds `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOY_KEY` anyway.

### 9.6 Convex server rendering is beta

The whole App Router server-rendering surface (`preloadQuery` and friends) is
labelled a **beta feature** by Convex. §9.4's advice (avoid `preloadQuery` on the
room page) conveniently also reduces exposure to it.

### 9.7 Determinism, if you ever run the machine server-side

There is an attractive idea here: run the *same* XState machine inside a Convex
mutation as the round's reducer, persisting `getPersistedSnapshot()`. It can work —
machines are pure — but Convex query/mutation handlers must be deterministic
([Caching & reactivity & consistency](https://docs.convex.dev/functions/query-functions#caching--reactivity--consistency)),
which rules out `after` delays, `Math.random()` in guards, and `Date.now()` in
queries (§5.3). It also couples your database contents to a machine's internal
snapshot format, so a machine refactor becomes a data migration. **Recommendation:
don't.** Model the server as plain documents with a `status` field; keep statecharts
on the client. If server-side workflow orchestration is genuinely wanted later,
evaluate it as its own decision.

### 9.8 TypeScript 7

This repo pins `typescript@7.0.2`. Both `xstate`'s `setup()` and Convex's generated
`api` object lean hard on deep generic inference, and neither project's published
devDependencies target TS 7 yet (`convex-js` builds against `typescript ~5.0.3`;
XState's docs say "version 5.0 or higher"). Nothing suggests breakage — TS 7 targets
compatibility — but this is unverified for these two libraries specifically.
**Action: prove it with a spike before committing**, e.g. a throwaway machine plus a
generated `api` type, type-checked with `tsc --noEmit`. Cheap to test, expensive to
discover late.

### 9.9 Convex components need a `convex/` directory and codegen

`@convex-dev/presence` requires `convex/convex.config.ts` with `app.use(presence)`,
and the generated `convex/_generated/api` must exist before types resolve. That
means `npx convex dev` (or `convex codegen`) becomes part of local setup and CI
typechecking must cope with generated files. This repo currently has no generated
artifacts at all; that changes.

---

## 10. Recommendation

### (a) State-ownership split

**Convex is the single source of truth for every domain fact. XState models only
the local interaction lifecycle. The machine absorbs server state as events and
never invents it.**

Concretely:

1. Convex owns: rooms, rounds, participants, votes, `revealedAt`. Reveal is a
   server fact enforced by a query that omits unrevealed card values from its
   return value (§5.1). Presence comes from `@convex-dev/presence`, not homegrown.
2. Split the room query into a shared, cache-friendly room-wide view plus a tiny
   per-user `myVote` query, to keep the expensive subscription shareable (§5.1b).
3. One `roomMachine` per room page, provided by `createActorContext`, consumed via
   `useSelector`. Never `useMachine` (deprecated in source).
4. The machine's server input is an invoked `fromCallback` actor wrapping
   `client.watchQuery(...).onUpdate(...)` (§4.2), declared as a **named actor** in
   `setup({ actors })` so tests and Storybook swap in a fake. A second callback
   actor wraps `subscribeToConnectionState` for the live/stale banner.
5. Exactly one transition may `assign` domain facts, keyed on `server.room`. Enforce
   in review.
6. Wrap all of the above in a `useRoomSession()` deep module (§1.4). No component
   outside `lib/poker/` imports `convex/react` or `xstate`. This is the interface
   Storybook stories, Chromatic snapshots and unit tests target.
7. Product 1 (the wheel) stays client-only with `localStorage` and gets an XState
   machine for its spin lifecycle. No Convex. The two products share the deep-module
   convention, not a backend.

### (b) Convex / Vercel boundary

**Vercel owns the edge and the delivery of the app; Convex owns the data plane.
Everything in between goes to whichever one already solved it.**

- Vercel: hosting, builds, preview deployments, `proxy.ts`, Flags SDK, Analytics,
  Speed Insights. Build command becomes `npx convex deploy --cmd 'pnpm build'` with
  `CONVEX_DEPLOY_KEY` set per-environment; adopt Convex preview deployments so each
  PR preview gets an isolated database.
- Convex: schema, queries, mutations, actions, scheduled functions, file storage,
  authorization, realtime. Webhooks that touch data become Convex HTTP actions, not
  Route Handlers.
- Prefer `useMutation` over Server Actions for writes: fewer hops and you keep
  Convex's automatic mutation retry and exactly-once semantics.
- Flags are evaluated in Server Components and passed as props into client islands.
  Don't attempt `precompute` on pages that also preload Convex data — it buys
  nothing there (§9.4).
- Auth: ship with session UUIDs via `convex-helpers`; when identity is needed,
  Clerk (with a custom domain — Clerk rejects `*.vercel.app`).

### Testing posture

`convex-test` under Vitest 4 `projects` (`edge-runtime` for `convex/**`, `jsdom`
elsewhere) gives fully offline, idempotent backend tests, including the critical
one: *a second identity/session must not receive unrevealed card values*. Machines
are tested headlessly with a fake subscription actor. Components are tested and
storybooked against the `RoomSession` interface, with a `mockConvexReactClient`-style
`ConvexProvider` decorator only where a component genuinely must call a hook.

### Before committing, verify

1. TypeScript 7 against `xstate` `setup()` and Convex generated types (§9.8).
2. `@convex-dev/presence` behaviour with anonymous session IDs rather than auth
   identities — the README's auth example assumes real users.
3. That `watchQuery().onUpdate` remains adequate for our use inside an actor, given
   Convex's "most application code should not call this directly" note (§9.3).

---

## Sources

Convex
- [Convex React overview](https://docs.convex.dev/client/react/overview)
- [Next.js App Router](https://docs.convex.dev/client/nextjs/app-router/)
- [Next.js Server Rendering (beta)](https://docs.convex.dev/client/nextjs/app-router/server-rendering)
- [Queries](https://docs.convex.dev/functions/query-functions) · [Schemas](https://docs.convex.dev/database/schemas) · [Realtime](https://docs.convex.dev/realtime)
- [Best practices](https://docs.convex.dev/understanding/best-practices/) (access control, `Date.now()` in queries)
- [Authentication overview](https://docs.convex.dev/auth/overview) · [Auth in Functions](https://docs.convex.dev/auth/functions-auth)
- [Testing overview](https://docs.convex.dev/testing/overview) · [convex-test](https://docs.convex.dev/testing/convex-test) · [CI](https://docs.convex.dev/testing/ci) · [Local backend](https://docs.convex.dev/testing/convex-backend)
- [Hosting on Vercel + preview deployments](https://docs.convex.dev/production/hosting/vercel)
- API: [`ConvexReactClient`](https://docs.convex.dev/api/classes/react.ConvexReactClient) · [`Watch`](https://docs.convex.dev/api/interfaces/react.Watch)
- Source: [`convex-backend` query cache key](https://github.com/get-convex/convex-backend/blob/main/crates/application/src/cache/mod.rs) · [dashboard Storybook mock client decorator](https://github.com/get-convex/convex-backend/blob/main/npm-packages/dashboard-storybook/.storybook/docsPageDecorator.tsx) · [`convex-js` package.json](https://github.com/get-convex/convex-backend/blob/main/npm-packages/convex/package.json)
- Components/helpers: [`@convex-dev/presence`](https://github.com/get-convex/presence/blob/main/README.md) · [`convex-helpers`](https://github.com/get-convex/convex-helpers/blob/main/packages/convex-helpers/README.md)
- Stack: [Testing React Components with Convex](https://stack.convex.dev/testing-react-components-with-convex) (dated; see §8.3)

XState / Stately
- [`@xstate/react`](https://stately.ai/docs/xstate-react) · [`setup`](https://stately.ai/docs/setup) · [Callback actors](https://stately.ai/docs/callback-actors) · [Observable actors](https://stately.ai/docs/observable-actors)
- Source: [`xstate-react/src/index.ts`](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/src/index.ts) · [`xstate-react/package.json`](https://github.com/statelyai/xstate/blob/main/packages/xstate-react/package.json)
- [Discussion #1813 — XState and server state](https://github.com/statelyai/xstate/discussions/1813)
- [Webinar: State Machines and Actors with XState v5](https://www.youtube.com/watch?v=1NsSHkao-q4) (Khourshid on bridging reactive query hooks into machines)

Next.js / Vercel
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [`proxy.js` (middleware renamed)](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Flags SDK](https://flags-sdk.dev/) · [Next.js framework guide](https://flags-sdk.dev/docs/frameworks/next) · [Precompute](https://flags-sdk.dev/docs/frameworks/next/precompute) · [Next.js API reference](https://flags-sdk.dev/docs/api-reference/frameworks/next)
