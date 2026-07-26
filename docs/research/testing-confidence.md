# Testing confidence, not test coverage

**Status:** research note. No decisions made here — this is the evidence base for a follow-up
session that will turn it into this repo's specific testing model and CI gate.

**Question asked:** the owner's principle is "testing confidence, not test coverage" — coverage
percentages are risk theatre, and the goal is the right amount of the right tests to earn the
right to promote a build to production. Is that principle supported by anything rigorous, and
can "confidence" be made objective rather than a feeling?

**Scope:** prior art on confidence-based testing; mutation testing (Stryker); interaction testing
(Storybook); visual regression (Chromatic); mocking (MSW vs Vitest); contract testing; and the
promotion gate. Every claim below links to its source. Where the source is practitioner opinion
rather than evidence, it is labelled as such.

**Where this file lives:** the repo had no `docs/research/` convention before this note — only
`docs/agents/`. `docs/research/` is new; subsequent research notes should go alongside it.

---

## 0. Headline finding: can "confidence" be made objective?

**Partly, and only by giving up on the idea that confidence is a number.**

The honest position, which the rest of this document supports:

1. **"Confidence" as a scalar is unfalsifiable.** There is no measurable quantity in a codebase
   that means "confidence." Every candidate (coverage, mutation score, test count) is a proxy, and
   the empirical literature is clear that all of them correlate weakly with real fault detection
   once you control for confounders (§1.3, §2.3). Anyone who reports "our confidence score is 87%"
   has smuggled coverage thinking back in under a new name.

