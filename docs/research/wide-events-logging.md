# Wide events logging for Wheel of Tim

Research note. Written against primary sources: Boris Tane's own writing, Stripe's canonical
log lines post, Charity Majors / Honeycomb's own material, the OpenTelemetry specification, and
the official Vercel, Next.js and Convex docs. Every factual claim below links to the source that
owns it.

**Stack this is written for:** Next.js 16 App Router + React 19 + TypeScript, deployed on Vercel,
with Convex as the backend. Two products: the name-spinner wheel and a real-time multiplayer
estimation poker tool.

---

## 0. Recommendation up front

**Emission pattern — one wide event per unit of work, accumulated in an `AsyncLocalStorage`
request store, flushed once in `after()`.**

Concretely: a `withWideEvent()` wrapper for Route Handlers and Server Actions opens an
`AsyncLocalStorage` store containing a mutable event object seeded with request, deployment and
route context; application code calls `addContext({...})` anywhere in the call tree; the event is
emitted exactly once from `after()` (Next.js's post-response hook, which is backed by Vercel's
`waitUntil`), so emission never blocks the response and still runs on error paths. The same
accumulated fields are also written onto the active OpenTelemetry span via `span.setAttributes()`
when `@vercel/otel` is registered, so the wide event *is* the root span rather than a parallel
data stream. On the Convex side, each query/mutation/action handler builds its own wide event and
emits it as a single `console.log(JSON.stringify(event))` at the end of the handler, correlated to
the Vercel-side event by a trace ID that is **passed explicitly as a function argument** (Convex
`AsyncLocalStorage` does not propagate across `ctx.runQuery`/`runMutation`/`runAction`, and Convex
does not accept a `traceparent` header on the client protocol).

**Destination — Axiom, one dataset, two writers.** Vercel side writes directly with
`@axiomhq/nextjs` (bypassing Vercel Drains and their separate billing line); Convex side uses
Convex's first-party Axiom **Log Stream**. Axiom is the only vendor in this evaluation that both
Vercel and Convex can reach without a self-hosted shim, which is what makes "one logical unit of
work, one queryable event stream across both platforms" achievable without building infrastructure.