2. **But a *gate* can be objective, in a specific and limited sense.** A gate is objective when
   every one of its conditions is (a) computed by a machine, not judged by a human, and (b)
   traceable to a **named failure mode** that someone wrote down in advance. That second half is
   the part that distinguishes a confidence model from vibes. It gives you a falsifiable audit
   even with zero production data: *for every gate condition, which risk does it exist to catch?
   For every named risk, which gate condition catches it — or is it explicitly accepted?* A gate
   condition with no named risk is theatre. A named risk with no condition and no acceptance is a
   hole. Both are findable by inspection. This is essentially James Bach's risk list
   ([Heuristic Risk-Based Testing, 1999](http://nilachakra.50webs.com/documents/material/L%20-%20RiskAnalysis.pdf))
   wired into CI: the *input* (which risks matter) is subjective and admittedly fallible, but the
   *checking* is mechanical.

3. **The only thing that validates the gate is escaped-defect data over time.** This is the SRE
   error-budget move: don't argue about how much testing is enough, define an objective budget for
   unreliability and let the measured burn rate settle it
   ([Google SRE, *Embracing Risk*](https://sre.google/sre-book/embracing-risk/) — "The error budget
   provides a clear, objective metric that determines how unreliable the service is allowed to be
   within a single quarter. This metric removes the politics from negotiations"). The equivalent
   delivery-side metric is DORA's change failure rate
   ([2024 Accelerate State of DevOps](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf)):
   the percentage of deployments causing failures in production requiring hotfixes or rollbacks.
   If your gate is real, this number falls. If it doesn't, the gate was theatre and you now have
   evidence of that.

4. **The uncomfortable part, stated plainly: for a showcase project you cannot do step 3.** A
   portfolio app with no users generates no production incidents, so there is no escaped-defect
   stream against which to calibrate. That means the confidence model here **cannot be empirically
   validated** — it can only be made *legible* and *internally consistent*. This is the most
   useful finding in this document, and the showcase should say it out loud rather than imply the
   gate has been proven to work. Claiming otherwise would reproduce exactly the sin the owner is
   criticising in coverage percentages: a number that looks like evidence and isn't.

5. **Dijkstra's constraint still binds.** "Program testing can be used to show the presence of
   bugs, but never to show their absence!"
   ([EWD249, *Notes on Structured Programming*](https://www.cs.utexas.edu/~EWD/transcriptions/EWD02xx/EWD249/EWD249.html)).
   No gate can ever mean "this is correct." The most a gate can honestly mean is *"the specific
   failure modes we named have been checked, and no previously-checked behaviour regressed."*
   That is a much smaller claim than "confidence" implies, and it is the claim the vocabulary in
   §8 is built to express.

---

## 1. Prior art on confidence-based rather than coverage-based testing

### 1.1 Kent Beck is the original source, and he is more careful than the slogan

The oldest and best-phrased statement of the principle is Kent Beck's 2008 Stack Overflow answer
to "How deep are your unit tests?"
([source](https://stackoverflow.com/questions/153234/how-deep-are-your-unit-tests)):

> I get paid for code that works, not for tests, so my philosophy is to test as little as possible
> to reach a given level of confidence (I suspect this level of confidence is high compared to
> industry standards, but that could just be hubris). If I don't typically make a kind of mistake
> (like setting the wrong variables in a constructor), I don't test for it. I do tend to make sense
> of test errors, so I'm extra careful when I have logic with complicated conditionals. When coding
> on a team, I modify my strategy to carefully test code that we, collectively, tend to get wrong.

Two things are usually lost when this is quoted. First, Beck's selection criterion is **empirical
and personal**: test the kinds of mistakes *you and your team actually make*. That is a risk model
derived from observed defect history, not from a taxonomy. Second — and this is the honest bit —
Beck explicitly disclaims that this is settled:

> Different people will have different testing strategies based on this philosophy, but that seems
> reasonable to me given the **immature state of understanding of how tests can best fit into the
> inner loop of coding**. Ten or twenty years from now we'll likely have a more universal theory of
> which tests to write, which tests not to write, and how to tell the difference. In the meantime,
> **experimentation seems in order**.

Eighteen years on, that universal theory has not arrived. Beck himself framed this as folklore
pending evidence.

### 1.2 "Write tests. Not too many. Mostly integration." — attribution and content

The slogan is **Guillermo Rauch's**, from a
[tweet on 10 December 2016](https://x.com/rauchg/status/807626710350839808) (a riff on Michael
Pollan's "Eat food. Not too much. Mostly plants."). Kent C. Dodds credits Rauch explicitly and
expanded it into the essay [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests),
which then became the **Testing Trophy** ([classification post](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)).

What Dodds actually argues, in his own words:

- On the "not too many" half: *"you get diminishing returns on your tests as the coverage increases
  much beyond 70% **(I made that number up... no science there)**."* He flags his own number as
  invented. Credit where due — this is more honest than most citations of it.
- On why integration: *"as you move up the pyramid, the confidence quotient of each form of testing
  increases"* and *"Integration tests strike a great balance on the trade-offs between confidence
  and speed/expense."*
- On mocking: *"When you mock something you're removing all confidence in the integration between
  what you're testing and what's being mocked."* **This is in direct tension with the owner's
  "mocks over integrated environments" constraint** and needs to be reconciled deliberately rather
  than ignored — see §5.4.
- The operational heuristic, from [How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test):
  *"What part of this app would make me most upset if it were broken?"* and *"Code Coverage < Use
  Case Coverage."* He is explicit that use-case coverage has no automated report: *"Unfortunately,
  there's no such thing as an automated 'Use Case Coverage Report.' We have to make that up
  ourselves."*
- The Testing Library guiding principle formalises the confidence claim:
  *"The more your tests resemble the way your software is used, the more confidence they can give
  you"* ([Testing Library docs](https://testing-library.com/docs/guiding-principles/)).

**Evidence status: practitioner opinion, self-declared.** Dodds's ROI curves are illustrative
diagrams, not measurements. There is no study behind the Testing Trophy. It is a good heuristic
with an honest author; it is not evidence.

### 1.3 The empirical literature on coverage — this part *is* rigorous

This is where the owner's "coverage is risk theatre" instinct has real backing.

**Inozemtseva & Holmes, ICSE 2014, *Coverage Is Not Strongly Correlated with Test Suite
Effectiveness*** ([PDF](https://cs.uwaterloo.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf)).
31,000 test suites generated across five Java systems up to 724,000 LOC. Findings, verbatim:

> We found that there is a low to moderate correlation between coverage and effectiveness **when the
> number of test cases in the suite is controlled for**. In addition, we found that stronger forms
> of coverage do not provide greater insight into the effectiveness of the suite. Our results
> suggest that coverage, while useful for identifying under-tested parts of a program, **should not
> be used as a quality target** because it is not a good indicator of test suite effectiveness.

The mechanism matters: coverage correlates with effectiveness mostly because it correlates with
*suite size*. Control for size and the signal largely evaporates. They also found the strength
varies per system, so *"it is therefore not generally safe to assume that effectiveness is strongly
correlated with coverage,"* and that branch/MC coverage are no better than statement coverage.

**Google's position** — from *Code Coverage Best Practices* by Adam Bender, Carlos Arguelles and
Marko Ivanković ([original post](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html);
the post body did not render for me, so the verbatim quotes below are taken from co-author Carlos
Arguelles's [republication](https://www.linkedin.com/pulse/great-code-coverage-holy-wars-21st-century-carlos-arguelles-mvvbc)):

> A high code coverage percentage does not guarantee high quality in the test coverage. Focusing on
> getting the number as close as possible to 100% leads to a false sense of security. [...] Code
> coverage does not guarantee that the covered lines or branches have been tested correctly, it
> just guarantees that they have been executed by a test. [...] **A better technique to assess
> whether you're adequately exercising the lines your tests cover, and adequately asserting on
> failures, is mutation testing.**

> But a low code coverage number **does** guarantee that large areas of the product are going
> completely untested by automation on every single deployment. [...] In fact a lot of the value of
> code coverage data is to highlight not what's covered, but **what's not covered**.

> Although there is no "ideal code coverage number," at Google we offer the general guidelines of
> 60% as "acceptable", 75% as "commendable" and 90% as "exemplary." However we like to stay away
> from broad top-down mandates.

This is the precise, defensible version of the owner's position and it should be adopted verbatim:
**coverage is a good negative indicator and a bad positive indicator.** Low coverage is real
evidence of real risk. High coverage is evidence of nothing. Google's supporting infrastructure
paper is [*Code Coverage at Google*, FSE 2019](https://homes.cs.washington.edu/~rjust/publ/google_coverage_fse_2019.pdf)
(Ivanković, Petrović, Just, Fraser).

### 1.4 Risk-based testing

The serious practitioner literature here is James Bach's
[*Heuristic Risk-Based Testing* (1999)](http://nilachakra.50webs.com/documents/material/L%20-%20RiskAnalysis.pdf).
The method is three lines:

> 1. Make a prioritized list of risks.
> 2. Perform testing that explores each risk.
> 3. As risks evaporate and new ones emerge, adjust your test effort to stay focused on the current crop.

Bach's framing is directly useful for a promotion gate: *"If you want higher confidence that you are
testing the right things at the right time, risk-based testing can help. It focuses and justifies
test effort in terms of the mission of testing itself."* And he is candid about its limits:

> Always keep this in mind: your risk analysis is going to be incomplete and inaccurate. [...] To
> manage the risk of poor risk analysis, don't let risk-based testing be the only kind of testing
> you do.

He proposes three concrete artifacts — a **risk checklist**, a **risk/task matrix**, and a
**component risk matrix**. The component risk matrix maps naturally onto a deep-module architecture:
one row per module, risk grade per module, test tactic per cell.

**Evidence status: structured practitioner method, not empirical.** Bach explicitly calls the
analysis "heuristic" — *"a fallible method of solving a problem"*. Its value is that it makes the
subjective input *explicit and reviewable*, which is exactly what an objective gate needs.

### 1.5 Release-readiness and promotion-signal models

The rigorous work here is not in testing literature but in SRE and DevOps research:

- **Error budgets** ([Google SRE, *Embracing Risk*](https://sre.google/sre-book/embracing-risk/)).
  A quarterly budget derived from the SLO, used as a release-velocity control loop: *"as long as the
  system's SLOs are met, releases can continue. If SLO violations occur frequently enough to expend
  the error budget, releases are temporarily halted."* Crucially, the chapter names **testing itself**
  as one of the risk-management dials to be tuned against the budget: *"not enough testing and you
  have embarrassing outages [...] Too much testing, and you might lose your market."* That is the
  owner's principle, stated by Google, with an objective arbiter attached.
- **Canarying** ([SRE Workbook ch. 16](https://sre.google/workbook/canarying-releases/)) as the
  admission that pre-production gates are always incomplete: *"The canary process risks only a small
  fragment of our error budget, which is limited by time and the size of the canary population."*
  Worth noting because it reframes the gate: you are not proving safety, you are bounding blast radius.
- **DORA's four keys** ([2024 report](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf)),
  where **change failure rate** — "the percentage of deployments that cause failures in production,
  requiring hotfixes or rollbacks" — is the stability outcome. Notably, the 2024 report reclassified
  the factors and paired change failure rate with a new **rework rate** metric under "software
  delivery stability", after finding change failure rate had long been a statistical outlier among
  the four.

---

## 2. Mutation testing (Stryker for TypeScript/JavaScript)

### 2.1 What it measures

Stryker's own definitions
([Mutant states and metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/)):

- **Mutation score** = `detected / valid * 100`, where `detected = killed + timeout` and
  `valid = detected + undetected`.
- **Mutation score based on covered code** = `detected / covered * 100`. This second metric is the
  one that decouples mutation quality from coverage gaps, and is the more useful number when you
  are deliberately not covering everything.
- `NoCoverage` is reported separately from `Survived`, so Stryker natively distinguishes *"you have
  no test"* from *"you have a test and it doesn't assert anything useful."* That distinction is the
  whole point.

### 2.2 What it costs, concretely

Real numbers, from primary sources:

- Stryker's own docs benchmark StrykerJS's `utils` package at **2m33s** with `--concurrency 4`
  ([configuration docs, `disableBail`](https://stryker-mutator.io/docs/stryker-js/configuration/)).
  That is a small library.
- At the other end, a Stryker.NET user reports a **~8 hour** full run on a 500-file / 20,000-LOC /
  1,300-test C# backend on an M3 MacBook Pro, timing out GitHub's 6-hour job limit
  ([stryker-net discussion #3013](https://github.com/stryker-mutator/stryker-net/discussions/3013)).
  Different language and runner, but it establishes the shape of the curve: cost scales roughly with
  `mutants × tests-per-mutant`, and it gets bad fast.

Stryker's built-in cost controls, all from the
[configuration docs](https://stryker-mutator.io/docs/stryker-js/configuration/):

- **`coverageAnalysis: "perTest"`** (the default since v5) — runs only the tests covering each
  mutant. Biggest single lever. Does not affect the resulting score.
- **`concurrency`** — defaults to `n-1` logical cores (or `n` when `n <= 4`); accepts percentages.
- **`ignoreStatic`** — skips mutants only executed at module load. Docs: *"Testing these mutants come
  with a big performance penalty."* Requires `coverageAnalysis: "perTest"`.
- **`mutate`** — scope to globs, individual files, or even line ranges (`src/app.js:5-7`).
- **`thresholds: { high: 80, low: 60, break: null }`** — only `break` fails the build (exit code 1),
  and it is `null` by default, i.e. **Stryker ships with no build-breaking gate**. This is a
  deliberate default and worth respecting.

### 2.3 Incremental mode — and a correction

**Stryker's own guidance** ([Incremental docs](https://stryker-mutator.io/docs/stryker-js/incremental/),
available since Stryker 6.2). `--incremental` stores results in `reports/stryker-incremental.json`
and diffs code and test files against it. Results are reused when *"A mutant was 'Killed'; the
culprit test still exists, and it didn't change"* or *"A mutant was not 'Killed'; no new test covers
it, and no tests changed."* Their worked example reuses 3,731 of 3,965 mutant results.

Three limitations that matter for CI design:

1. **Vitest is only "tests per file without location"** in Stryker's incremental support table
   (Jest and CucumberJS are the only "Full" entries). Stryker therefore assumes *all* tests in a
   changed test file changed. With Vitest, expect coarser reuse than the docs' headline example.
2. Changes outside mutated files and test files are invisible to it — dependency bumps, `.snap`
   files, env vars.
3. Static mutants have no per-test coverage, so test changes are never detected for them.

**Correction to a widely-copied claim:** several blog posts recommend `npx stryker run --since main`
for StrykerJS PR runs. **`--since` is a Stryker.NET option, not a StrykerJS one.** It is documented
only under [stryker-net configuration](https://stryker-mutator.io/docs/stryker-net/configuration/)
(`--since:feat-2`, `since.target`, `since.enabled`), does not appear in the
[StrykerJS configuration docs](https://stryker-mutator.io/docs/stryker-js/configuration/), and is not
in StrykerJS's
[options validator schema handling](https://raw.githubusercontent.com/stryker-mutator/stryker-js/master/packages/core/src/config/options-validator.ts).
StrykerJS would warn `Unknown stryker config option`. For StrykerJS diff-scoped runs the supported
route is `--incremental` (with the report file cached across CI runs) plus a computed `--mutate`
glob from `git diff`.

### 2.4 Is mutation score a better confidence proxy than line coverage?

**Yes, but weakly, and the literature genuinely disagrees on how weakly.** This is the most
important nuance in this document and it should not be flattened.

**For the affirmative — Just, Jalali, Inozemtseva, Ernst, Holmes & Fraser, FSE 2014, *Are Mutants a
Valid Substitute for Real Faults in Software Testing?***
([PDF](https://homes.cs.washington.edu/~rjust/publ/mutants_real_faults_fse_2014.pdf)). 357 real
faults, 5 Java programs, 321,000 LOC, 230,000 mutants:

> The results show a statistically significant correlation between mutant detection and real fault
> detection, **independently of code coverage**.

They also report the correlation with mutation score is *significantly higher* than with statement
coverage for 4 of 5 subject programs (Wilcoxon signed-rank, p < 0.05). And they are honest about the
ceiling: **27% of real faults were not coupled to mutants from commonly used operators, and 17% are
not coupled to *any* mutant** — mostly algorithmic rewrites and code-deletion fixes. A related
finding from the same group's slides: *"Don't use code coverage for test suite minimization: You
might miss up to 60% of real faults."*

**For the negative — Papadakis, Shin, Yoo & Bae, ICSE 2018, *Are Mutation Scores Correlated with Real
Fault Detection?*** ([PDF](https://coinse.github.io/publications/pdfs/Papadakis2018hi.pdf)). Two
datasets (CoREBench for C, Defects4J for Java), ~96,000 mutants, 420 real faults:

> Our study shows that correlations are the results of the confounding effects of the test suite
> size. [...] all correlations between mutation scores and real fault detection are **weak when
> controlling for test suite size**. [...] mutants provide **good guidance for improving the fault
> detection** of test suites, but their correlation with fault detection are weak.

Their reconciliation is the useful part, and it is a real distinction rather than a fudge:
*"we demonstrate that mutants can correlate weakly with fault detection, but they can provide
statistically and practically significant fault detection improvements over randomly selected test
suites (or test suites with lower scores) when reaching higher mutation score levels."*

**The synthesis for a gate design:** mutation score is a **good driver** (killing a surviving mutant
usually makes your suite genuinely better) and a **bad scalar** (the absolute number does not
predict how many real bugs you will ship). Use surviving mutants as *work items*. Do not put much
faith in the percentage. This is the same negative-indicator/positive-indicator asymmetry as coverage,
just shifted to a higher-quality signal.

### 2.5 Can it live in CI for a project this size? Google's answer is the best template

Google runs mutation testing across their monorepo, but **not as a build gate**. From Petrović &
Ivanković, [*State of Mutation Testing at Google* (ICSE-SEIP 2018)](https://research.google.com/pubs/archive/46584.pdf)
and Petrović, Ivanković, Fraser & Just,
[*Practical Mutation Testing at Scale: A View from Google* (TSE 2021)](https://homes.cs.washington.edu/~rjust/publ/practical_mutation_testing_tse_2021.pdf):

- The approach is **diff-based and probabilistic**: mutants are generated only on changed lines,
  omitting lines without statement coverage and lines judged "arid."
- **Arid node suppression is the make-or-break feature.** They have *"more than a hundred rules for
  arid node detection"*, and: *"This is the critical part of the system because, without it, users
  would become frustrated with non-actionable feedback and opt out of the system altogether."*
- Delivery is **at code review**, as a comment on the diff, not as a red build. 2 million mutants
  surfaced during review across 760,000 code changes, out of nearly 17 million generated — a ~12%
  surfacing rate.
- Scale: used by 6,000 engineers, affecting 13,000+ code authors.

Translated to this repo: mutation testing is **realistic in CI at this size** (a Next.js app with a
handful of modules), provided it is (a) scoped to a named set of deep modules rather than the whole
tree, (b) run with `coverageAnalysis: "perTest"` and `--incremental` with a cached report file, and
(c) reported as diff-scoped review feedback with, at most, a conservative `break` threshold set below
the current score. Google's own experience says a strict gate on the raw score is the failure mode.

---

## 3. Interaction testing: Storybook play functions and the Vitest addon

### 3.1 What it is

A play function is an async function attached to a story that queries the rendered canvas, drives it
with `userEvent`, and asserts with `expect` — all from the `storybook/test` module, which the docs
describe as combining *"the methods available in Vitest's `expect` as well as those from
`@testing-library/jest-dom`"*
([Interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing)). The query
API *"come[s] directly from Testing Library"* and uses the same `getBy`/`queryBy`/`findBy` matrix and
the same accessibility-first query priority (`ByRole` first, `ByTestId` *"a last resort"*).

Additional primitives worth knowing: `fn()` spies wired through story `args`; `mount()` inside `play`
to run setup before render; `beforeAll`/`beforeEach` in `.storybook/preview.*` for project-wide state
reset; `step()` for grouping; and module mocking that resolves to `__mocks__/` directories.

### 3.2 The Vitest addon vs the test runner

From the [Vitest addon docs](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index):

- The addon *"works by using a Vitest plugin to transform your stories into Vitest tests using
  **portable stories**"* and runs them in **Vitest browser mode with Playwright's Chromium**, which
  the docs recommend and configure by default: *"Browser mode ensures your components are tested in a
  real browser environment, which is more accurate than simulations like JSDom or HappyDom."*
- Critically, it *"does not need to run Storybook to test your stories"* — unlike the older
  **test-runner**, which *"requires a running Storybook instance [...] because it visits each one,
  executes the play function, and listens for results."*
- Constraint: the addon requires a **Vite-based Storybook framework** (Next.js is supported via
  `nextjs-vite`). The test-runner works with any framework.
- It can also compute project coverage from stories.

### 3.3 Does this overlap with, or replace, Testing Library component tests? Is running both duplication?

**Storybook's own answer is that it largely replaces them.** Verbatim from their FAQ:

> **What's the difference between interaction tests and using Vitest + Testing Library alone?**
> Interaction tests integrate Vitest and Testing Library into Storybook. The biggest benefit is the
> ability to view the component you're testing in a real browser. That helps you debug visually,
> instead of getting a dump of the (fake) DOM in the command line or hitting the limitations of how
> JSDOM mocks browser functionality. It's also more convenient to keep stories and tests together in
> one file than having them spread across files.

So: same library, same queries, same assertions, better debugging surface, one file instead of two.
**Running both for the same component is duplication with no confidence gain** — you would be
asserting the same behaviour twice through the same API.

The non-duplicated split that falls out of this:

- **Story + play function** for anything that renders. This is the interaction/UI layer.
- **Plain Vitest (node environment)** for pure logic that has no DOM — the deep-module interiors.
  Browser mode is pure overhead there.
- Storybook also warns against over-applying play functions: *"Interaction tests can be expensive to
  maintain when applied wholesale to every component. We recommend combining them with other methods
  like visual testing."*

One caveat worth flagging for the follow-up session: **browser mode changes what mocking works.**
Vitest's docs mark `vi.spyOn` on module namespace objects and getter-spying as
*"will not work in the Browser Mode"* ([Vitest mocking guide](https://vitest.dev/guide/mocking)).
If interaction tests run in browser mode and unit tests run in node, the two tiers will not share a
mocking idiom. MSW works in both, which is a point in its favour (§5).

---

## 4. Chromatic / visual regression

### 4.1 What it genuinely catches that other layers do not

Storybook's [visual testing docs](https://storybook.js.org/docs/writing-tests/visual-testing) make the
distinction cleanly against snapshot testing:

> Snapshot tests compare the rendered markup of every story against known baselines. This means the
> test compares blobs of HTML and not what the user actually sees. Which in turn, can lead to an
> increase in false positives as code changes don't always yield visual changes in the component.
> Visual tests compare the rendered **pixels** of every story against known baselines.

The genuinely unique catch is **rendered appearance regressions with no DOM signature**: CSS cascade
and specificity changes, design-token drift, font loading and metric shifts, layout/overflow at
specific viewports, and any regression introduced by a dependency or global style change rather than
by the component's own code. No Testing Library assertion, no type check, and no mutation of the
component's source will detect these, because the DOM is unchanged and only the paint differs.

The second, less-discussed value: **it converts every existing story into a test with no test code
written** — *"they are also able to check a large subset of component functionality without having to
write or maintain any test code."* On a project already investing in Storybook, the marginal cost of
the visual layer is close to zero in authoring effort. That is a real argument for including it in a
minimal-tests-maximum-confidence strategy.

### 4.2 The real cost: review friction and false positives

This is where Chromatic's own documentation is most useful, because the existence of the mitigations
is itself evidence of the problem.

**False positives.** Chromatic compares colour distance in YIQ space per pixel against a
`diffThreshold`, default **0.063**
([Threshold docs](https://www.chromatic.com/docs/threshold/)): *"Diff threshold values closer to 0
are more sensitive, but more likely to have false positives, while values closer to 1 are less
sensitive."* Anti-aliased pixels are detected and ignored by default. The knobs they ship —
`delay`, `pauseAnimationAtEnd`, `prefersReducedMotion`, `forcedColors`, `ignoreSelectors`,
`diffIncludeAntiAliasing` ([Playwright configure page](https://www.chromatic.com/docs/playwright/configure/))
— map one-to-one onto the standard sources of visual flake: animation timing, font loading, dynamic
content, and sub-pixel rendering. They maintain a whole
[Unstable tests debugging](https://www.chromatic.com/docs/unstable-tests/) section including a
**Flake filter** that *"detects unstable tests and automatically ignores them so they don't block your
build"*, a trace viewer, and a font-preloading guide.

**Review friction.** Every accepted change is a human decision. Chromatic's product design is largely
an attempt to reduce how often that decision is required:

- The [Visual Tests addon](https://www.chromatic.com/docs/visual-tests-addon/) lets you accept
  baselines locally before pushing, and *"If the code is the same between your last local build and
  the normal build triggered by CI, Chromatic will automatically auto-accept baselines in the normal
  build so that you don't need to review twice."*
- Denying a change is **not possible from the addon** — only from CI or CLI builds.
- Git is mandatory: *"Visual Tests addon requires Git to track baselines for each story."*

**Cost of over-triggering.** [TurboSnap](https://www.chromatic.com/docs/turbosnap/) uses the git diff
plus the Vite/Webpack dependency graph to snapshot only affected stories, billing unchanged stories
at 0.2 of a snapshot instead of 1. But it forces a **full rebuild** on: `package.json` dependency
changes without a valid lockfile, Storybook config changes, **changes to anything imported by
`preview.js`**, static dir changes, infrastructure upgrades, and new browsers. Their own warning:
*"you may have a global decorator configured that's imported from an index or barrel file, which
itself imports a bunch of other files. This can lead to all stories depending on a large swath of
seemingly unrelated files."* Merge commits and rebases take the *union* of changes from both
ancestors, which *"can lead to merges involving more updates than expected."*

**Practical read:** the visual layer's cost is not compute, it is **human triage per PR**, and that
cost is driven almost entirely by how tightly `preview.js` and global decorators are scoped. A
disciplined `preview.js` with no barrel imports is the single highest-leverage thing to get right
before adopting Chromatic.

---

## 5. Mocking: MSW vs Vitest's built-in mocking

### 5.1 The principle the owner is invoking has a precise origin

"Don't mock what you don't own" is from **Freeman, Mackinnon, Pryce & Walnes,
[*Mock Roles, not Objects*, OOPSLA 2004](https://jmock.org/oopsla2004.pdf)**, §4.1, verbatim:

> **Only Mock Types You Own.** Mock Objects is a design technique so programmers should only write
> mocks for types that they can change. Otherwise they cannot change the design to respond to
> requirements that arise from the process. Programmers should not write mocks for fixed types, such
> as those defined by the runtime or external libraries. Instead they should write thin wrappers to
> implement the application abstractions in terms of the underlying infrastructure.

Two things worth noting for this repo specifically. First, **the same paper is where "narrow
interfaces" comes from**: *"This process results in a system of narrow interfaces each of which
defines an interaction between objects."* The mocking discipline and the Ousterhout deep-module
discipline are the same idea reached from two directions — Ousterhout's *"The best modules are those
that provide powerful functionality yet have simple interfaces"*
([A Philosophy of Software Design, quoted here](https://notes.rohitagarwal.dev/KindleHighlights/A%20Philosophy%20of%20Software%20Design/))
describes the module; *Mock Roles, not Objects* describes how testing pressure produces it. That is a
genuinely strong story for the showcase.

Second, Gojko Adzic's refinement — *"Only mock types that you **understand**"* — is arguably the more
usable rule
([discussed by Khorikov](https://khorikov.org/posts/2020-06-15-mocking-types-that-you-own/)).

### 5.2 MSW's position

MSW does not frame itself as a mocking library at all. From
[their philosophy page](https://mswjs.io/docs/philosophy):

> We are convinced that API mocking deserves a **layer of its own** in your application. [...] Such
> level of control is simply impossible when using API mocking as a feature of any other tooling
> because you will always be limited by that tooling.

> Historically, there's been a strong negative association with this term as developers come to see
> mocking as something dirty, unreliable, and hacky. [...] we're coining a new term — **network
> behavior**. Network behavior is a contract-like description of the network's expected state.
> "When request X happens, respond with Y."

The mechanism is what makes it satisfy "don't mock what you don't own": it intercepts at the network
layer via a Service Worker (browser) or a request-interception algorithm (Node), so
*"the entirety of your code runs"* and *"your application knows nothing about the mocking"*
([README](https://github.com/mswjs/msw)). It does not stub `fetch`, `axios`, or your HTTP client. You
are not mocking a third-party *type*; you are describing an HTTP contract — which is a boundary whose
shape you legitimately know.

Their [best-practices guidance](https://mswjs.io/docs/best-practices/avoid-request-assertions) is
directly on-theme and is worth adopting as a rule:

> We highly discourage [request assertions] as they represent **implementation detail testing** and
> sway you into testing how your application is written instead of what it does. [...] Instead of
> asserting that a particular request was made, test how your application reacts to that request.

And the one setting that makes it a gate rather than a comfort blanket:

```js
server.listen({ onUnhandledRequest: 'error' })
```

> This tells MSW to throw an error whenever it encounters a request that doesn't have a matching
> request handler.

That single option converts "we mocked the network" into a **checkable invariant**: no test may make
an undeclared network call. It is machine-verifiable, has no percentage attached, and is exactly the
shape of gate condition §0 argues for.

### 5.3 Vitest's built-in mocking

[Vitest's mocking guide](https://vitest.dev/guide/mocking) covers `vi.fn`, `vi.mock` (hoisted above
imports), `vi.spyOn`, `vi.setSystemTime`, `vi.stubGlobal`, `vi.stubEnv`. Relevant limits:

- Several patterns **do not work in browser mode** — namespace `vi.spyOn`, getter spying, class
  implementation spying. Flagged repeatedly in the docs.
- `vi.mock` partial mocking *"only mocks external access"* — internal calls within the module still
  hit the real implementation.
- Mock state leaks between tests unless explicitly reset: *"Always remember to clear or restore mocks
  before or after each test run."* Idempotency is opt-in, not default.

Module mocking is also, by construction, mocking the *type* rather than the *boundary* — it is the
thing *Mock Roles, not Objects* warns against when applied to code you don't own.

### 5.4 Recommendation and the honest tension

**For network boundaries: MSW.** It is the only option that satisfies all of "idempotent", "no
integrated environment", "works identically in node and browser mode", "doesn't couple tests to the
HTTP client", and "doesn't mock a type you don't own." Its `onUnhandledRequest: 'error'` gives you a
gate condition for free. One MSW handler set can serve Vitest node tests, Storybook play functions,
and Storybook dev mode — which is the *"single source of truth for your network behavior across all
environments and all tools"* claim, and here it is actually true.

**For module boundaries inside your own code: `vi.mock`, sparingly, at deep-module seams.** Storybook
supports the same idiom via `__mocks__` directories, so the two tiers stay consistent.

**For Convex specifically:** [`convex-test`](https://docs.convex.dev/testing/convex-test) is a
*"community-maintained mock implementation of the Convex backend in TypeScript"* designed for Vitest
(with `@edge-runtime/vm`). This is the right primitive for Convex function logic and it fits the
"no standing infrastructure" constraint. Convex's own docs caveat that it *"lacks certain Convex
runtime behaviours"*, so it is a fidelity trade, not a free lunch.

**The tension to resolve deliberately, not silently:** Dodds's argument in §1.2 is that *every* mock
subtracts confidence at that seam, and the owner's constraint is mocks-everywhere. Both cannot be
fully true. The reconciliation available from the sources: MSW subtracts *less* confidence than
module mocking, because your code's full request path still executes and only the wire response is
substituted. But it still subtracts some — nothing in the suite verifies your mock matches the real
provider. **That gap is precisely what contract testing exists to close, which is why §6 is not
optional if §5 is aggressive.**

---

## 6. Contract testing: when does it earn its place?

### 6.1 Pact's own honesty about its scope

Pact publishes an unusually candid
[When to use Pact](https://docs.pact.io/getting_started/what_is_pact_good_for) page. It is good for:

> - You (or your team/organisation/partner organisation) control the development of **both** the
>   consumer and the provider.
> - The consumer and provider are both under active development.
> - The provider team can easily control the data returned in the provider's responses.
> - The requirements of the consumer(s) are going to be used to **drive** the features of the provider.
> - There is a small enough number of consumers for a given provider that the provider team can manage
>   an individual relationship with each consumer team.

And explicitly **not** good for:

> - Testing APIs where the team maintaining the other side of the integration will not also be using Pact
> - Testing APIs where the consumers cannot be individually identified (eg. public APIs).
> - Testing new or existing providers where the functionality is not being driven or altered by the
>   needs of particular consumers
> - Testing "pass through" APIs, where the provider merely passes on the request contents to a
>   downstream service without validating them.
> - Use as a general purpose mocking or stubbing tool for browser driven tests.

The BFF exclusion deserves emphasis for a Next.js app, since Next route handlers are often exactly
this: *"If your API is merely passing on a message to a downstream system [...] you could send anything
you like in the request body, and the provider would respond the same way. The 'contract' that you
really want is between the consumer and the downstream system."*

The theory behind it is Robinson's [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)
on martinfowler.com.

### 6.2 Is "only where a real OpenAPI boundary exists" a sound restriction?

**Yes — with one important reframing.** The restriction is sound, but what it actually selects for is
**schema-based (bi-directional) contract testing rather than consumer-driven Pact**, and those are
different tools with different guarantees.

Pactflow's [bi-directional contract testing](https://support.smartbear.com/pactflow-on-premises/docs/en/user-guide/contract-testing/bi-directional-contract-testing/overview.html)
is the schema-based approach:

> Bi-Directional Contract Testing is a type of **static** contract testing where two contracts — one
> representing consumer expectations, and another representing the provider's capability — are
> compared to ensure they are compatible. [...] The consumer contract is **never replayed against the
> provider code base**.

Its stated use cases read like a list of exactly the situations Pact excludes, and includes
*"API consumers that already make extensive use of API mocking"*, *"Public APIs (documented via
OpenAPI Specifications)"*, and *"Testing against 3rd party APIs"* ([Pactflow](https://pactflow.io/bi-directional-contract-testing/)).

The critical caveat, in their own words:
> **Garbage in, Garbage out** — Contract Testing trusts any provider contract provided. This is true,
> whether it has been tested or not.

Which yields the sound version of the owner's rule:

> Contract testing earns its place **exactly where an OpenAPI document exists that is verified against
> the running provider** (via generation from code, or Dredd/Postman/RestAssured-style verification)
> **and** where your mocks are derived from or validated against that same document.

Without the verification step, an OpenAPI file is a wish, and validating mocks against it just means
your mocks and your wishes agree.

For Convex, note that there is **no OpenAPI boundary** — it is a typed RPC surface, and the type
system plus `convex-test` covers what a contract test would. Applying contract testing there would be
the "blanket safety net" the owner is right to reject. The restriction correctly excludes it.

---

## 7. The promotion gate: expressing a threshold objectively

### 7.1 Real examples of quality gates that are not coverage percentages

**SonarQube's "Sonar way" gate**
([docs](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates))
is the most widely-deployed non-percentage-first gate, and its key structural move is that **every
condition applies to *new code only***:

> - No new issues are introduced *(Number of issues > 0, or Reliability/Security/Maintainability
>   Rating worse than A)*
> - All new Security Hotspots are reviewed *(Security Hotspots Reviewed < 100%)*
> - New code test coverage is greater than or equal to 80.0%
> - Duplication in the new code is less than or equal to 3.0%

Their [Clean as You Code](https://docs.sonarsource.com/sonarqube-server/10.6/user-guide/clean-as-you-code)
rationale: *"Focus on new code metrics [...] new features will be delivered with production-ready
code quality. As long as your quality gate is green, your releases will continue to improve."*

The transferable ideas: **(1) gate the diff, not the repo** — this makes thresholds achievable and
non-punitive on legacy code, and it is the same move Google makes with diff-based mutation testing;
**(2) count-based conditions (`> 0`) rather than percentages** for the things you actually care about;
**(3) 100% conditions on *review* rather than on *coverage*** — "all new security hotspots have been
reviewed" is a human-completion gate, objectively checkable, with no arbitrary percentage.

**Google's mutation-at-review** (§2.5) is the second template: surfacing findings on the diff during
code review rather than failing the build, with aggressive suppression of non-actionable findings.

**Pact's `can-i-deploy`** ([BDCT overview](https://support.smartbear.com/pactflow-on-premises/docs/en/user-guide/contract-testing/bi-directional-contract-testing/overview.html))
is the cleanest example of a genuinely binary promotion signal: it answers *"is this application
version compatible with everything currently deployed in the target environment?"* — a fact about the
world, not a metric with a threshold.

**Error budgets** (§1.5) are the highest-quality example, and the one whose *rhetoric* is most worth
stealing: an objective metric agreed in advance that *"removes the politics from negotiations."*

### 7.2 What makes a gate condition objective

Synthesising the above, a gate condition qualifies as objective when it satisfies all four:

1. **Computed, not judged.** A machine produces pass/fail. No "does this feel well tested?"
2. **Scoped to the diff.** Absolute repo-wide numbers reward inaction and punish legacy debt;
   diff-scoped conditions are stable over time and achievable per-PR. (Sonar, Google.)
3. **Traceable to a named failure mode.** Written down, in the repo, before the condition existed.
   This is the anti-vibes clause and the one no tool gives you. (Bach.)
4. **Falsifiable in principle.** There is some observation that would show it was the wrong condition
   — normally an escaped defect in a class the condition claimed to cover. (DORA / error budgets.)

Condition 4 is the one this project cannot satisfy with data (§0.4). It can, however, be satisfied
*structurally*: log every bug found after merge, classify it against the risk register, and record
whether the gate should have caught it. That is a manual escaped-defect ledger. On a project with a
handful of bugs it is not statistics, but it is honest bookkeeping, and it makes the gate falsifiable
in principle rather than only in theory.

---

## 8. Honest ledger: what is evidence and what is folklore

| Claim | Status | Best source |
|---|---|---|
| High coverage does not indicate an effective suite | **Empirical** (31k suites, 5 systems) | [Inozemtseva & Holmes 2014](https://cs.uwaterloo.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf) |
| Low coverage *does* indicate real untested risk | **Empirical / industrial practice** | [Google, Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html) |
| Coverage's apparent effectiveness is mostly suite size | **Empirical** | [Inozemtseva & Holmes 2014](https://cs.uwaterloo.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf) |
| Mutation score beats coverage as a fault-detection proxy | **Empirical, contested** | [Just et al. 2014](https://homes.cs.washington.edu/~rjust/publ/mutants_real_faults_fse_2014.pdf) vs [Papadakis et al. 2018](https://coinse.github.io/publications/pdfs/Papadakis2018hi.pdf) |
| Mutation score correlates weakly once size is controlled | **Empirical** | [Papadakis et al. 2018](https://coinse.github.io/publications/pdfs/Papadakis2018hi.pdf) |
| ~17% of real faults are not coupled to *any* mutant | **Empirical** | [Just et al. 2014](https://homes.cs.washington.edu/~rjust/publ/mutants_real_faults_fse_2014.pdf) |
| Diff-scoped mutation testing is viable at industrial scale | **Industrial evidence** (760k changes) | [Petrović et al. 2021](https://homes.cs.washington.edu/~rjust/publ/practical_mutation_testing_tse_2021.pdf) |
| Mutant suppression is required for adoption | **Industrial evidence** | [Petrović et al. 2021](https://homes.cs.washington.edu/~rjust/publ/practical_mutation_testing_tse_2021.pdf) |
| The Testing Trophy's ROI shape | **Folklore, honestly labelled** | [Dodds](https://kentcdodds.com/blog/write-tests) ("I made that number up... no science there") |
| "Integration tests give more confidence per unit cost" | **Folklore** (plausible, unmeasured) | [Dodds](https://kentcdodds.com/blog/write-tests) |
| "Test as little as possible to reach a given level of confidence" | **Folklore, self-declared as pre-theoretical** | [Kent Beck](https://stackoverflow.com/questions/153234/how-deep-are-your-unit-tests) |
| Risk-based test prioritisation | **Structured method, explicitly heuristic** | [Bach 1999](http://nilachakra.50webs.com/documents/material/L%20-%20RiskAnalysis.pdf) |
| "Only mock types you own" | **Design argument, not measured** | [Freeman et al. 2004](https://jmock.org/oopsla2004.pdf) |
| Error budgets remove subjectivity from release decisions | **Industrial practice, widely adopted** | [Google SRE](https://sre.google/sre-book/embracing-risk/) |
| Change failure rate as a stability outcome | **Empirical, large-N survey** | [DORA 2024](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf) |
| Storybook interaction tests subsume TL component tests | **Vendor claim, mechanically plausible** | [Storybook FAQ](https://storybook.js.org/docs/writing-tests/interaction-testing) |
| Visual tests catch what DOM assertions cannot | **Vendor claim, mechanically sound** | [Storybook](https://storybook.js.org/docs/writing-tests/visual-testing) |
| Visual testing has a real false-positive cost | **Vendor-documented** (by the existence of the mitigations) | [Chromatic threshold](https://www.chromatic.com/docs/threshold/), [unstable tests](https://www.chromatic.com/docs/unstable-tests/) |

**The single most important line in this table:** the two strongest empirical papers on mutation
testing disagree, and neither supports using mutation score as a confidence *number*. Both support
using surviving mutants as *work items*. Any gate built on this research should reflect that.

---

## 9. Proposed vocabulary

Deliberately no numbers here — the follow-up session sets those. These are the *terms* the repo's
model should be expressed in, chosen so that every one of them is either machine-checkable or
explicitly labelled as a judgement.

### 9.1 The core objects

**Risk.** A named way this application can fail, written in user-observable terms, recorded in a
risk register with a severity. Bach's list, made durable. *Example: "the wheel selects a name that
was already removed."* Subjective input; the fact that it is written down is objective.

**Seam.** Michael Feathers: *"a place where you can alter behavior in your program without editing in
that place"*, with an **enabling point** — *"a place where you can make the decision to use one
behavior or another"*
([WELC ch. 4](https://ptgmedia.pearsoncmg.com/images/0131177052/samplechapter/0131177052_ch04.pdf)).
In this codebase the seams are the narrow interfaces of the deep modules, plus the network boundary
(MSW) and the Convex boundary (`convex-test`). "Testing at the seams" means: *tests attach at
enabling points, never inside module interiors.*

**Probe.** One automated check attached to one seam. Every probe has a **tier** (§9.2) and cites at
least one Risk. A probe that cites no Risk is deleted. This is the unit that replaces "a test" in
conversation, and it is what stops the model from being a test-count in disguise.

**Coverage of risk (not of lines).** The fraction of registered Risks that have at least one probe.
Objectively computable *given the register*; the register itself is the honest subjective input.
Dodds's "use case coverage" with the bookkeeping actually done.

### 9.2 The tiers

Named by what each one is *uniquely able to falsify*, not by size. If two tiers can falsify the same
thing, one of them is redundant.

| Tier | Unique falsification | Instrument |
|---|---|---|
| **Type tier** | Shape and nullability violations | TypeScript |
| **Logic tier** | Deep-module behaviour at its narrow interface | Vitest, node env |
| **Interaction tier** | User-observable component behaviour in a real browser | Storybook play + Vitest addon (Chromium) |
| **Appearance tier** | Rendered pixels with no DOM signature | Chromatic |
| **Boundary tier** | Agreement between our mocks and a verified provider contract | Schema/BDCT — *only where a verified OpenAPI document exists* |
| **Adversarial tier** | Probes that execute code without asserting anything about it | Stryker |

The adversarial tier is deliberately not called "mutation testing" in the model: its job is to
falsify *the other tiers*, not the product. It is a meta-probe.

### 9.3 The gate

**Promotion gate.** The set of conditions that must hold to promote a build. Every condition must be
(1) computed, (2) diff-scoped, (3) risk-cited, (4) falsifiable in principle. Adopt Sonar's
Clean-as-You-Code structure: conditions apply to changed code, not to the repository total.

**Gate condition kinds**, in descending order of trustworthiness:

- **Invariant** — a binary fact with no threshold. *No unhandled network request
  (`onUnhandledRequest: 'error'`). No consumer expectation absent from the verified provider contract.
  Every registered Risk of severity ≥ X has ≥ 1 probe.* These are the good ones. Prefer them.
- **Ratchet** — a value that may not get worse than the last promoted build. Diff-scoped mutation
  score is a ratchet, never a fixed target: the literature supports "higher is better" and does not
  support any particular number. Stryker's `break` threshold, set below current, is exactly a ratchet.
- **Review completion** — a human decision that must be *recorded*, not *judged* by CI. *All Chromatic
  changes accepted or denied. All surviving mutants on the diff triaged as killed, ignored-with-reason,
  or accepted-as-arid.* Sonar's "security hotspots reviewed = 100%" is this pattern.
- **Percentage** — used only as a **floor to detect neglect**, never as a target, per Google's
  negative-indicator framing. Explicitly labelled in the config as such so nobody mistakes it for a
  quality measure.

**Arid probe / arid mutant.** Petrović et al.'s term, adopted directly: a finding in code where nobody
believes a test would improve fault detection. Suppression rules are a **first-class, reviewed
artifact**, not config noise — Google needed 100+ rules and says adoption depends on them.

**Escaped defect ledger.** Every bug found after merge, classified against the risk register, with a
recorded verdict: *should the gate have caught this?* Three outcomes — **gate hole** (add a condition),
**accepted risk** (record the acceptance), or **unregistered risk** (add to the register). This is the
only mechanism in the model that can prove the gate wrong, and it is manual.

### 9.4 Language to avoid

- **"Confidence score" / "confidence %"** — reintroduces exactly the failure mode being criticised.
  There is no such number. Say *"which risks are probed"* instead.
- **"Well tested"** — unfalsifiable. Say *"risk R is probed at tier T."*
- **"Coverage"** unqualified — always say *line coverage* or *risk coverage*; they are unrelated
  quantities and conflating them is the original sin.
- **"Mutation score of N%"** as a quality claim — the literature does not support it. Say
  *"N mutants survived on this diff, triaged as follows."*

### 9.5 The sentence the gate is trying to license

Everything above exists to make one sentence true and checkable at promotion time:

> *Every risk we have named at severity ≥ X is probed at the tier that can falsify it; nothing
> previously probed has regressed; every finding has been triaged by a human or suppressed by a
> reviewed rule; and when this turns out to be insufficient, the escaped defect will tell us which
> clause was wrong.*

That is not confidence. It is a bounded, auditable, falsifiable claim — which, per Dijkstra, is the
most any test suite can offer, and considerably more than a coverage percentage offers.

---

## Sources

**Prior art / philosophy**
- Kent Beck, [How deep are your unit tests? (Stack Overflow, 2008)](https://stackoverflow.com/questions/153234/how-deep-are-your-unit-tests)
- Guillermo Rauch, [original tweet (2016)](https://x.com/rauchg/status/807626710350839808)
- Kent C. Dodds, [Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- Kent C. Dodds, [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- Kent C. Dodds, [How to know what to test](https://kentcdodds.com/blog/how-to-know-what-to-test)
- Testing Library, [Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- James Bach, [Heuristic Risk-Based Testing (1999)](http://nilachakra.50webs.com/documents/material/L%20-%20RiskAnalysis.pdf)
- Michael Feathers, [The Seam Model (WELC ch. 4, sample chapter)](https://ptgmedia.pearsoncmg.com/images/0131177052/samplechapter/0131177052_ch04.pdf) · [Seam Types](https://www.informit.com/articles/article.aspx?p=359417&seqNum=3)
- Freeman, Mackinnon, Pryce & Walnes, [Mock Roles, not Objects (OOPSLA 2004)](https://jmock.org/oopsla2004.pdf)
- John Ousterhout, A Philosophy of Software Design — [deep-module quotes](https://notes.rohitagarwal.dev/KindleHighlights/A%20Philosophy%20of%20Software%20Design/)
- Edsger Dijkstra, [Notes on Structured Programming, EWD249](https://www.cs.utexas.edu/~EWD/transcriptions/EWD02xx/EWD249/EWD249.html)
- Ian Robinson, [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html)

**Empirical research**
- Inozemtseva & Holmes, [Coverage Is Not Strongly Correlated with Test Suite Effectiveness (ICSE 2014)](https://cs.uwaterloo.ca/~rtholmes/papers/icse_2014_inozemtseva.pdf)
- Just, Jalali, Inozemtseva, Ernst, Holmes & Fraser, [Are Mutants a Valid Substitute for Real Faults? (FSE 2014)](https://homes.cs.washington.edu/~rjust/publ/mutants_real_faults_fse_2014.pdf)
- Papadakis, Shin, Yoo & Bae, [Are Mutation Scores Correlated with Real Fault Detection? (ICSE 2018)](https://coinse.github.io/publications/pdfs/Papadakis2018hi.pdf)
- Petrović & Ivanković, [State of Mutation Testing at Google (ICSE-SEIP 2018)](https://research.google.com/pubs/archive/46584.pdf)
- Petrović, Ivanković, Fraser & Just, [Practical Mutation Testing at Scale (TSE 2021)](https://homes.cs.washington.edu/~rjust/publ/practical_mutation_testing_tse_2021.pdf)
- Ivanković, Petrović, Just & Fraser, [Code Coverage at Google (FSE 2019)](https://homes.cs.washington.edu/~rjust/publ/google_coverage_fse_2019.pdf)
- DORA, [2024 Accelerate State of DevOps Report](https://dora.dev/research/2024/dora-report/2024-dora-accelerate-state-of-devops-report.pdf)

**Tooling docs**
- Stryker: [configuration](https://stryker-mutator.io/docs/stryker-js/configuration/) · [incremental](https://stryker-mutator.io/docs/stryker-js/incremental/) · [mutant states & metrics](https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/) · [Stryker.NET config (`--since`)](https://stryker-mutator.io/docs/stryker-net/configuration/) · [options validator source](https://raw.githubusercontent.com/stryker-mutator/stryker-js/master/packages/core/src/config/options-validator.ts)
- Storybook: [interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing) · [Vitest addon](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index) · [visual tests](https://storybook.js.org/docs/writing-tests/visual-testing)
- Chromatic: [Visual Tests addon](https://www.chromatic.com/docs/visual-tests-addon/) · [TurboSnap](https://www.chromatic.com/docs/turbosnap/) · [threshold](https://www.chromatic.com/docs/threshold/) · [unstable tests](https://www.chromatic.com/docs/unstable-tests/) · [Playwright configure options](https://www.chromatic.com/docs/playwright/configure/)
- MSW: [philosophy](https://mswjs.io/docs/philosophy) · [avoid request assertions](https://mswjs.io/docs/best-practices/avoid-request-assertions) · [README](https://github.com/mswjs/msw)
- Vitest: [mocking guide](https://vitest.dev/guide/mocking)
- Convex: [convex-test](https://docs.convex.dev/testing/convex-test)
- Pact: [When to use Pact](https://docs.pact.io/getting_started/what_is_pact_good_for) · [Bi-directional contract testing](https://support.smartbear.com/pactflow-on-premises/docs/en/user-guide/contract-testing/bi-directional-contract-testing/overview.html) · [Pactflow BDCT](https://pactflow.io/bi-directional-contract-testing/)
- SonarQube: [quality gates](https://docs.sonarsource.com/sonarqube-server/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates) · [Clean as You Code](https://docs.sonarsource.com/sonarqube-server/10.6/user-guide/clean-as-you-code)
- Google SRE: [Embracing Risk](https://sre.google/sre-book/embracing-risk/) · [Canarying Releases](https://sre.google/workbook/canarying-releases/)