Trade-offs, alternatives and the reasoning are in [§9](#9-recommendation-in-full).

---

## 1. What Boris Tane actually argues

Two pieces, both first-party:

- **[Observability wide events 101](https://boristane.com/blog/observability-wide-events-101/)**
  (7 Sep 2024) — the definitional piece.
- **[Logging Sucks](https://loggingsucks.com)** (21 Dec 2025) — the polemic. Note that
  `boristane.com/blog/logging-sucks/` 301-redirects to `loggingsucks.com`; the standalone site is
  the canonical location, and it is linked as "Logging Sucks" from
  [his blog index](https://boristane.com/blog/).

### 1.1 What a wide event is

His definition is deliberately unglamorous:

> "Wide events are a very simple concept: for each request, emit a single context-rich event/log
> per service hop. That's it. Don't let all the buzzwords fool you."
> — [Observability wide events 101](https://boristane.com/blog/observability-wide-events-101/)

And in the glossary of [Logging Sucks](https://loggingsucks.com):

> "**Wide Event**: A single, context-rich log event emitted per request per service. Instead of 13
> log lines for one request, you emit 1 line with 50+ fields containing everything you might need
> to debug."

He names three required properties
([wide events 101](https://boristane.com/blog/observability-wide-events-101/)):

- **high cardinality** — "each field can contain an unbounded number of unique values, such as user
  IDs, session IDs, or transaction IDs. You could have billions of these per day."
- **high dimensionality** — "by definition, wide events should have a large number of fields
  (dimensions) to provide deep insights"
- **context-rich** — "all those fields should carry context about the request, from request headers
  to infrastructure details, and custom business logic data"

### 1.2 Why one event per unit of work beats scattered lines

The core mental-model shift, in his words:

> "Instead of logging what your code is doing, log what happened to this request."
> — [Logging Sucks](https://loggingsucks.com)

The argument has three legs.

**Correlation is the actual problem, and string search can't do it.** From
[Logging Sucks](https://loggingsucks.com): "String search treats logs as bags of characters. It has
no understanding of structure, no concept of relationships, no way to correlate events across
services." He points out that a single user ID may be logged 47 different ways across a codebase —
`user-123`, `user_id=user-123`, `{"userId": "user-123"}`, `[USER:user-123]`,
`processing user: user-123` — and that downstream services may only have logged the order ID, so
you need a second search, and a third. His summary line: *"The fundamental problem: logs are
optimized for writing, not for querying."*

**Scattered lines answer known-unknowns; wide events answer unknown-unknowns.** His worked example
in [wide events 101](https://boristane.com/blog/observability-wide-events-101/) is a blogging
platform where 67 users report that articles they create never appear. Logs say everything is fine
(the articles are in the database) and the metrics charts are flat. With wide events you group by
`article.published`, then by `user.id`, then by `article.published, user.trial`, and discover in
three queries that only free-trial users are posting with `published = false`. His framing: "Logs
and metrics help capture 'known unknowns' … But you are left hanging when it comes to unexpected
behaviour you couldn't predict before your code got into the hands of real users."

**The write-amplification profile is better.** One event per request costs one write regardless of
how many fields you add. In [Logging Sucks](https://loggingsucks.com) he opens with 17 log lines
for a single successful request and notes that at 10,000 concurrent users this is 130,000 log lines
per second, "Most of them saying absolutely nothing useful."

### 1.3 The anti-patterns he names

From the "Misconceptions" sections of both pieces:

| Anti-pattern | His position |
| --- | --- |
| "Structured logging is the same as wide events" | "No. Structured logging means your logs are JSON instead of strings. That's table stakes. Wide events are a philosophy… You can have structured logs that are still useless (5 fields, no user context, scattered across 20 log lines)." ([Logging Sucks](https://loggingsucks.com)) He is blunter in [wide events 101](https://boristane.com/blog/observability-wide-events-101/): "A structured log with 5 fields is not a wide event. A structured log with no context is not a wide event." |
| "We already use OpenTelemetry, so we're good" | "You're using a delivery mechanism. OpenTelemetry doesn't decide what to capture. You do. Most OTel implementations I've seen capture the bare minimum: span name, duration, status. That's not enough." ([Logging Sucks](https://loggingsucks.com)) |
| "This is just tracing with extra steps" | "Tracing gives you request flow across services… Wide events give you context within a service. They're complementary. Ideally, your wide events ARE your trace spans, enriched with all the context you need." ([Logging Sucks](https://loggingsucks.com)) |
| "Logs are for debugging, metrics are for dashboards" | "This distinction is artificial and harmful. Wide events can power both." ([Logging Sucks](https://loggingsucks.com)) |
| "High-cardinality data is expensive and slow" | "It's expensive on legacy logging systems built for low-cardinality string search. Modern columnar databases (ClickHouse, BigQuery, etc.) are specifically designed for high-cardinality, high-dimensionality data." ([Logging Sucks](https://loggingsucks.com)) |
| "Logs, metrics and traces are the 3 pillars of observability" | "This is debunked. There are no pillars of observability… You don't see the 3 pillars of data analytics, why should there be 3 pillars of observability?" ([wide events 101](https://boristane.com/blog/observability-wide-events-101/)) |
| "You must emit a single wide event per service" | He explicitly walks this back: "Earlier I said you should emit a single wide event per service. I lied. There are no rules. Emit as many wide events as you need per request per service. Ideally only one, but there are scenarios where it's very valid to emit more than one… And when emitting the new event, ask yourself if you're not repeating data in both events." ([wide events 101](https://boristane.com/blog/observability-wide-events-101/)) |

He also rejects **naive random sampling** and prescribes **tail sampling** — deciding after the
request completes, based on outcome: "Always keep errors… Always keep slow requests… Always keep
specific users… Randomly sample the rest" at 1–5% ([Logging Sucks](https://loggingsucks.com)).

Finally, note his **log-level scepticism is implicit rather than stated** — he never argues to
delete log levels; that is Charity Majors' argument (see [§2.2](#22-honeycomb--charity-majors)).
Boris's ask is narrower: emit fewer, wider, more queryable events.

### 1.4 The tooling bar he sets

From [wide events 101](https://boristane.com/blog/observability-wide-events-101/), your destination
must be:

- **queryable across any dimension**
- **no pre-aggregation** — "your events should be stored as they are emitted… you should have
  access to the raw data, not just a value that was extracted from a batch of events"
- **fast** — "ideally sub-second; but definitely sub-minute"
- **affordable** — "observability should not bankrupt your application, sampling can drastically
  help here"

He adds, from the vendor side of the table: "I used to be a vendor and hitting all those points is
extremely hard, but you should demand no less from your vendor or your custom-built solution."

### 1.5 Bias disclosure

Boris Tane founded **Baselime**, an observability platform explicitly built for high-cardinality
and high-dimensionality data. [Cloudflare acquired Baselime in April
2024](https://blog.cloudflare.com/cloudflare-acquires-baselime-expands-observability-capabilities/);
in that announcement he describes Baselime as "designed for high cardinality and dimensionality
data, from logs to distributed tracing with OpenTelemetry," and Cloudflare states it anticipated
"sunsetting the Baselime products towards the end of 2024." He subsequently
[led the Workers observability team at Cloudflare](https://boristane.com/) and is now building
[polylane.com](https://boristane.com/), which he plugs at the end of both articles ("because nobody
should be on-call in 2026").

Practical implications for how much weight to give his writing:

- He is **not** a neutral party on "buy a wide-events tool vs. use your platform's built-in logs" —
  he has sold the former twice. His
  [devtools startup retrospective](https://boristane.com/blog/learnings-from-starting-building-and-exiting-a-devtools-startup/)
  notes that "Within 1 week, we built a Vercel integration and instantly doubled our weekly active
  users," which tells you he understands the Vercel-shaped gap commercially as well as technically.
- Conversely, the *technique* he describes is vendor-neutral and predates Baselime by years (Stripe
  2019, Honeycomb 2018–19 — see [§2](#2-the-lineage)). Nothing in the wide-event pattern requires
  buying anything; the pattern is compatible with `console.log(JSON.stringify(event))` into a
  columnar store you already pay for.
- His scepticism of OpenTelemetry ("It's grown to try to do too many things for too many people,
  and that's a problem. Instrumenting an application shouldn't be harder than building the
  application itself" — [wide events
  101](https://boristane.com/blog/observability-wide-events-101/)) is a genuine technical position,
  but it also happens to align with a vendor incentive to sell proprietary SDKs. Charity Majors —
  also a vendor — takes the *opposite* position ("If you aren't using OpenTelemetry, you are going
  to regret that, too"). Treat both as informed opinion rather than fact.

---

## 2. The lineage

### 2.1 Stripe — canonical log lines (2019)

[Stripe's post](https://stripe.com/blog/canonical-log-lines) is the earliest widely-cited writeup
and the shortest to summarise:

> "in addition to their normal log traces, requests also emit one long log line at the end that
> includes many of their key characteristics."

Stripe's own definition of the recap: "A canonical line is one line per request per service that
collates each request's key telemetry." They call it *canonical* "because it's the authoritative
line for a particular request, in the same vein that the IETF's canonical link relation specifies
an authoritative URL."

The implementation detail is the one worth stealing, and it is essentially the pattern this
document recommends:

> "The implementation in Stripe's main API takes the form of a middleware with a post-request step
> that generates the log line. Modules that execute during the lifecycle of the request decorate
> the request's environment with information intended for the canonical log line, which the
> middleware will extract when it finishes."

Their hardening notes matter too: the line is emitted in a Ruby `ensure` block so it still fires
when the middleware stack unwinds on an exception, and the logging statement itself is wrapped in
`begin`/`rescue` so "any problem constructing a canonical line will never fail a request."

Two things Stripe do that Boris and Honeycomb don't emphasise:

1. **They keep the normal log traces too.** Canonical lines are an *addition*, not a replacement:
   "in addition to their normal log traces."
2. **They formalised the schema with a protocol buffer** because engineers had "developed muscle
   memory around the naming of particular fields." Those archived lines then power long-term
   analytics (S3 → Presto/Redshift) *and* a user-facing product surface — the charts in Stripe's
   Developer Dashboard are generated from canonical log lines.

Boris explicitly ties his term to theirs in the [Logging Sucks](https://loggingsucks.com) glossary:
"**Canonical Log Line**: Another term for wide event, popularized by Stripe."

### 2.2 Honeycomb / Charity Majors

Charity Majors' [Logs vs Structured Events](https://charity.wtf/p/logs-vs-structured-events)
(Feb 2019) prescribes the same shape and gives it the name that stuck:

> "You're going to need to replace your log lines and log levels with a different sort of beast:
> arbitrarily wide structured events that describe the request and its context, one event per
> request per service."

Her build-the-blob recipe is verbatim the accumulator pattern:

> "Initialize an empty blob at the beginning, when the request first enters the service. Stuff any
> and all interesting detail about the request into that blob throughout the lifetime of the
> request… Then, when the request is about to exit or error, write the blob off to honeycomb or
> another service or disk somewhere."

Where she goes *further* than Boris:

- **Delete log levels.** "Log levels are another confusing and unnecessary artifact of yesteryear
  that you no longer really need. The more you think of structured events as logs, the more tempted
  you may be to apply the old set of best practices. So just don't think of them as logs at all."
- **Bypass local disk entirely** — "write to a remote service."
- **Store raw, never pre-aggregate.** From [Live Your Best Life With Structured
  Events](https://charity.wtf/p/live-your-best-life-with-structured-events) (2022): "Aggregation is
  a one-way trip. You can always, always derive your pretty metrics and dashboards and aggregates
  from structured events, and you can never go in reverse."
- **Concrete width target.** Same post: "At Honeycomb, the maturely instrumented datasets that we
  see are often 200-500 dimensions wide." That is 4–10× Boris's "50+ fields."
- **Client-side dynamic sampling**, not server-side: "But not dumb, blunt sampling at server side.
  Control it on the client side."
- **Pro-OpenTelemetry**, where Boris is ambivalent: "if you aren't rolling out a solution based on
  arbitrarily wide, structured raw events that are unique and ordered and trace-aware and without
  any aggregation at write time, you are going to regret it. (If you aren't using OpenTelemetry,
  you are going to regret that, too.)"

Honeycomb's corporate framing of the same idea is
["Observability 2.0 vs. Observability 1.0"](https://www.honeycomb.io/blog/one-key-difference-observability1dot0-2dot0):

> "1. Observability 1.0 has three pillars and many sources of truth, scattered across disparate
> tools and formats. 2. Observability 2.0 has one source of truth, wide structured log events, from
> which you can derive all the other data types."

That post is also the clearest statement that *canonical logs and traces are two patterns of the
same thing*: "Some common patterns include canonical logs, organized around each hop of the
request; traces and spans, organized around application logic; or traces emitted as pulses for
long-running jobs, queues, CI/CD pipelines."

### 2.3 OpenTelemetry

OTel is the wire format and the context-propagation mechanism, not the philosophy. Boris's framing
is the useful one:

> "Instead of 'wide event', within the context of distributed tracing, you will say **span**.
> Instead of 'request', you'll say **trace**… if you look at it as a simpler way to generate wide
> events, you're winning."
> — [wide events 101](https://boristane.com/blog/observability-wide-events-101/)

The genuinely new thing OTel contributes over hand-rolled canonical lines is
[context propagation](https://opentelemetry.io/docs/concepts/context-propagation/): the trace ID
and parent span ID travel across process boundaries in a
[W3C `traceparent`](https://www.w3.org/TR/trace-context/) header, so you don't have to invent and
thread your own request ID. That was the acknowledged flaw in Boris's own hand-rolled example:
"how do you propagate the `requestId` we pick up at Line 9 across services and multiple calls."

### 2.4 So: same idea or different?

**Same idea, three vocabularies, one real technical divergence.**

| | Stripe (2019) | Honeycomb / Majors | OpenTelemetry | Boris Tane |
| --- | --- | --- | --- | --- |
| Name | canonical log line | arbitrarily wide structured event | span | wide event |
| Unit | one per request per service | one per request per service hop | one per operation (nested) | one per request per service hop ("ideally") |
| Replaces normal logs? | No — additive | Yes, including log levels | N/A (a protocol) | Yes, in practice |
| Typical width | ~20 fields in the published example | 200–500 dimensions | default cap 128 attributes | "50+ fields" |
| Structure | flat | flat | **hierarchical** (parent/child spans) | flat, or spans |
| Schema | frozen, protobuf-defined | schemaless by design | semantic conventions | schemaless |

The one divergence that actually bites you in implementation: **spans are a tree, canonical lines
are flat.** A canonical line is one row per hop; a trace is many spans per hop. If you use OTel
spans as your wide events (which Boris recommends: "Ideally, your wide events ARE your trace
spans"), you get free propagation and a timeline UI, but you inherit per-span attribute limits
(see [§8.1](#81-the-hard-limits)) and you must decide *which* span carries the business context —
the answer is almost always the root server span.

The second divergence is philosophical and matters for team norms: Stripe kept their normal log
lines and froze their canonical schema; Honeycomb tells you to delete your log lines and never
freeze a schema. Wheel of Tim is small enough that the Honeycomb position is affordable and the
Stripe position (a typed schema) is *also* affordable — see the schemas in [§7](#7-wide-event-schemas-for-this-app).

---

## 3. Emitting wide events from a Next.js App Router app

The hard question is not "how do I write JSON to stdout." It is **what carries the accumulating
event through a request** so that one unit of work produces exactly one event. Here is what
actually exists, verified against the Next.js docs for the installed version (16.2.11 docs; this
repo is on `next@16.3.0-canary.96`).

### 3.1 What Next.js gives you natively

**`instrumentation.ts`** — [file convention
reference](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation). Exports
two things that matter:

- `register()` — "called **once** when a new Next.js server instance is initiated, and must
  complete before the server is ready to handle requests." This is where `registerOTel()` goes. It
  is **not** per-request; it cannot open a request store.
- `onRequestError(error, request, context)` — added in v15.0.0. Fires "when the Next.js server
  captures the error", and gives you `request.path`, `request.method`, `request.headers`, plus
  `context.routerKind`, `context.routePath`, `context.routeType` (`'render' | 'route' | 'action' |
  'proxy'`), `context.renderSource`, `context.revalidateReason` and `context.renderType`. This is
  the only native hook that reliably sees *rendering* errors in Server Components, and it is the
  right place to mark the wide event as failed. Caveat from the docs: "The `error` instance might
  not be the original error instance thrown, as it may be processed by React if encountered during
  Server Components rendering. If this happens, you can use `digest` property on an error to
  identify the actual error type."

**`after()`** from `next/server` —
[reference](https://nextjs.org/docs/app/api-reference/functions/after). Stable since v15.1.0. "`after`
allows you to schedule work to be executed after a response (or prerender) is finished. This is
useful for tasks and other side effects that should not block the response, such as logging and
analytics." Critically for wide events: **"`after` will be executed even if the response didn't
complete successfully. Including when an error is thrown or when `notFound` or `redirect` is
called."** That is the `ensure`-block guarantee Stripe hardened for, provided by the framework.

Three `after()` constraints to design around:

1. It works in Server Components, Server Functions, Route Handlers and Proxy.
2. In **Route Handlers and Server Functions** you can call `cookies()` and `headers()` *inside* the
   callback. In **Server Components** you cannot — "Calling `cookies()` or `headers()` inside the
   `after` callback in a Server Component will throw a runtime error." You must read them during
   render and close over the values.
3. On serverless it is backed by `waitUntil` — the docs spell out that Next.js reads
   `globalThis[Symbol.for('@next/request-context')]` to find a `waitUntil(promise)` implementation,
   and that on Vercel this
   [extends the function's lifetime](https://vercel.com/docs/functions/functions-api-reference#waituntil)
   until the promise settles. It "will run for the platform's default or configured max duration of
   your route."

**`proxy.ts`** (formerly `middleware.ts`) —
[reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy). In Next.js 16
"Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime." **Do not
try to open your request store here.** The docs are explicit: *"Proxy is meant to be invoked
separately of your render code and in optimized cases deployed to your CDN for fast
redirect/rewrite handling, you should not attempt relying on shared modules or globals. To pass
information from Proxy to your application, use headers, cookies, rewrites, redirects, or the
URL."* Proxy is a fine place to **mint** a request ID and set it as a request header; it is not a
place to hold state. Also note: "Server Functions are not separate routes in this chain. They are
handled as POST requests to the route where they are used."

**Next.js's built-in OTel spans** —
[OpenTelemetry guide](https://nextjs.org/docs/app/guides/open-telemetry). "Next.js supports
OpenTelemetry instrumentation out of the box, which means that we already instrumented Next.js
itself." The root span per incoming request is `[http.method] [next.route]`
(`next.span_type: BaseServer.handleRequest`), carrying `http.method`, `http.status_code`,
`http.route`, `http.target` and `next.route`. There are also `render route (app) [next.route]`,
`executing api route (app) [next.route]`, and `fetch [http.method] [http.url]` spans. Verbose spans
require `NEXT_OTEL_VERBOSE=1`; fetch spans can be disabled with `NEXT_OTEL_FETCH_DISABLED=1`.

**There is no `next/og`-style native request-context API.** `next/og` is image generation and is
irrelevant here. Next.js does not export a public per-request store. The nearest native thing is
React's `cache()`.

### 3.2 The three candidate context carriers

**(a) `AsyncLocalStorage` (Node.js) — the workhorse.**
[Node's `node:async_hooks` API](https://nodejs.org/api/async_context.html) gives you a store that
follows the async call tree. This is what every wide-event implementation in this ecosystem
actually uses. Axiom's own Next.js SDK exposes exactly this as `runWithServerContext`, documented
for "server actions, middleware, and server components"
([Axiom Next.js docs](https://axiom.co/docs/send-data/nextjs)):

```ts
"use server";
import { runWithServerContext } from "@axiomhq/nextjs";

export const serverAction = () =>
  runWithServerContext({ request_id: crypto.randomUUID() }, () => {
    return "Hello World";
  });
```

Its `createAxiomRouteHandler` takes a `store` option whose "fields… are added to the `fields` object
of the log report. For example, you can use this to add a `trace_id` field to every log report
within the same function execution in the route handler."

The catch: **you have to open the store yourself at every entry point** (each Route Handler, each
Server Action). There is no framework hook that wraps a Server Component render, because Proxy
runs in a different execution context and `instrumentation.ts#register` is process-level. For
Server Components, use React `cache()` (below) or the OTel active context.

**(b) React `cache()` — per-render memoisation, usable as a poor man's request store.**
[React docs](https://react.dev/reference/react/cache): "React will invalidate the cache for all
memoized functions for each server request." So `const getWideEvent = cache(() => ({}))` returns
the same mutable object to every Server Component in a single render pass, and a fresh one on the
next request. Two documented caveats that make this a fallback rather than a first choice: "`cache`
is for use in Server Components only", and "React only provides cache access to the memoized
function in a component. When calling `getUser` outside of a component, it will still evaluate the
function but not read or update the cache." So library code called outside the component tree
silently gets a *different* object.

**(c) OpenTelemetry context — the one that crosses the network.**
`trace.getSpan(context.active())` gives you the current span anywhere in the async tree, and
`span.setAttributes({...})` accumulates onto it; the span is exported when it ends. This is Boris's
own recommended shape ([wide events
101](https://boristane.com/blog/observability-wide-events-101/)). Its unique advantage is that
[context propagation](https://opentelemetry.io/docs/concepts/context-propagation/) carries the
trace ID across service boundaries via `traceparent` without you threading it manually. Its unique
disadvantage on this stack is per-span limits ([§8.1](#81-the-hard-limits)) and that
[custom spans from the Edge runtime don't appear in Vercel Session Tracing or Trace
Drains](https://vercel.com/docs/tracing#limitations).

For incoming requests, `@vercel/otel` + Next.js 13.4+ handle extraction automatically
([Vercel instrumentation docs](https://vercel.com/docs/tracing/instrumentation)): "Next.js 13.4+
supports automatic OpenTelemetry context propagation for incoming requests." For outgoing requests,
propagation is **opt-in per host** — the `@vercel/otel`
[README](https://github.com/vercel/otel/blob/main/packages/otel/README.md) states that for
`propagateContextUrls`, "By default the context is propagated *only* for the deployment URLs, all
other URLs should be enabled explicitly." That matters for Convex ([§5](#5-how-convex-fits)).

### 3.3 Per-surface recipe

| Surface | Open the store | Accumulate | Emit |
| --- | --- | --- | --- |
| **Route Handler** (`app/api/*/route.ts`) | Wrap the exported `GET`/`POST` in `withWideEvent()` which calls `als.run(event, handler)` | `addContext({...})` from anywhere in the call tree | `after(() => emit(event))` inside the wrapper; `cookies()`/`headers()` are legal inside the callback here |
| **Server Action** (`"use server"`) | Same wrapper — Actions are "handled as POST requests to the route where they are used" ([proxy docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)), so the same ALS wrapper works | `addContext({...})` | `after(() => emit(event))` |
| **Server Component / page render** | React `cache()` accumulator, or read the active OTel span | `span.setAttributes()` or mutate the cached object | `after(() => emit(event))` — **read `cookies()`/`headers()` before the callback and close over them**; the docs show this pattern |
| **Client** | n/a | Collect interaction fields in a small client-side event object | One `navigator.sendBeacon`/`fetch` to a Route Handler that re-emits server-side, or a client transport. Axiom documents a [proxy transport](https://axiom.co/docs/send-data/nextjs) precisely so you don't ship an ingest token to the browser |
| **Errors anywhere** | n/a | n/a | `onRequestError` in `instrumentation.ts`; use `error.digest` when React has re-wrapped the error |

Sketch of the wrapper, following Stripe's "post-request step" and Boris's middleware example:

```ts
// lib/observability/wide-event.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { after } from "next/server";
import { trace } from "@opentelemetry/api";

type WideEvent = Record<string, unknown>;
const store = new AsyncLocalStorage<WideEvent>();

export function addContext(fields: Record<string, string | number | boolean>) {
  const event = store.getStore();
  if (event) Object.assign(event, fields);
  trace.getActiveSpan()?.setAttributes(fields);
}

export function withWideEvent<A extends unknown[], R>(
  name: string,
  handler: (...args: A) => Promise<R>,
) {
  return async (...args: A): Promise<R> => {
    const started = performance.now();
    const event: WideEvent = {
      "event.name": name,
      "deploy.id": process.env.VERCEL_DEPLOYMENT_ID,
      "deploy.env": process.env.VERCEL_ENV,
      "deploy.sha": process.env.VERCEL_GIT_COMMIT_SHA,
      "deploy.region": process.env.VERCEL_REGION,
    };
    return store.run(event, async () => {
      after(() => {
        event["duration_ms"] = Math.round(performance.now() - started);
        // one write, at the end, on every path
        console.log(JSON.stringify(event));
      });
      try {
        const result = await handler(...args);
        event["outcome"] ??= "ok";
        return result;
      } catch (error) {
        event["outcome"] = "error";
        event["error.type"] = (error as Error).name;
        event["error.message"] = (error as Error).message;
        throw error;
      }
    });
  };
}
```

Note that `addContext` writes to both carriers — the ALS store and, when OTel is registered, the
active span. Keeping both writes inside one function is what lets call sites stay ignorant of which
carrier is live. `trace.getActiveSpan()` returns `undefined` when OTel is not registered, so the
span write is a safe no-op in that case.

Two design rules worth writing down, both from primary sources:

- **Emit in a `finally`-equivalent.** Stripe log in a Ruby `ensure` block "just in case the
  middleware stack is being unwound because an exception was thrown"; Boris's example uses
  `finally`. On Next.js, `after()` gives you this for free — it runs even on throw, `notFound()`
  and `redirect()`.
- **Never let the event kill the request.** Stripe wrap the log statement itself in
  `begin`/`rescue` "so that any problem constructing a canonical line will never fail a request."
  Do the same with a `try`/`catch` around the emit.

---

## 4. Vercel-native vs third party

### 4.1 What Vercel gives you without a vendor

**Drains** ([docs](https://vercel.com/docs/drains)) — the current name for what used to be Log
Drains. Five data types: Logs, Traces (OTLP), Speed Insights, Web Analytics, Audit Logs. Available
on **Pro and Enterprise only**: "If you are on the Hobby or Pro Trial plan, you'll need to upgrade
to Pro to access non-audit-log drains."

- **Log Drains** ([reference](https://vercel.com/docs/drains/reference/logs)) push JSON or NDJSON to
  any HTTPS endpoint. The schema is fixed and platform-shaped: `id`, `deploymentId`, `source`,
  `host`, `timestamp`, `projectId`, `level`, `message`, `requestId`, `statusCode`, `path`,
  `executionRegion`, `environment`, `branch`, `traceId`, `spanId`, and a nested `proxy` object with
  `method`, `path`, `userAgent`, `region`, `clientIp`, `vercelCache`, `pathType`, `wafAction` and
  more. **Your wide event travels inside the `message` string** — Vercel does not parse your JSON
  into columns; that is your destination's job. `message` "may be truncated if over 256 KB".
- **Trace Drains** ([reference](https://vercel.com/docs/drains/reference/traces)) speak **OTLP/HTTP
  only** — "OTLP/gRPC endpoints (typically port 4317) are not supported." JSON or protobuf. Vercel
  adds `vercel.projectId` and `vercel.deploymentId` resource attributes.
- **Sampling rules** exist per drain (by environment, by path prefix, by percentage), and "Rules run
  from top to bottom… If you do not add rules, the drain forwards 100% of data to the destination."
  Note this is **head/blind sampling by path and environment, not tail sampling on outcome** — you
  cannot express "always keep errors" here. Boris's prescribed sampling has to live in your own
  emit function.
- **Cost.** The [Drains docs](https://vercel.com/docs/drains#usage-and-pricing) list a single Pro
  price line: `Drains Volume — $0.50`. The table does not state the unit inline; the
  [optimisation guidance](https://vercel.com/docs/manage-and-optimize-observability#optimizing-drains-usage)
  is only "filter by environment" and "use a sampling rate." For historical context on why this
  line item exists at all, Axiom's
  [Changes to Vercel Log Drains](https://axiom.co/blog/changes-to-vercel-log-drains) records that in
  May 2024 Vercel moved Log Drains behind Pro/Enterprise "at a charge of $10 per 5GB of data
  transfer," billed "based on uncompressed log volume."

**`@vercel/otel`** ([Vercel instrumentation docs](https://vercel.com/docs/tracing/instrumentation),
[README](https://github.com/vercel/otel/blob/main/packages/otel/README.md)) — a thin
`registerOTel()` wrapper over the OTel SDK. It sets standard resource attributes
(`deployment.environment.name`, `cloud.provider`, `cloud.region`, `vcs.ref.head.revision`,
`deployment.id`, …), configures fetch instrumentation and the W3C TraceContext propagator, and
"configures the best export mechanism for the environment." Notable:

- It is a **traces** package. There is no first-party wide-event/log pipeline in it.
- The sampler is `traceSampler` — **head-based**. Tail sampling is not offered.
- **Hard dependency for Vercel's own UI:** "If your app uses manual OpenTelemetry SDK configuration
  without the usage of `@vercel/otel`, you will not be able to use Session Tracing or Trace Drains."
- Inbound sampling decisions are respected and ANDed with Vercel's: per the
  [sampling behaviour table](https://vercel.com/docs/tracing/instrumentation#sampling-behavior), if
  an upstream marks a trace as not sampled, it is dropped regardless.

**Vercel Observability / Query / Notebooks** ([Query docs](https://vercel.com/docs/query)) — a
built-in query builder over Vercel's *own* platform events (edge requests, function invocations,
external API calls, ISR, build diagnostics). You can group and filter by
[a fixed field list](https://vercel.com/docs/query/reference#group-by-and-where-fields) and save
queries to [Notebooks](https://vercel.com/docs/notebooks). **This is not a wide-events store**:
there is no mechanism to add your own high-cardinality business dimensions (`room_id`,
`story_points`, `spin_id`) to it. "Full Query access requires Observability Plus."

**Runtime Logs retention is the killer.** From
[Observability Plus](https://vercel.com/docs/observability/observability-plus#limitations):

| | Free Observability | Observability Plus |
| --- | --- | --- |
| Runtime logs retention | Hobby 1 hour · Pro 1 day · Enterprise 3 days | 30 days, max 14-day selection window |
| Data retention (metrics) | Hobby 12h · Pro 1 day · Enterprise 3 days | 30 days |
| Query | No access | Full |
| Price | included | **$1.20 per 1 million events** |

A one-day retention window on runtime logs makes Vercel's own log store unusable as the wide-event
system of record. Even Observability Plus's 30 days is short compared with Honeycomb's or Axiom's
retention, and it still doesn't let you query your custom fields.

**Session Tracing** ([docs](https://vercel.com/docs/tracing#session-tracing)) is developer-session
scoped — "captures infrastructure, framework, and fetch spans for requests made during **your**
individual session." It is a debugging aid, not production telemetry.

### 4.2 What requires a third party

Everything that makes wide events *useful*: schemaless high-cardinality columns, retention beyond
30 days, arbitrary group-by on business fields, outlier detection, and a single store spanning
Vercel and Convex.

| Vendor | Vercel path | Convex path | Notes |
| --- | --- | --- | --- |
| **Axiom** | [Vercel Marketplace app](https://vercel.com/marketplace/axiom) (installs a Drain — Pro/Enterprise, incurs Drains billing) **or** [`@axiomhq/nextjs`](https://axiom.co/docs/send-data/nextjs) direct ingest, which Axiom explicitly recommends "if you want to send data from your Next.js app to Axiom without using Vercel Drains" | **First-party Convex Log Stream** ([Convex docs](https://docs.convex.dev/production/integrations/log-streams/)) — configure dataset + API token; Convex auto-creates a dashboard | Only vendor here with a native path on **both** sides |
| **Honeycomb** | Trace Drain to its OTLP/HTTP endpoint, or `@vercel/otel` with an OTLP exporter | ❌ Not a supported Convex log-stream destination. You'd need Convex's generic **webhook** drain into a shim that translates to OTLP | Best trace UI and BubbleUp; worst Convex story |
| **Datadog / PostHog** | Datadog via Drains/Marketplace | ✅ First-party Convex log streams | Datadog is the archetypal "observability 1.0" cost model Charity Majors warns about |
| **Dash0 / Braintrust** | Native Drain integrations, per [Drains docs](https://vercel.com/docs/drains#getting-started-with-drains) | ❌ | |
| **Baselime** | — | — | **Dead.** Cloudflare "anticipate[d] sunsetting the Baselime products towards the end of 2024" ([acquisition post](https://blog.cloudflare.com/cloudflare-acquires-baselime-expands-observability-capabilities/)). Not an option. |
| **DIY (ClickHouse)** | Custom-endpoint Drain, or direct HTTP insert | Convex webhook log stream (HMAC-SHA256 signed, `x-webhook-signature`) | Boris's own recommendation for the storage layer ("Modern columnar databases (ClickHouse, BigQuery, etc.)"); it is also what Baselime ran on before Cloudflare. Wrong shape of investment for a two-product showcase app |

---

## 5. How Convex fits

### 5.1 What Convex offers

**Log Streams** ([docs](https://docs.convex.dev/production/integrations/log-streams/)) — "streaming
of events such as function executions and `console.log`s from your Convex deployment to supported
destinations": **Axiom, Datadog, PostHog, or a custom webhook**. **Requires a Convex Pro plan.**

The event schema is well-defined and every event carries `topic`, `timestamp`, and a `convex`
object with `deployment_name`, `deployment_type`, `project_name`, `project_slug`. Two topics matter
for wide events:

- **`console`** — your `console.log` output, with `function.path`, `function.request_id`,
  `function.type`, `log_level`, `message` (the `object-inspect` representation of the payload) and
  `is_truncated`.
- **`function_execution`** — emitted automatically for every function run. This is essentially a
  free, platform-generated wide event: `execution_time_ms`, `user_execution_time_ms`, `status`,
  `error_message`, `mutation_queue_length`, `mutation_retry_count`, `occ_info` (write-conflict
  details: `table_name`, `document_id`, `write_source`, `retry_count`), `scheduler_info.job_id`, and
  a `usage` object with `database_io_read_bytes`, `database_io_write_bytes`,
  `database_read_documents`, `network_egress_bytes`, `action_memory_used_mb` and more.

Also available: **exception reporting** to Sentry / PostHog / Datadog
([docs](https://docs.convex.dev/production/integrations/exception-reporting)), Pro-only, with
automatic tags including `request_id`, `func`, `func_type`, `func_runtime`, `server_name`,
`environment` and `user`.

**Correlation handle:** Convex stamps a Request ID into every exception message in dev and prod as
`[Request ID: <request_id>]` ([debugging
docs](https://docs.convex.dev/functions/debugging#finding-relevant-logs-by-request-id)), and the
same `function.request_id` appears on both `console` and `function_execution` events. So all Convex
events for one logical Convex request already correlate with each other.

### 5.2 Can one logical unit of work be one event spanning Vercel and Convex?

**No — not one event. But yes, one trace, if you thread the ID by hand.** Three hard constraints:

**(a) Convex accepts no `traceparent`.** `@vercel/otel` propagates W3C trace context over `fetch`,
and only to hosts you list in `propagateContextUrls` (the
[README](https://github.com/vercel/otel/blob/main/packages/otel/README.md) confirms non-deployment
URLs "should be enabled explicitly"). But the Convex client protocol does not surface an inbound
`traceparent` to your function handler. **The trace ID has to be an explicit function argument.**

**(b) Convex `AsyncLocalStorage` does not cross function boundaries.** The default Convex runtime
*does* expose `AsyncLocalStorage`
([runtimes docs](https://docs.convex.dev/functions/runtimes#node-apis)), which is genuinely useful
for accumulating an event inside a single handler. But the docs carry an explicit warning:

> "Data in `AsyncLocalStorage` does **not** propagate into calls to `ctx.runMutation`, `ctx.runQuery`
> or `ctx.runAction`. If you want values to propagate into those calls, you'll need to manually pass
> them as arguments."

**(c) Queries and mutations cannot make network calls, so they cannot export OTLP.** Convex queries
and mutations are "restricted by the runtime to be deterministic. This allows Convex to
automatically retry them"; `fetch` is available "in Actions only"
([runtimes docs](https://docs.convex.dev/functions/runtimes)). `Date.now()` is frozen for the
duration of a function and `Math.random()` is seeded. So the OTel-span-as-wide-event pattern is
unavailable in exactly the place most of Wheel of Tim's interesting business logic will live (the
vote/reveal mutations). Convex's own
[Agents debugging guide](https://docs.convex.dev/agents/debugging) shows OTLP export working — but
only inside an **action**, with a manually constructed `BasicTracerProvider` and an explicit
`await tracerProvider.forceFlush()` before the handler returns.

**Therefore the workable shape:**

```
browser ──(convex mutation, args include wot.trace_id)──▶ Convex mutation
   │                                                          │
   │                                                    console.log(JSON.stringify(wideEvent))
   │                                                          ▼
   └──(Server Action / Route Handler)──▶ Vercel        Convex Log Stream ──▶ Axiom dataset
                     │                                                          ▲
                     └── after() ─▶ wide event ─────────────────────────────────┘
```

- A single `wot.trace_id` (mint it in `proxy.ts` as a header, or client-side per interaction) is
  attached to the Vercel-side wide event **and** passed as an explicit argument to every Convex
  function call.
- Convex functions emit their own wide event with `console.log(JSON.stringify(event))`, which
  arrives on the `console` topic with `function.request_id` attached.
- Convex's automatic `function_execution` events give you resource and OCC data for free on the
  same `function.request_id`.
- In Axiom you join on `wot.trace_id` across all three streams. You get one *trace*, made of one
  Vercel event and one Convex event per hop — exactly Charity Majors' "one event per request per
  service hop", not one event total.

### 5.3 Convex-specific limits that shape the schema

From [Convex limits](https://docs.convex.dev/production/state/limits#functions):

| Limit | Value | Consequence for wide events |
| --- | --- | --- |
| Length of a `console.log` line | **4 KiB** | **A Convex wide event must serialise to under 4 KiB.** This is the single most binding constraint in the whole design. No raw request bodies, no full document dumps, no stack traces inline. |
| Log lines per function | 256 (additional dropped) | Fine for one-event-per-function; fatal for chatty logging |
| Log streaming buffer | 4096 logs, flushed every 5 seconds | |
| Delivery guarantee | "best-effort… logs can be dropped if ingestion throughput is too high… it is possible for a log event to be duplicated" ([log streams docs](https://docs.convex.dev/production/integrations/log-streams/#guarantees)) | Your event needs an idempotency key if you ever aggregate exactly |
| Query/mutation execution time | 1 second (user code) | The event must be cheap to build |

`console` events also carry `is_truncated`, so you can detect the 4 KiB overflow in your own data
and alert on it.

---

## 6. Wide event schemas for this app

Design rules applied below:

- **Flat, dotted namespaces.** Honeycomb's
  [organizing-data guidance](https://docs.honeycomb.io/get-started/best-practices/organizing-data#namespace-custom-fields)
  recommends dotted namespaces and warns: "it is a best practice not to dynamically set a field's
  name from your instrumentation code… This can lead to runaway schemas… It is particularly
  dangerous to send unsanitized user input as a field name." So: **user-supplied names are values,
  never keys.**
- **Reuse OTel semantic conventions** for anything standard (`http.*`, `service.*`), namespace
  everything app-specific under `wot.*`.
- **Every event carries the same correlation spine**: `wot.trace_id`, `wot.event.name`,
  `outcome`, `duration_ms`, deploy identity.
- **Stripe's lesson**: freeze the field names early and treat renames as breaking. Define these as
  a TypeScript type so the compiler enforces it — the repo already runs `pnpm typecheck`.

### 6.0 The common spine

```jsonc
{
  "timestamp": "2026-07-26T15:04:05.612Z",
  "wot.trace_id": "0af7651916cd43dd8448eb211c80319c",   // W3C trace id, threaded everywhere
  "wot.span_id": "b7ad6b7169203331",
  "wot.event.name": "wheel.spin",                        // low cardinality: the query dimension
  "wot.event.version": 1,                                // schema version, Stripe-style contract

  "service.name": "wheeloftim-web",                      // or "wheeloftim-convex"
  "deploy.env": "production",                            // VERCEL_ENV
  "deploy.id": "dpl_2YZzo1cJAjijSf1hwDFK5ayu2Pid",       // VERCEL_DEPLOYMENT_ID
  "deploy.sha": "690de31f245eb4f2160643e0dbb5304179a1cdd3", // VERCEL_GIT_COMMIT_SHA
  "deploy.branch": "main",
  "deploy.region": "lhr1",                               // VERCEL_REGION

  "outcome": "ok",                                       // ok | error  (low cardinality)
  "duration_ms": 43,
  "error.type": null,
  "error.message": null,
  "error.digest": null,                                  // from onRequestError

  "wot.session_id": "s_8f7a2b3c",                        // high cardinality, anonymous
  "wot.user_id": null,                                   // high cardinality when auth exists
  "wot.client.viewport": "mobile",
  "wot.sampled.reason": "error"                          // why this event survived tail sampling
}
```

### 6.1 A wheel spin

Today the wheel is client-side and `localStorage`-backed
([`lib/name-picker.ts`](../../lib/name-picker.ts) holds `selectWinnerIndex`, `buildWheelSegments`,
`STORAGE_KEY = "wheel-of-tim:names"`). Post-Convex, a spin becomes a persisted mutation. The event
below assumes the Convex-backed version; the client-only version emits the same shape minus the
`convex.*` block.

```jsonc
{
  // ── spine ──────────────────────────────────────────────
  "timestamp": "2026-07-26T15:04:05.612Z",
  "wot.trace_id": "0af7651916cd43dd8448eb211c80319c",
  "wot.event.name": "wheel.spin",
  "wot.event.version": 1,
  "service.name": "wheeloftim-convex",
  "deploy.env": "production",
  "deploy.sha": "690de31f...",
  "outcome": "ok",
  "duration_ms": 12,

  // ── who ────────────────────────────────────────────────
  "wot.session_id": "s_8f7a2b3c",
  "wot.wheel_id": "wh_01J8ZQ",                    // high cardinality
  "wot.wheel.owner_id": "u_4f2b",

  // ── the wheel's shape (drives almost every interesting query) ──
  "wot.wheel.segment_count": 7,
  "wot.wheel.name_length.min": 3,
  "wot.wheel.name_length.max": 24,
  "wot.wheel.has_duplicates_rejected": false,     // from addName's duplicate guard
  "wot.wheel.source": "persisted",                // persisted | localstorage_migrated | seeded
  "wot.wheel.age_days": 41,
  "wot.wheel.spins_before": 12,

  // ── the outcome ────────────────────────────────────────
  "wot.spin.id": "sp_01J8ZR",
  "wot.spin.winner_id": "n_9c1e",                 // the NameEntry id — NOT the label
  "wot.spin.winner_index": 4,
  "wot.spin.winner_label_length": 9,              // length, not the name: PII-safe, still useful
  "wot.spin.winner_seen_before_count": 2,         // has this name won recently? fairness signal
  "wot.spin.rotation_turns": 6,                   // createRotationForWinner's 360 * 6
  "wot.spin.animation_ms": 4200,                  // client-reported
  "wot.spin.repeat_winner": true,                 // winner == previous winner
  "wot.spin.trigger": "button",                   // button | keyboard | shake

  // ── platform facts (free from Convex function_execution) ──
  "convex.function.path": "wheel:spin",
  "convex.function.type": "mutation",
  "convex.function.request_id": "d064ef901f7ec0b7",
  "convex.execution_time_ms": 8,
  "convex.usage.database_read_documents": 3,
  "convex.usage.database_io_write_bytes": 412,
  "convex.mutation_retry_count": 0,
  "convex.occ_info.table_name": null
}
```

Queries this unlocks that scattered logs cannot answer: *"is `selectWinnerIndex` actually uniform?"*
— `count() group by wot.spin.winner_index where wot.wheel.segment_count = 7`. *"Do people abandon
wheels with more than N names?"* — group `wot.wheel.spins_before` by `wot.wheel.segment_count`.
*"Did the deploy that changed the rotation maths change perceived fairness?"* — the same query
grouped by `deploy.sha`, which is precisely the "pinpoint the commit that introduced the defect"
move Boris demonstrates in
[wide events 101](https://boristane.com/blog/observability-wide-events-101/).

### 6.2 A vote cast (estimation poker)

```jsonc
{
  "timestamp": "2026-07-26T15:11:22.104Z",
  "wot.trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "wot.event.name": "poker.vote_cast",
  "wot.event.version": 1,
  "service.name": "wheeloftim-convex",
  "deploy.env": "production",
  "deploy.sha": "690de31f...",
  "outcome": "ok",
  "duration_ms": 9,

  "wot.session_id": "s_2b91af",
  "wot.participant_id": "p_7f3a",                 // high cardinality
  "wot.room_id": "rm_01J8ZS",                     // high cardinality — THE key dimension
  "wot.room.age_seconds": 842,
  "wot.room.participant_count": 6,
  "wot.room.spectator_count": 1,
  "wot.room.deck": "fibonacci",                   // fibonacci | tshirt | powers_of_two
  "wot.room.created_by_self": false,

  "wot.round.id": "rd_01J8ZT",
  "wot.round.index": 3,                           // 4th round in this room
  "wot.round.story_ref": "PROJ-142",              // low-ish cardinality, high debug value
  "wot.round.state": "voting",                    // voting | revealed | reset
  "wot.round.age_seconds": 37,

  "wot.vote.value": "5",                          // the estimate itself — bounded, safe to keep
  "wot.vote.is_change": true,                     // did they overwrite an earlier vote?
  "wot.vote.change_count": 2,                     // how many times this participant has changed
  "wot.vote.ordinal": 4,                          // 4th of 6 participants to vote this round
  "wot.vote.ms_since_round_start": 37104,
  "wot.vote.ms_since_last_peer_vote": 1204,
  "wot.vote.after_reveal": false,                 // should always be false — alert if true

  "wot.round.votes_now": 4,
  "wot.round.votes_outstanding": 2,
  "wot.round.all_in": false,

  "wot.client.transport": "convex_ws",
  "wot.client.reconnects_this_session": 0,
  "wot.client.clock_skew_ms": -180,               // catches "my vote didn't register" reports

  "convex.function.path": "poker:castVote",
  "convex.function.type": "mutation",
  "convex.function.request_id": "892104e63bd39d9a",
  "convex.execution_time_ms": 6,
  "convex.mutation_retry_count": 1,
  "convex.mutation_queue_length": 2,
  "convex.occ_info.table_name": "votes",          // ← real-time contention, visible for free
  "convex.occ_info.write_source": "poker:castVote",
  "convex.occ_info.retry_count": 1
}
```

`convex.occ_info.*` and `convex.mutation_retry_count` are the reason to want Convex events in the
same store as Vercel events: write conflicts on a hot `votes` row under six simultaneous voters is
exactly the class of bug that is invisible to application logs and obvious as
`count() where convex.occ_info.table_name = "votes" group by wot.room.participant_count`.

### 6.3 A reveal

```jsonc
{
  "timestamp": "2026-07-26T15:12:03.880Z",
  "wot.trace_id": "9c1e4bf92f3577b34da6a3ce929d0e0e",
  "wot.event.name": "poker.reveal",
  "wot.event.version": 1,
  "service.name": "wheeloftim-convex",
  "deploy.env": "production",
  "deploy.sha": "690de31f...",
  "outcome": "ok",
  "duration_ms": 14,

  "wot.session_id": "s_2b91af",
  "wot.room_id": "rm_01J8ZS",
  "wot.round.id": "rd_01J8ZT",
  "wot.round.index": 3,
  "wot.round.story_ref": "PROJ-142",
  "wot.actor_id": "p_7f3a",
  "wot.reveal.trigger": "manual",                 // manual | auto_all_voted | timeout | host_force
  "wot.reveal.authorized_as": "host",             // host | participant | anyone

  // ── the estimation outcome: this is the product's whole point ──
  "wot.reveal.vote_count": 6,
  "wot.reveal.participant_count": 6,
  "wot.reveal.abstain_count": 0,
  "wot.reveal.distinct_values": 3,
  "wot.reveal.values": ["3", "5", "5", "5", "8", "13"],   // bounded array, ≤ ~20 entries
  "wot.reveal.mode": "5",
  "wot.reveal.median": "5",
  "wot.reveal.min": "3",
  "wot.reveal.max": "13",
  "wot.reveal.spread_steps": 4,                   // deck positions between min and max
  "wot.reveal.consensus": false,                  // distinct_values == 1
  "wot.reveal.has_outlier": true,                 // the 13
  "wot.reveal.round_duration_ms": 78400,
  "wot.reveal.time_to_last_vote_ms": 61200,
  "wot.reveal.slowest_voter_lag_ms": 24000,

  "wot.reveal.is_revote": false,
  "wot.reveal.previous_round_spread_steps": null,

  "convex.function.path": "poker:reveal",
  "convex.function.type": "mutation",
  "convex.function.request_id": "aa31bd0c9e7712f4",
  "convex.execution_time_ms": 11,
  "convex.usage.database_read_documents": 8,
  "convex.usage.database_io_write_bytes": 640
}
```

Note `wot.reveal.values` is a bounded array of low-cardinality strings — safe. It would **not** be
safe to include participant names or free-text story titles: those are unbounded user input and, per
the Honeycomb warning above, must never become field *names*; as *values* they are a PII and
event-size question. Under Convex's 4 KiB `console.log` ceiling, a 20-person room's value array plus
this spine is comfortable; a room with participant names attached would not be.

### 6.4 Two more events worth defining early

- **`web.request`** — the generic Vercel-side wide event for every Route Handler / Server Action /
  page render, carrying the spine plus `http.method`, `http.route`, `http.status_code`,
  `next.route_type` (`render | route | action | proxy`, straight from `onRequestError`'s `context`),
  `next.render_source`, `next.revalidate_reason`, cache outcome, and a count of Convex calls made.
- **`client.interaction`** — one event per meaningful client action (spin pressed, vote clicked,
  reveal clicked) carrying perceived latency, which is the only place you can measure what the user
  actually felt. Ship it through a proxy route so no ingest token reaches the browser
  ([Axiom proxy transport](https://axiom.co/docs/send-data/nextjs)).

---

## 7. Cost and cardinality

### 7.1 The hard limits

| Platform | Limit | Source |
| --- | --- | --- |
| **OTel SDK** | `AttributeCountLimit` **default 128** attributes per span/log record; `AttributeValueLengthLimit` default infinity. Over-limit attributes are **discarded**, not truncated. Limits apply to top-level attributes only, not nested map values. Resource attributes are exempt. | [OTel common spec](https://opentelemetry.io/docs/specs/otel/common/#attribute-limits) |
| **Vercel tracing** | 10 MB compressed trace data per request; spans >1 MB compressed are **dropped** after attribute truncation; truncated attributes get a `<name>.truncated: true` marker; **custom spans from the Edge runtime never appear** in Session Tracing or Trace Drains | [Vercel tracing limitations](https://vercel.com/docs/tracing#limitations) |
| **Vercel log drains** | `message` "may be truncated if over 256 KB"; streaming logs are "256 KB per line" | [Log Drains reference](https://vercel.com/docs/drains/reference/logs), [Function logs](https://vercel.com/docs/functions/logs) |
| **Convex** | **`console.log` line: 4 KiB**; 256 log lines per function; log-stream buffer 4096 logs flushed every 5s; best-effort delivery (drops and duplicates possible) | [Convex limits](https://docs.convex.dev/production/state/limits#functions), [log stream guarantees](https://docs.convex.dev/production/integrations/log-streams/#guarantees) |
| **Honeycomb** | **2,000 distinct fields per event**; event < 1 MB uncompressed JSON; string fields ≤ 64 KB; **over-limit events are rejected**. 100 datasets per environment (300 on Enterprise) | [Honeycomb organizing-data limits](https://docs.honeycomb.io/get-started/best-practices/organizing-data#limits) |
| **Axiom** | "Datasets / fields per dataset / query concurrency" are documented as **soft limits, liftable on request** | [Axiom pricing comparison](https://axiom.co/pricing) |

The binding constraint for this app is **Convex's 4 KiB per `console.log` line**, which caps a
Convex-side wide event at roughly 40–60 fields with short values. That is above Boris's "50+ fields"
target and far below Honeycomb's observed 200–500 dimensions. It is a real ceiling, and it argues
for keeping the Convex event tight and letting the richer context live on the Vercel-side event of
the same trace.

The second constraint is **OTel's 128-attribute default**, which will silently drop fields if you
use spans as your wide-event carrier without raising it. If you go the span route, set
`SpanAttributeCountLimit` explicitly.

### 7.2 What it costs

| Destination | Free allowance | Paid rate |
| --- | --- | --- |
| **Axiom Personal** | 500 GB/month ingest, 10 GB-hours query compute, 25 GB storage, 30-day retention, full APL, all integrations, permanent, no card | $0 |
| **Axiom Cloud** | 1 TB/month ingest, 100 GB-hours query, 100 GB storage included | $25/month platform fee + usage, automatic volume discounts, configurable retention |
| **Honeycomb Free** | 20M events/month, 100M metric data points/month | $0 |
| **Honeycomb Pro (2026)** | — | **$3.00 per million events** (up from $1.30 on legacy plans), four tiers to 750M events/month, from **$150/month**. Legacy-plan grace period ends 31 Dec 2026 |
| **Vercel Observability Plus** | Free tier: Pro 1-day retention, no Query | **$1.20 per 1M events**, 30-day retention |
| **Vercel Drains** | Pro/Enterprise only | `Drains Volume — $0.50` (unit not stated in the pricing table); historically billed on uncompressed volume |
| **Convex Log Streams** | — | Requires **Convex Pro**. No separate per-event charge documented |

Sources: [Axiom pricing](https://axiom.co/pricing), [Honeycomb
pricing](https://www.honeycomb.io/pricing), [Honeycomb 2026 Pro plan
changes](https://docs.honeycomb.io/get-started/honeycomb/2026-pro-plan-changes),
[Vercel Observability Plus](https://vercel.com/docs/observability/observability-plus#pricing),
[Vercel Drains pricing](https://vercel.com/docs/drains#usage-and-pricing),
[Convex log streams](https://docs.convex.dev/production/integrations/log-streams/).

### 7.3 Why high cardinality is cheap here and expensive elsewhere

The cost driver for wide events is **number of events**, not number of fields. Charity Majors states
it directly: "even with hundreds of dimensions, it's still just one write. Adding more dimensions to
your event is effectively free, it's still one write plus a few more bits. Compare this to a
metric-based systems, where you are often in the position of trying to predict whether a metric will
be valuable enough to justify the extra write, because every single metric or tag you add
contributes linearly to write amplification"
([Live Your Best Life](https://charity.wtf/p/live-your-best-life-with-structured-events)).

Her cost warning is about the metrics model, not the events model: "You go to bed Friday night with
a $150k Datadog bill and wake up Monday morning with a million dollar bill, without changing a
single line of code"
([Observability 2.0 vs 1.0](https://www.honeycomb.io/blog/one-key-difference-observability1dot0-2dot0)).
The same post gives the control lever: "To control observability 2.0 costs, you typically reach for
tail-based or head-based sampling."

**Practically, for Wheel of Tim at showcase scale:** one wide event per unit of work, at even a few
thousand interactions a day, is a few hundred thousand events a month. That fits inside Axiom
Personal's 500 GB/month and inside Honeycomb Free's 20M events/month with room to spare. **Sampling
is not needed on day one.** Build the tail-sampling hook anyway — Boris's `shouldSample()` shape,
gating on `outcome`, `duration_ms` and a debug flag — so that the lever exists before you need it,
and so the `wot.sampled.reason` field in the schema is populated from the start.

Two cardinality hygiene rules to enforce from day one, both from Honeycomb's own
[best practices](https://docs.honeycomb.io/get-started/best-practices/organizing-data):

1. **Never generate field names dynamically**, and never from user input. "This can lead to runaway
   schemas… It is particularly dangerous to send unsanitized user input as a field name."
2. **Keep field names consistent across services.** Vercel-side and Convex-side events must agree
   that the room identifier is `wot.room_id` and nothing else. Use a shared TypeScript constant
   module — this is Stripe's protobuf lesson in a cheaper form.

---

## 8. What is *not* true, and common traps on this stack

- **`instrumentation.ts` is not a request hook.** `register()` runs once per server instance.
- **`proxy.ts` cannot hold your request store.** Documented: "you should not attempt relying on
  shared modules or globals" ([proxy
  docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)).
- **Vercel's Query / Notebooks are not a wide-events store.** They query Vercel's platform events
  over a fixed field list; there is no way to add `wot.room_id` to them.
- **Vercel log-drain sampling is not tail sampling.** It samples by environment and path prefix
  only; "always keep errors" must live in your emit function.
- **`@vercel/otel` does not propagate trace context to arbitrary hosts by default** — only to Vercel
  deployment URLs unless you list the host in `propagateContextUrls`.
- **Edge-runtime custom spans are invisible** to Session Tracing and Trace Drains
  ([limitations](https://vercel.com/docs/tracing#limitations)). Keep instrumented code on the Node.js
  runtime; Next.js 16's Proxy already defaults to Node.
- **Convex mutations cannot export OTLP.** No `fetch` outside actions. `console.log` + Log Streams is
  the only route out of a mutation.
- **Convex `AsyncLocalStorage` stops at `ctx.runQuery`/`runMutation`/`runAction`.** Pass IDs as
  arguments.
- **Baselime is gone.** Cloudflare sunset the products around the end of 2024.

---

## 9. Recommendation in full

### 9.1 Emission pattern

**One wide event per unit of work, accumulated in an `AsyncLocalStorage` store, emitted exactly once
from `after()`, mirrored onto the active OTel span.**

1. **Mint `wot.trace_id` at the edge.** `proxy.ts` (Node runtime by default in Next 16) generates a
   W3C-shaped trace ID and sets it as a request header. Proxy state does not survive into render, so
   the header is the carrier — which is exactly what the Next.js docs prescribe.
2. **Wrap every server entry point.** `withWideEvent()` opens the ALS store, seeds it with deploy
   identity and route context, registers `after(() => emit(event))`, and tags `outcome`/`error.*` in
   `catch`. Route Handlers and Server Actions share the wrapper (Actions are POSTs to the same
   route). Server Components use React `cache()` for the accumulator and read
   `cookies()`/`headers()` *before* the `after()` callback.
3. **`addContext({...})` everywhere else.** One function, called from anywhere in the async tree; it
   mutates the ALS store *and* calls `trace.getActiveSpan()?.setAttributes()` so the same fields land
   on the root span. Nobody at a call site needs to know which carrier is live.
4. **`onRequestError` in `instrumentation.ts`** catches render-time failures the wrapper cannot see,
   including PPR/`dynamic-resume` cases; use `error.digest` when React has re-wrapped the error.
5. **Convex side: one event per handler.** Build the event in the handler (ALS is available in the
   default runtime for intra-handler accumulation), emit
   `console.log(JSON.stringify(event))` at the end, keep it under 4 KiB, pass `wot.trace_id` as an
   explicit function argument through every `ctx.runQuery`/`runMutation`/`runAction`.
6. **Client side: one event per meaningful interaction**, posted to a proxy Route Handler that
   re-emits server-side. This keeps the ingest token off the browser and gives you the only honest
   measure of perceived latency.
7. **Tail-sample in the emit function**, not in the drain: keep 100% of errors, 100% of anything
   slower than your p99 target, 100% of a debug-flagged session, and a percentage of the rest; record
   the decision in `wot.sampled.reason`. Boris's `shouldSample()` is the template.
8. **Freeze the schema in TypeScript.** A `WideEvent` union type with per-event field sets, checked
   by the existing `pnpm typecheck`. Stripe's protobuf contract, at this repo's scale.

**Trade-offs of this pattern.** It requires wrapping every entry point by hand — Next.js gives you no
global request middleware for render. It duplicates fields between the ALS store and the OTel span,
which costs a little memory and demands discipline that both writes go through one function. And
`after()` extends function billing duration slightly, since the emit happens inside the invocation's
`waitUntil` window. The alternative — writing the event synchronously before returning — is simpler
but adds the ingest round-trip to user-visible latency, which is precisely the trade `after()` exists
to avoid.

**The rejected alternative: spans-only, no separate event.** Attractive (free propagation, free
timeline UI, Boris's own preference) but it fails on two counts here. Convex mutations cannot emit
spans at all, so half your business logic would be missing from the trace-shaped store; and OTel's
128-attribute default plus Vercel's 1 MB-per-span drop rule make span attributes a less forgiving
container than a JSON line. Emit both: the wide event is the record, the span is the index.

### 9.2 Destination

**Axiom, one dataset, two writers.**

- **Vercel → Axiom via `@axiomhq/nextjs`** (direct ingest, not the Marketplace Drain). Axiom's own
  docs recommend this route "if you want to send data from your Next.js app to Axiom without using
  Vercel Drains," and it avoids both the Pro-plan gate and the separate Drains billing line. The SDK
  already implements the pattern described above: `runWithServerContext` is `AsyncLocalStorage`,
  `createAxiomRouteHandler` takes a `store`, `createOnRequestError` wires the instrumentation hook,
  and the server-component example uses `after(() => logger.flush())`. You can adopt the SDK
  wholesale or use it only as the transport under your own `withWideEvent()`.
- **Convex → Axiom via Convex Log Streams** (first-party; dataset name + API token; auto-generated
  dashboard). Requires Convex Pro.
- **Optionally add a Vercel Trace Drain to Axiom's OTLP endpoint** later, for the infrastructure
  spans (routing, middleware, cache) that only Vercel can see. Trace Drains are OTLP/HTTP-only and
  require `@vercel/otel`.

**Why Axiom over Honeycomb.** Honeycomb is the better *tool* — BubbleUp, the trace UI, and the
20M-events/month free tier are all excellent, and the whole wide-events canon comes out of that
building. But Honeycomb is **not a supported Convex log-stream destination**. Getting Convex events
into Honeycomb means standing up a webhook receiver that verifies the HMAC-SHA256
`x-webhook-signature` and translates Convex's JSON into OTLP — infrastructure this project should
not be maintaining. Axiom is the only vendor with a native path on both sides, and "one queryable
store spanning Vercel and Convex" is the single property that makes wide events worth doing here.

**Why not Vercel-native only.** Runtime logs are retained for **1 day** on Pro, 30 days with
Observability Plus at $1.20/1M events; Query cannot see your custom fields at all; and there is no
Convex story whatsoever. Vercel's observability is excellent for *platform* questions ("which route
is slow, which region, what's my cache hit rate") and structurally incapable of answering *product*
questions ("do rooms with more than six participants have more revote rounds"). Keep it; don't rely
on it.

**Why not DIY ClickHouse.** It is what Boris recommends for the storage layer and what Baselime
actually ran on, and it would be cheaper at scale. At this scale it is a second product to operate,
and the point of Wheel of Tim is to showcase application architecture, not to run a telemetry
platform.

**Cost check.** Axiom Personal (500 GB/month ingest, 25 GB storage, 30-day retention, full APL,
permanent, no card) covers this app's realistic volume at $0. The upgrade path is $25/month + usage,
with in-console spend caps. Convex Pro is required for log streams and is a cost you would likely
carry anyway. Total incremental spend to start: the Convex Pro plan, and nothing else.

**The residual gap to be honest about.** Convex's log delivery is best-effort — "logs can be dropped
if ingestion throughput is too high" and duplicates are possible. Wide events used for *debugging*
tolerate this fine. Wide events used for *billing or exact analytics* do not. If Wheel of Tim ever
needs exact counts (it currently does not), those numbers must come from Convex tables, not from the
event stream.

---

## Source index

**Boris Tane (primary)**
- [Logging Sucks](https://loggingsucks.com) — 21 Dec 2025 (canonical location;
  `boristane.com/blog/logging-sucks/` redirects here)
- [Observability wide events 101](https://boristane.com/blog/observability-wide-events-101/) —
  7 Sep 2024
- [Lessons from starting, building, and exiting a devtools startup](https://boristane.com/blog/learnings-from-starting-building-and-exiting-a-devtools-startup/) —
  7 Jun 2024
- [boristane.com](https://boristane.com/) — bio, Baselime/Cloudflare/polylane affiliations
- [Cloudflare acquires Baselime](https://blog.cloudflare.com/cloudflare-acquires-baselime-expands-observability-capabilities/) —
  Apr 2024

**Lineage (primary)**
- [Stripe — Fast and flexible observability with canonical log lines](https://stripe.com/blog/canonical-log-lines)
- [Charity Majors — Logs vs Structured Events](https://charity.wtf/p/logs-vs-structured-events) — Feb 2019
- [Charity Majors — Live Your Best Life With Structured Events](https://charity.wtf/p/live-your-best-life-with-structured-events) — Aug 2022
- [Honeycomb — Observability 2.0 vs. Observability 1.0](https://www.honeycomb.io/blog/one-key-difference-observability1dot0-2dot0)
- [Honeycomb — Best Practices for Organizing Data](https://docs.honeycomb.io/get-started/best-practices/organizing-data)
- [OpenTelemetry — Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
- [OpenTelemetry — Common specification: attribute limits](https://opentelemetry.io/docs/specs/otel/common/#attribute-limits)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)

**Next.js (version-matched docs)**
- [`instrumentation.js`](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
- [`after`](https://nextjs.org/docs/app/api-reference/functions/after)
- [`proxy.js`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [How to set up instrumentation with OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry)
- [React — `cache`](https://react.dev/reference/react/cache)
- [Node.js — `AsyncLocalStorage`](https://nodejs.org/api/async_context.html)

**Vercel**
- [Working with Drains](https://vercel.com/docs/drains)
- [Log Drains Reference](https://vercel.com/docs/drains/reference/logs)
- [Trace Drains Reference](https://vercel.com/docs/drains/reference/traces)
- [Tracing](https://vercel.com/docs/tracing)
- [Instrumentation (`@vercel/otel`)](https://vercel.com/docs/tracing/instrumentation)
- [`@vercel/otel` README](https://github.com/vercel/otel/blob/main/packages/otel/README.md)
- [Query](https://vercel.com/docs/query)
- [Observability Plus](https://vercel.com/docs/observability/observability-plus)
- [Manage and optimize usage for Observability](https://vercel.com/docs/manage-and-optimize-observability)
- [Vercel Function Logs](https://vercel.com/docs/functions/logs)

**Convex**
- [Log Streams](https://docs.convex.dev/production/integrations/log-streams/)
- [Exception Reporting](https://docs.convex.dev/production/integrations/exception-reporting)
- [Runtimes](https://docs.convex.dev/functions/runtimes)
- [Debugging](https://docs.convex.dev/functions/debugging)
- [Limits](https://docs.convex.dev/production/state/limits)
- [Agents — Debugging (OTel in actions)](https://docs.convex.dev/agents/debugging)

**Vendors**
- [Axiom — Send data from Next.js app to Axiom](https://axiom.co/docs/send-data/nextjs)
- [Axiom — Vercel app](https://axiom.co/docs/apps/vercel)
- [Axiom — Changes to Vercel Log Drains](https://axiom.co/blog/changes-to-vercel-log-drains)
- [Axiom — Pricing](https://axiom.co/pricing)
- [Honeycomb — Pricing](https://www.honeycomb.io/pricing)
- [Honeycomb — 2026 Pro Plan Changes](https://docs.honeycomb.io/get-started/honeycomb/2026-pro-plan-changes)

**Further reading (secondary, flagged as such)**
- Jeremy Morrell's practitioner guide to wide events, cited by Honeycomb as "the comprehensive guide
  to observability 2.0 instrumentation" in
  [Observability 2.0 vs 1.0](https://www.honeycomb.io/blog/one-key-difference-observability1dot0-2dot0)
  and credited as a contributor to chapters 5–6 of *Observability Engineering*, 2nd ed.
