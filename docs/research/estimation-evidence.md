# Software estimation: the evidence and the history

Research note for the estimation-poker product. Written against primary sources —
original papers, books' authors writing in their own voice, and the empirical
studies themselves — not secondary summaries of them.

**Bottom line up front:** the product's intended stance ("estimation is about
finding clarity in a piece of work, not predicting how long it will take") is
*defensible as a design choice* but **not** defensible as a claim about what
estimation historically was or what its inventors meant. The people who invented
planning poker and story points both meant duration. The "clarity" benefit is
real but is supported by a small number of modest studies, and one of the few
direct studies of planning poker found it performs *worse* on unfamiliar work —
which is exactly the work the product wants to point it at. Details in
[§8](#8-the-core-claim-does-estimation-surface-disagreement-and-ambiguity) and
[§10](#10-implications-for-the-product).

---

## 0. How to read this document

Every substantive claim is tagged with an epistemic label:

| Label | Meaning |
| --- | --- |
| **[A] Well supported** | Multiple independent studies, or a large well-designed study, or an unambiguous primary-source statement of historical fact. Safe to build product copy on. |
| **[B] Contested** | Real evidence exists on more than one side, or the evidence is thin (single study, small n, one organisation). State it with hedging or don't state it. |
| **[C] Folklore** | Widely repeated in the agile world, contradicted or unsupported by the primary sources. Do not repeat it. |

### Sourcing caveats

I read the following in full: Grenning's 2002 paper, Jeffries' *Story Points
Revisited* and *Estimation is Evil*, McConnell's *17 Theses* and Construx's Cone
of Uncertainty page, Holub's #NoEstimates introduction, Jørgensen's 2004 review
and 2013/2014 IEEE Software articles, Little's 2006 Cone paper, Little &
Cottmeyer's 2016 HICSS paper, Tawosi et al.'s 2022 ESEM paper, Kahneman &
Tversky's 1977 technical report, Eveleens & Verhoef 2009, Haugen's 2006
conference slide deck, and Grenning's 2023 LinkedIn retrospective.

I did **not** have access to: the full text of Mike Cohn's *Agile Estimating and
Planning* (2005), Boehm's *Software Engineering Economics* (1981), Vasco
Duarte's *NoEstimates* book, or the paywalled journal versions of
Moløkken-Østvold & Haugen (2008) and Buehler et al. (2005). Where I rely on an
abstract rather than a full text I say so inline. Boehm's original cone figure is
cited via Little's reproduction of it (Figure 4 of Little 2006), which is a
faithful secondary rendering of a primary figure.

---

## 1. Where planning poker actually came from

### The original paper

James Grenning, *Planning Poker or How to avoid analysis paralysis while release
planning*, April 2002 —
[full text (PDF)](https://wingman-sw.com/papers/PlanningPoker-v1.1.pdf).

**[A]** The paper states the problem it was invented to solve in its own first
paragraph, and it is not ambiguity or shared understanding. It is **meeting
throughput and participation**. Grenning's opening scene:

> "Two guys are involved in discussing the impact of the story on the system.
> Reluctantly, an estimate is tossed out on the table. They go back and forth for
> quite a while. Everyone else in the room is drifting off, definitely not
> engaged. […] You just wasted 20 minutes of valuable time. You have 25 more
> stories to estimate."

And explicitly: *"There were two problems identified in the opening paragraph:
estimates were taking a long time, and the whole team was not involved."*

**[A]** The stated goal of the estimation activity itself is scope, not clarity:

> "The release-planning objective is to get a ballpark estimate of the effort to
> build the product, and to split the product into interesting release. Precision
> of individual estimates is not the goal. Determining the project scope is."

**[A]** The original deck was **1, 2, 3, 5, 7, 10, ∞** — *not* Fibonacci. Grenning
describes it as "designed for unitless numbers **or ideal programming days**".
Corroborated independently at [OEIS A193622](https://oeis.org/A193622/internal).
The Fibonacci-ish sequence {1/2, 1, 2, 3, 5, 8, 13, 20, 40, 100} came later via
Mike Cohn's commercial decks. **[C]** Any product copy claiming Fibonacci spacing
was chosen because "uncertainty grows non-linearly with size" is folklore with
respect to the original — Grenning's stated reason for the gaps is simply "as the
estimates get longer, the precision goes down", and he tells you to play two
cards at once if you want a 4 or a 6 because "the added precision probably won't
help a lot".

**[A]** Grenning does state something close to the clarity argument, but as a side
effect and framed around *efficiency*:

> "Common ground and differences become evident. The team can focus its energy on
> the differences and not waste valuable time on where they already agree."

He also names the risk the product will have to design around:

> "One concern with planning poker is that important discussions might not happen.
> Estimates could become meaningless without the discussions."

### Where the technique came from

**[A]** Grenning's own account
([LinkedIn, 2023](https://www.linkedin.com/posts/jwgrenning_continuing-al-shalloways-suggestion-to-activity-7122276092870041600-95Xq);
[blog, 2008](http://blog.wingman-sw.com/archives/20)) traces it to **Silent
Brainstorming**, a Total Quality Management technique he learned at Teradyne in
the 1980s–90s — not to Wideband Delphi. Wikipedia and much secondary literature
call planning poker "a variation of the Wideband Delphi method"; Grenning has
said he would have forgotten Wideband Delphi by 2002. Treat the Delphi ancestry
as **[B]** — structurally true, historically not his stated influence.

### The inventor abandoned it

**[A]** This is the single most awkward fact for a planning-poker product, and it
is unambiguous. Grenning, in the same 2023 post:

> "We stopped using and promoting Planning Poker in 2003. […] I agree with Al
> Shalloway, stop using Planning Poker. Certainly on big batches of stories;
> there could be a place for it when there are only a few stories; you be the
> judge. Strive to be problem solvers, not dogma followers."

His replacement is **Affinity Grouping** (also a TQM technique, suggested to him
by Lowell Lindstrom about a year after the first game): sort stories into piles of
similar effort, then assign a number per pile. His verdict: *"It worked just as
well at getting to wrong estimates and had the advantage of being fast. You could
estimate the development effort of over 100 stories in a morning. You'd be at it
for days with planning poker."* He reports a client getting essentially the same
result in a few hours that a month-long formal estimation effort had produced.

And: *"Consider that all early estimates are wrong. More rigor does not usually
make them any better. So you might as well be wrong quickly and get to work."*

### Mike Cohn's role

**[A]** Cohn popularised the technique in *Agile Estimating and Planning* (2005)
after reading Grenning's paper (Grenning: *"Mike Cohn read my paper and asked if
he could put it in his book and started giving away decks of planning poker cards
at conferences"*). Cohn's company subsequently trademarked the term and built a
digital tool. This matters commercially — check the trademark position before
naming the product "Planning Poker".

**[B]** Cohn's *current* position (from his own podcast, [Agile Mentors #174,
"Why Estimating Still Matters"](https://www.mountaingoatsoftware.com/agile/podcast/174-why-estimating-still-matters-with-mike-cohn))
is much closer to the product's intended stance than his 2005 book was — see
[§8](#8-the-core-claim-does-estimation-surface-disagreement-and-ambiguity).

---

## 2. Story points: original intent, and how it drifted

### They meant time. Both originators say so.

**[A]** Ron Jeffries, *Story Points Revisited*
([ronjeffries.com](https://ronjeffries.com/articles/019-01ff/story-points/Index.html)):

> "In XP, stories were originally estimated in time: the time it would take to
> implement the story. We quickly went to what we called 'Ideal Days' […] We
> multiplied Ideal Days by a 'load factor' to convert to actual implementation
> time. Load factor tended to be about three […] So, as I recall it, we started
> calling our 'ideal days' just 'points'. So a story would be estimated at three
> points, **which meant it would take about nine days to complete**."

The reason for the rename was stakeholder confusion, not a change of meaning:
stakeholders "were often confused by how it could keep taking three days to get a
day's work done".

**[A]** Jeffries' widely quoted line is genuine and comes from a
[2007 scrumalliance mailing-list post](https://groups.google.com/g/scrumalliance/c/ag8W8xtKQs8/m/4cOpyt8Jgr0J):

> "Story Points were invented to obfuscate duration so that certain managers
> would not pressure the team over estimates. Using elapsed time is probably
> better if the environment is healthy enough not to obsess over meeting the
> estimates."

In the same post: *"When we invented Story Points, we had in mind simply 'how
long will it take to do this story'. If one must use them, this still seems to me
to be the best definition."* And: *"we invented story points, with some
definition like 'one story point is one-half an ideal day'."*

**[A]** Mike Cohn, in his own words on his own site
([What Are Story Points](https://www.mountaingoatsoftware.com/blog/what-are-story-points),
[Agile Estimating: How Teams Estimate with Story Points](https://www.mountaingoatsoftware.com/agile/agile-estimation-estimating-with-story-points)):

> "Effort is essentially the person-days (or hours) required to do something. In
> this way, **effort is about time — how long it will take to do something**. […]
> So, story points are about effort — the time required to do something. Risk,
> uncertainty, and complexity are factors that may influence the effort involved."

And, pointedly, [*It's Effort, Not Complexity*](https://www.mountaingoatsoftware.com/blog/its-effort-not-complexity):
*"I find too many teams who think that story points should be based on the
complexity of the user story or feature rather than the effort to develop it. […]
story points are not solely about complexity."* Cohn's stamp-licking-vs-brain-
surgery example exists specifically to make the point that two items of wildly
different complexity get the same points if they take the same time.

### **[C] Folklore: "story points measure complexity, not time."**

This is the single most repeated claim in the agile world about story points, and
**both** the person who invented them and the person who popularised them
explicitly contradict it in their own writing. It is folklore. If the product's
copy says "points aren't time," it is arguing against Jeffries and Cohn, and it
should say so honestly rather than claiming their authority.

### Jeffries' regret — his actual words

**[A]** From *Story Points Revisited*, the four things he says when asked whether
he regrets them or merely deplores their misuse:

> - "I certainly deplore their misuse;
> - I think using them to predict 'when we'll be done' is at best a weak idea;
> - I think tracking how actuals compare with estimates is at best wasteful;
> - I think comparing teams on quality of estimates or velocity is harmful."

And the summing up, which is *more measured than it is usually quoted as being*:

> "Well, if I did invent story points, I'm probably a little sorry now, **but not
> very sorry**. I do think that they are frequently misused and that we can avoid
> many pitfalls by not using story estimates at all. If they're not providing
> great value to your team or company, I'd advise dropping them on the grounds
> that they are waste. **If, on the other hand, you just love them, well, carry
> on!**"

His preferred alternative is **story slicing** — cut stories down until each needs
a single acceptance test (a trick he credits to Neil Killick) — and he is candid
that this involves an implicit estimate: *"I don't care to quibble with you about
whether there must be some kind of estimation going on in slicing."*

### Do story points predict anything?

**[A] Largest study to date: mostly no.** Tawosi, Moussa & Sarro, *On the
Relationship Between Story Points and Development Effort in Agile Open-Source
Software*, ESEM 2022
([PDF](https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf),
[DOI](https://doi.org/10.1145/3544902.3546238)). 37,440 user stories from 37
Jira-tracked open-source projects:

> "the correlation between the human-expert estimated SP and the approximated
> development time is **strong for only 7% of the projects** investigated, and
> medium (58%) or low (35%) for the remaining ones. […] the estimation made is
> often not consistent throughout the project and the human estimator tends to
> **misestimate in 78% of the cases**."

They also found consistency "starts to wear when the issues are estimated to be
bigger than five points" and recommend breaking anything above 5 SP down.
*Caveat:* all projects are open source, and "development time" is a proxy derived
from Jira status transitions (the authors validate it against the smaller subset
where real time was logged, and get the same answer).

**[A] Story points add ~nothing over just counting stories.** Little & Cottmeyer,
*To Estimate or #NoEstimates, that is the Question*, HICSS 2016
([PDF](https://toddlittleweb.com/Papers/Estimates%20or%20NoEstimates%20HICSS%202016-06-15.pdf)).
55 projects across nine organisations, plus a Monte Carlo replication:

> "We found that projections based on throughput (story counts) were essentially
> identical to that of using velocity (story points). Neither velocity nor
> throughput were great predictors as the uncertainty bands were rather large."

Concretely: *"if a team forecasts that they have about 6 months remaining, the P10
to P90 bands for 80% confidence are roughly 3.2 to 11.2 months."* Their simulations
show velocity only starts to beat throughput when the spread of story sizes is
large (P90/P10 ≈ 6), and that bucketing schemes (Fibonacci, powers of 2/3/4) have
negligible effect — larger buckets slightly *degrade* velocity's advantage.

**[A] Relative estimation has its own biases.** Jørgensen, *Relative Estimation of
Software Development Effort: It Matters With What and How You Compare*, IEEE
Software 2013
([author PDF](https://web-backend.simula.no/sites/default/files/publications/Simula.simula.814.pdf),
[DOI](https://doi.org/10.1109/MS.2012.70)). Four experiments with professional
developers in Ukraine, Vietnam and Thailand. Findings:

- **Assimilation.** Tasks are judged more similar than they are. Two systems whose
  real effort differed by ≥180 work-hours were judged 40 hours apart by one group
  and 80 by the other.
- **Direction-of-comparison asymmetry.** "How much *more* than B is A?" and "how
  much *less* than A is B?" get different answers (p=0.005). Grounded in Tversky's
  1977 feature-matching theory.
- **Format matters.** Work-hour differences and "percentage of" ratios produce
  *opposite* biases.
- **Study 4 is specifically about story points.** With a *small* reference story
  set at 10 points, the median estimate of the larger story was 23 (i.e. 230%);
  with the *large* story as the 10-point reference, the smaller came out at 3
  (implying the larger is 333%). Ground truth: the larger story took at least 3×
  the effort. His recommendation: **do not use a small user story as your baseline
  reference** — use a medium one.

This is important for the product's UX: your choice of reference story is a
biasing input, not a neutral one.

---

## 3. #NoEstimates — the argument and the counterarguments

### What the proponents actually say

**Woody Zuill** coined the hashtag. His own framing
([The NoEstimates Hashtag, 2013](https://zuill.us/WoodyZuill/2013/05/17/the-noestimates-hashtag/);
[Why do we need estimates?, 2013](https://zuill.us/WoodyZuill/2013/04/13/why-do-we-need-estimates/)):

> "#NoEstimates is a hashtag for the topic of **exploring alternatives** to
> estimates [of time, effort, cost] for making decisions in software development."

> "We don't need estimates, we need to make decisions. […] The answer is, we need
> them only if we can't find a better way to make decisions."

**[A]** Note how weak the actual claim is. Zuill's position is a question, not a
prohibition. The strong "estimates are always waste" position belongs to Holub and
Jeffries, not Zuill.

**Allen Holub**, [#NoEstimates, An Introduction](https://holub.com/noestimates-an-introduction/),
is the maximalist:

> "Estimates are waste. Not only are they not necessary, but they introduce
> dysfunction into the team. We should really just stop doing them."

His positive proposal: measure, don't guess. *"The core of the #NoEstimates
approach is to make decisions based on projections that come from actual
measurements"* — specifically average stories completed per week, with story size
ignored because averages absorb it. He argues you can make funding decisions 4–6
weeks into a project rather than up front.

**Holub directly attacks the product's core premise.** This is the sharpest
primary-source objection you will face and you should quote it in your own docs
rather than pretend it doesn't exist:

> "an answer I often get to the 'why do you estimate when you know it's going to
> be wrong' question is 'It helps us think about the problem.' Leaving aside the
> obvious response that **nothing's stopping you from thinking about the problem
> without using estimating as an excuse**, I'd argue that the focus of much of
> that thinking is so narrow as to be ineffective. You estimate by breaking down a
> problem into small implementation tasks and assessing each one, but **the
> interesting question is whether you need to do those tasks at all, not how long
> they'll take**."

**Vasco Duarte**,
[Story Points Considered Harmful (2012)](https://softwaredevelopmenttoday.com/2012/01/story-points-considered-harmful-or-why-the-future-of-estimation-is-really-in-our-past/)
and [The #NoEstimates How To (2013)](http://softwaredevelopmenttoday.blogspot.com/2013/07/the-noestimates-how-to.html):
count completed stories, use throughput as your forecast, keep stories small and
uniform. *"The alternative to Story Point estimation is simple: just count the
number of Stories you have completed."*

**Ron Jeffries**' logical version,
[#NoEstimates isn't crazy](https://ronjeffries.com/articles/018-01ff/no-estimates-logic/):
estimates are not product, therefore in Lean terms they are waste, therefore we
should always want to reduce them; the limit of that process is zero. He is
careful about the conclusion: *"We always could stop estimating, but it's not
always the right thing to do. It's always legitimate to think about it."* See also
[Estimation is Evil](https://ronjeffries.com/articles/021-01ff/estimation-is-evil/)
(PragPub, Feb 2013) on the estimate→promise→pressure→quality-collapse dynamic.

### The counterarguments

**Steve McConnell, [17 Theses on Software Estimation](https://stevemcconnell.com/17-theses-software-estimation/)**
(2015; [expanded version](https://www.construx.com/blog/17-theses-on-software-estimation-expanded/)).
The strongest ones:

- **Thesis 3 [A]:** Several things #NoEstimates advocates call "not estimation"
  *are* estimation. Showing photos of $30k kitchen remodels is reference-class
  forecasting. *"Is doing a few iterations, calculating team velocity, and then
  using that empirical velocity data to project a completion date count as
  estimation? Yes it does. Not only is it estimation, it is a really effective
  form of estimation."* This is a genuinely strong point: Holub's and Duarte's
  throughput projections **are** estimates by any normal definition, and Little &
  Cottmeyer's data shows they carry the same uncertainty bands as story points.
- **Thesis 5 [A]:** He lists ~14 concrete business decisions that consume
  estimates (CapEx/OpEx split, portfolio funding, staffing, revenue recognition,
  market commitments). *"The #NoEstimates response to these business needs is
  typically of the form, 'Estimates are inaccurate and therefore not useful for
  these purposes' rather than, 'The business doesn't need estimates for these
  purposes.'"*
- **Thesis 7 [A]:** *"planning is about 'how' and estimation is about 'how much.'"*
  Many #NoEstimates examples are indictments of detailed waterfall planning, not
  of estimation.
- **Thesis 10 [A]:** People conflate *estimate*, *target*, and *commitment*. This
  is arguably the most useful idea in the whole debate for a product to build on.
- **Thesis 15 [B]:** He concedes there are contexts where estimates have little
  value — short-cycle, highly volatile, "always do the next most useful thing"
  contexts — but argues they grow out of it.

**[B]** McConnell's weakest move is Thesis 2 ("the root cause of poor estimation
is usually lack of estimation skills"), which is asserted from consulting
experience, and sits uncomfortably beside Jørgensen's finding that industry
estimation accuracy has not improved since the 1980s. If skill were the binding
constraint and skill is teachable, you'd expect improvement.

**The best empirical adjudication** is Little & Cottmeyer 2016 (above), and its
conclusion is a plague-on-both-houses:

> "Neither an Estimator nor a #NoEstimation bigot be, for estimation oft implies a
> false sense of both accuracy and certainty, while NO estimates may make
> suboptimal decisions."

**[A]** Their data supports the #NoEstimates *forecasting* claim (story points buy
you ~nothing over story counts) and undermines the #NoEstimates *implicit* claim
that dropping estimates gets you better decisions (throughput forecasts are just
as uncertain: P90/P10 ≈ 3.5).

---

## 4. Reference-class forecasting and the outside view

**[A] Origin.** Kahneman & Tversky, *Intuitive Prediction: Biases and Corrective
Procedures*, Decision Research Technical Report PTR-1042-77-6, June 1977
([full text, DTIC ADA047747](https://apps.dtic.mil/sti/tr/pdf/ADA047747.pdf);
reprinted in *Judgment Under Uncertainty*, 1982,
[DOI](https://doi.org/10.1017/CBO9780511809477.031)). Their words, directly from
the report:

> "Although this 'planning fallacy' is sometimes attributable to motivational
> factors such as wishful thinking, **it frequently occurs even when
> underestimation of duration or cost is actually penalized**."

> "The planning fallacy is a consequence of the tendency to neglect distributional
> data, and to adopt what may be termed an 'internal approach' to prediction,
> where one focuses on the constituents of the specific problem rather than on the
> distribution of outcomes in similar cases."

Their combinatorial explanation is worth stealing for product copy: a building
finishes on time only if there are no delivery delays *and* no strikes *and* no
unusual weather; each is individually unlikely, but the probability that *at least
one* occurs is substantial. The internal view systematically misses this.

The report's corrective procedure is a five-step recipe: (1) select a reference
class, (2) assess the distribution of outcomes for that class, (3) make your
intuitive estimate, (4) assess predictability, (5) regress the intuitive estimate
toward the class distribution in proportion to how unpredictable the domain is.

**[A] Flyvbjerg operationalised it.** *From Nobel Prize to Project Management:
Getting Risks Right*, Project Management Journal 2006
([DOI](https://doi.org/10.1177/875697280603700302)); *Curbing Optimism Bias and
Strategic Misrepresentation in Planning: Reference Class Forecasting in Practice*,
European Planning Studies 2008
([DOI](https://doi.org/10.1080/09654310701747936)); *Quality control and due
diligence in project management: Getting decisions right by taking the outside
view* ([arXiv:1302.2544](https://doi.org/10.48550/arXiv.1302.2544)).

His central addition to Kahneman is that there are **two** causes of forecast
inaccuracy, not one:

> "two types of explanation best account for forecasting inaccuracy, **optimism
> bias and strategic misrepresentation**. The outside view was originally
> developed to mitigate optimism bias, but it may help mitigate any type of bias,
> including strategic bias, because the outside view bypasses such bias by cutting
> directly to empirical outcomes."

Strategic misrepresentation — deliberately lowballing to get a project approved —
is a *political* problem, not a cognitive one, and no amount of better estimation
technique fixes it. **[A]** Jørgensen's independent finding that underestimation
appears in price-competitive bidding but not in in-house development (see §7) is
strong corroboration from a completely different research tradition.

**[B] Does reference-class forecasting actually work?** The UK mandated it for
major projects in 2003. A before-and-after / with-and-without study of 107 major
projects
([EJTIR](https://journals.open.tudelft.nl/ejtir/article/view/5504)) reports
average cost overrun falling from 38% to 5% after introduction. This is a
non-randomised policy evaluation with obvious confounds, and Flyvbjerg is an
interested party in the broader literature — treat the effect size as indicative,
not established.

**[A] Nothing in this literature supports "don't predict duration."** Kahneman,
Tversky and Flyvbjerg all think duration/cost prediction is both possible and
worth doing — they just think you should do it from base rates rather than from
imagination. If the product cites the outside view, it is citing people who want
*better* duration forecasts, not people who want to abandon them.

---

## 5. Planning fallacy, anchoring, and biases specific to *group* estimation

### The planning fallacy in individuals

**[A]** Buehler, Griffin & Ross, *Exploring the "Planning Fallacy"*, Journal of
Personality and Social Psychology 67(3), 1994
([PDF](https://web.mit.edu/curhan/www/docs/Articles/biases/67_J_Personality_and_Social_Psychology_366,_1994.pdf))
— the canonical empirical demonstration. People underestimate their own completion
times while being reasonably accurate about others'; they focus on plan-specific
(singular) information and neglect their own track record (distributional
information).

**[A]** Halkjelsvik & Jørgensen, *From Origami to Software Development: A Review
of Studies on Judgment-Based Predictions of Performance Time*, Psychological
Bulletin 138(2), 2012 ([DOI](https://doi.org/10.1037/a0025996)) — the definitive
review connecting the psychology literature to software. It is the source for
Jørgensen's "average overrun ≈ 30%" figure.

### Anchoring is severe and does not respond to warnings

**[A]** Aranda & Easterbrook, *Anchoring and Adjustment in Software Estimation*,
ESEC/FSE 2005
([PDF](http://www.cs.toronto.edu/~sme/papers/2005/ESEC-FSE-05-Aranda.pdf),
[DOI](https://doi.org/10.1145/1081706.1081761)). Estimators given a high anchor
(20 months) produced estimates **more than twice** those given a low anchor
(2 months), for the same project description. Their words:

> "The effects were so large that even the worst case scenario produced by
> estimators in the low anchor condition is significantly more optimistic than the
> best-case scenario from the high anchor condition […] estimators do not
> compensate the effect of anchoring and adjustment when given the opportunity to
> widen their estimates with confidence ranges."

Crucially: *"the effect is maintained across experienced estimators and users of
expert-based techniques (who presented the strongest effects of this bias)."*
Experience does not protect you. (One honest caveat from the authors: the low
anchor was not statistically distinguishable from no anchor, possibly because
estimators are optimistic by default.)

**[A]** Jørgensen, *What We Do and Don't Know about Software Development Effort
Estimation*, IEEE Software 31(2), 2014
([author PDF](https://web-backend.simula.no/sites/default/files/publications/Simula.simula.2440.pdf),
[DOI](https://doi.org/10.1109/MS.2014.49)):

> "Perhaps the strongest misleading happens when those responsible for the effort
> estimates, before or during the estimation work, are made aware of the budget,
> client expectations, the time available, or other values that can act as
> so-called estimation anchors. Without noticing it, those people will tend to
> produce effort estimates that are too close to the anchors. […] **In spite of
> much research on how to recover from being misled and how to neutralize
> estimation biases, no reliable methods have so far been found.**"

Even loaded *words* anchor: Jørgensen & Grimstad found that calling something a
"minor change" rather than "new functionality" lowers estimates, "even with highly
experienced developers" (reported in Jørgensen 2013, citing *Avoiding irrelevant
and misleading information when estimating development effort*, IEEE Software
25(3), 2008).

**Product implication [A]:** hiding estimates until simultaneous reveal is the
*one* debiasing intervention in this whole literature with a clear mechanism and
no known counter-evidence. It is planning poker's genuine contribution. But it
only protects **round one**. Everything after the reveal — the discussion, the
re-vote, the facilitator's "shall we call it a 5?" — is anchored. Haugen lists
"the 'anchor-effect' can have an impact" as a *hazard of planning poker* in his own
slide deck.

### **[C] Folklore: "planning poker eliminates anchoring."**

It removes the first-speaker anchor from the first vote. It does not eliminate
anchoring, and the technique's own empirical investigators list anchoring as a
residual hazard.

### Groups: the psychology literature and the software literature disagree

This is the most important unresolved tension in the whole document.

**[A] General psychology says group discussion makes time predictions WORSE.**
Buehler, Messervey & Griffin, *Collaborative planning and prediction: Does group
discussion affect optimistic biases in time estimation?*, Organizational Behavior
and Human Decision Processes 97(1), 2005
([DOI](https://doi.org/10.1016/j.obhdp.2005.02.004)). Three studies, lab tasks and
real multi-week projects. From the abstract:

> "First, there was an optimistic bias for both individual and group predictions.
> Second, **predictions generated through group discussion were more optimistic
> than those generated individually**. Third, this 'group accentuation' effect was
> mediated by the informational focus at the time of prediction. Group discussion
> heightened participants' tendency to focus primarily on factors promoting
> successful task completion, and this selective focus on 'planning for success'
> enhanced their optimistic outlook."

Their recommendation is the exact opposite of planning poker:
*"Forecasters may well be advised to collect and aggregate individual forecasts,
instead of engaging in group discussion."*

**[B] Software-specific studies find the opposite direction.**
Moløkken-Østvold & Jørgensen, *Group Processes in Software Effort Estimation*,
Empirical Software Engineering 9(4), 2004
([DOI](https://doi.org/10.1023/B:EMSE.0000039882.39206.5a);
[earlier PPIG version, PDF](https://ppig.org/files/2003-PPIG-15th-molokken.pdf)).
20 software professionals estimated individually, then formed 5 groups of 4:

> "We found that the groups submitted less optimistic estimates than the
> individuals. Interestingly, the group discussion-based estimates were closer to
> the effort expended on the actual project than the average of the individual
> expert estimates were […] **The groups' ability to identify a greater number of
> the activities required by the project is among the possible explanations for
> this reduction of bias.**"

n = 20 professionals, 5 groups, one project. This is the single most-cited
empirical support for the "estimation surfaces things" claim, and it is a small
study.

**[B] Jørgensen's own review is honest about the strength of this.** *A Review of
Studies on Expert Estimation of Software Development Effort*, JSS 70(1–2), 2004
([PDF](https://web-backend.simula.no/sites/default/files/publications/SE.4.Joergensen.2004.c.pdf)),
§5.3:

> "a group discussion-based combination of individual software development effort
> estimates was more accurate than the average of the individual estimates,
> because the group discussion led to new knowledge […] This increase in knowledge
> through discussions is an important advantage of group-based estimation
> processes compared with 'mechanical' combinations, such as averaging. **However,
> the evidence in favour of group-based combinations is not strong.** For example,
> group discussion may lead to more biased estimates (either more risky or more
> conservative) depending on the group processes and the individual goals."

And his summary: *"it seems that the most important part of the estimation
principle is to combine estimates from different sources […] not exactly how this
combination is conducted."*

**[B]** Jørgensen's 2014 position is more confident but rests on absence of
evidence: *"The negative effect of group-based judgments, such as 'groupthink' and
the willingness to take higher risks in groups, isn't documented to be present in
software effort estimation."* Given Buehler et al. 2005 exists and found group
accentuation on *exactly* the dependent variable of interest (task completion
time), "not documented in software specifically" is a weaker claim than it sounds.

---

## 6. The Cone of Uncertainty

### Origin

**[A]** Barry Boehm, *Software Engineering Economics* (Prentice Hall, 1981),
introduced the funnel-shaped curve of estimate accuracy by project phase. Boehm's
figure is reproduced as Figure 4 of Little 2006: at Feasibility the uncertainty
band is a factor of **16** (0.25× to 4×); at Concept of Operation it has narrowed
to a factor of 4; by the end of Requirements Specification, to 2.25.

**[A]** Steve McConnell coined the name "Cone of Uncertainty" in *Rapid
Development* (1996) and refined it in *Software Estimation: Demystifying the Black
Art* (2006).

### What McConnell himself says — which is not what people quote

**[A]** Construx's own page,
[The Cone of Uncertainty](https://www.construx.com/books/the-cone-of-uncertainty/),
in McConnell's voice, contains two caveats that are almost universally dropped:

> "An important — and difficult — concept is that the Cone of Uncertainty
> represents the **best case accuracy** it's possible to have in software estimates
> at different points in a project. […] It isn't possible to be more accurate;
> it's only possible to be more lucky."

> "**The Cone narrows only as you make decisions that eliminate variability.** […]
> if the project is not well controlled, or if the estimators aren't very skilled,
> estimates can fail to improve as shown by the Cone. […] the uncertainty isn't a
> Cone, but rather a **Cloud** that persists to the end of the project."

He also draws the commitment conclusion explicitly: *"Software organizations
inadvertently sabotage their own projects by making commitments too early in the
Cone of Uncertainty. […] Meaningful commitments are not possible in the early, wide
part of the Cone."*

### **[C] Folklore: "uncertainty narrows automatically as the project progresses."**

Contradicted by the cone's own populariser, and by data. Do not put a smooth
narrowing cone in the product UI without the caveat.

### The substantive criticism

**[A]** Todd Little, *Schedule Estimation and Uncertainty Surrounding the Cone of
Uncertainty*, IEEE Software 23(3), May–June 2006
([author PDF](https://toddlittleweb.com/Papers/Little%20Cone%20of%20Uncertainty.pdf),
[DOI](https://doi.org/10.1109/MS.2006.82)). 106 commercial software projects at
Landmark Graphics, tracked weekly 1999–2002, average project 329 days, average PM
with ~20 years' experience. Findings:

- Actual/estimate is **lognormally distributed**; Landmark median 1.8, mean 2.0 —
  matching DeMarco's independent 1982 data. ("This seems to validate the old adage
  'take the initial estimate and double it'.")
- **The apparent cone is partly a definitional artifact.** Plotting *total*
  actual/estimated duration against relative time reproduces a cone — but *"By
  definition, figure 5 will converge to 1.0 at project completion."*
- **Remaining uncertainty does not shrink.** Plotting *remaining* actual/remaining
  estimated: *"these cumulative-distribution-function curves are nearly identical
  for each phase, showing no decrease in the relative-uncertainty bands. […] the
  range of uncertainty at all project stages is approximately a factor of 3 to 4
  between p10 and p90."*
- He pre-empts the "your estimators were bad" objection: Landmark's median
  Estimation Quality Factor was 4.8 vs DeMarco's industry median of 3.8 — i.e.
  *better* than average.
- He observes an **inverted** cone late in projects ("the pipe of uncertainty"),
  which he attributes to PMs holding a deadline "in hopes that a miracle will
  occur".

**[A] Independent corroboration and adjudication.** Eveleens & Verhoef, *Quantifying
IT forecast quality*, Science of Computer Programming 74(11–12), 2009
([PDF](https://www.cs.vu.nl/~x/cone/cone.pdf)) — 1,824 projects, €1,059M+, 12,287
forecasts across four organisations. They analysed the 2006 IEEE Software exchange
between Little, McConnell, Kruchten and Gryphon and concluded:

> "Little describes that consecutive f/a ratios by definition converge to 1, but
> this does not mean the uncertainty of the ex-ante part decreases. […] **We
> corroborate with a simulation that Little is correct. The ex-ante part does not
> need to improve in order to obtain a conical shape.**"

They also credit Kruchten with being right that Boehm's cone was about *total*
forecasts, not about the accuracy of the remaining work — so the disagreement is
partly definitional, and both Little and Boehm can be right about different things.

**[A]** Eveleens & Verhoef also demolish the CHAOS-report numbers everyone quotes:

> "the famous project success figures reported by Standish Group are highly
> susceptible to the politics involved with the organizations they analyzed.
> **Therefore, these figures are meaningless without further information on the
> bias of the forecasts.**"

**[A]** Little & Cottmeyer's 2016 agile data independently reproduces the finding
in a Scrum context: instantaneous velocity P90/P10 ranged 4.06–7.07 across the
project and *"does not reduce over time, in fact it may actually get worse."*

### **[C] Folklore: "80% of software projects fail / are late (Standish CHAOS)."**

Attacked from two directions. Eveleens & Verhoef: bias in the underlying forecasts
makes the figure uninterpretable. And Jørgensen & Moløkken-Østvold, *How large are
software cost overruns? A review of the 1994 CHAOS report*, Information and
Software Technology 48(4), 2006, pp. 297–301
([author PDF](https://web-backend.simula.no/sites/default/files/publications/Jorgensen.2006.4.pdf),
[DOI](https://doi.org/10.1016/j.infsof.2005.07.002)), on the famous 189% average
cost overrun:

> "the figure reported by the Standish Group is much higher than those reported in
> similar estimation surveys and […] there may be severe problems with the survey
> design and methods of analysis, e.g. the population sampling method may be
> strongly biased towards 'failure projects'. We conclude that the figure of 189%
> for cost overruns is probably much too high to represent typical software
> projects in the 1990s and that a continued use of that figure as a reference
> point for estimation accuracy may lead to poor decision making."

Jørgensen's summary of the same work in his 2014 IEEE Software piece: the apparent
improvement in CHAOS numbers over the years "is probably just a result of an
improvement in its own analysis methods from a selection overrepresented by problem
projects to a more representative selection." The defensible number is Jørgensen's:
**average overrun around 30%**.

---

## 7. Jørgensen: what actually correlates with better outcomes

Magne Jørgensen (Simula Research Laboratory / University of Oslo) has the largest
and most methodologically careful body of empirical work on this topic. His
*What We Do and Don't Know about Software Development Effort Estimation*, IEEE
Software 31(2), 2014
([author PDF](https://web-backend.simula.no/sites/default/files/publications/Simula.simula.2440.pdf))
is the best single summary and I quote it heavily below because his framing is
already epistemically careful.

### The baseline

**[A]** *"OVERWHELMING EVIDENCE DOCUMENTS a tendency toward cost and effort
overruns in software projects. On average, this overrun seems to be around 30
percent. Furthermore, comparing the estimation accuracy of the 1980s with that
reported in more recent surveys suggests that **the estimation accuracy hasn't
changed much since then**."*

**[A]** *"In spite of an extensive research on formal estimation models, the
dominating estimation method is still expert estimation."* And from his 2004
review: *"there is no substantial evidence in favour of use of estimation models"* —
of 15 head-to-head studies, 5 favoured experts, 5 found no difference, 5 favoured
models, with the result largely determined by whether the model was calibrated to
the organisation.

### The seven things he says we know

Quoting his section headings, with the load-bearing detail:

1. **[A] There is no "best" estimation model or method.** Core relationships differ
   by context; statistically advanced models overfit. Build your own simple model
   locally.
2. **[A] Clients' focus on low price is a major reason for effort overruns.**
   Underestimation shows up in price-competitive bidding, and *not* in in-house
   development — "in fact, you might even see the opposite." This is the winner's
   curse, and it is Flyvbjerg's strategic misrepresentation arriving from a
   different direction. **This is probably the most under-appreciated finding in
   the whole field: a large share of "estimation error" is an incentive problem,
   not a cognition problem.**
3. **[A] Minimum–maximum effort intervals are systematically too narrow.** 90%
   confidence intervals do not contain 90% of outcomes. His fix: derive intervals
   from your *historical estimation error*, not from expert judgment. He
   specifically criticises PERT three-point estimation for assuming people can set
   min/max.
4. **[A] It's easy to mislead estimation work and hard to recover.** (Quoted in §5.)
   *"no reliable methods have so far been found"* for debiasing after the fact. The
   only working intervention is to not expose estimators to the anchor.
5. **[A] Relevant historical data and checklists improve estimation accuracy.**
   Explicitly including reference-class estimation, citing Flyvbjerg.
6. **[B] Combining independent estimates improves accuracy** — with a specific
   endorsement of planning poker, quoted in full in §8.
7. **[A] Estimates can be harmful.** *"Too-low estimates can lead to lower quality,
   possible rework in later phases, and higher risks of project failure; too-high
   estimates can reduce productivity in accordance with Parkinson's law […] This is
   why it's important to consider whether an effort estimate is really needed."*

### The three things he says we don't know

**[A]** How to estimate mega-projects; how to measure software size and complexity
usefully ("none of the proposed measures are very good"); how to measure and
predict productivity (*"we don't even know whether there's an economy of scale or a
diseconomy of scale"*).

### His actual recommendations list

**[A]** Verbatim from the 2014 article's conclusion:

> - Develop and use simple estimation models tailored to local contexts in
>   combination with expert estimation.
> - Use historical estimation error to set minimum–maximum effort intervals.
> - Avoid exposure to misleading and irrelevant estimation information.
> - Use checklists tailored to own organization.
> - **Use structured, group-based estimation processes where independence of
>   estimates are assured.**
> - Avoid early estimates based on highly incomplete information.

**[A]** From his 2004 review, the twelve best-practice guidelines are also worth
having; the ones a poker tool can actually implement are #3 *ask the estimators to
justify and criticize their estimates*, #8 *use estimation checklists*, #9 *combine
estimates from different experts and estimation strategies*, #10 *assess the
uncertainty of the estimate*, and #11 *provide feedback on estimation accuracy*.

**[B] But note his own honesty about #3.** In his experiment, 13 professionals were
asked to list reasons their estimate could be wrong (average 4.3 reasons) and then
revise. Nine increased their estimate, four *decreased* it, and the average
increase was only 10%. His conclusion:

> "although potentially helpful to improve estimation realism, we should not expect
> that justification and criticism improve the realism of estimates very much. If
> the initial estimate is hugely over-optimistic, a justification and critique may
> only improve the realism to some extent. […] Estimators are typically not very
> skilled in searching for weakening information when evaluating their own
> estimates."

---

## 8. The core claim: does estimation surface disagreement and ambiguity?

This is the product's thesis, so it gets its own reckoning. Here is everything I
found on both sides.

### Evidence FOR

**[A] Mike Cohn now says exactly this, in his own voice.** From
[Agile Mentors podcast #174](https://www.mountaingoatsoftware.com/agile/podcast/174-why-estimating-still-matters-with-mike-cohn):

> "use the estimates, the estimating sessions as an opportunity to discuss the work
> because **that's the real benefit is the improved and shared understanding that
> comes out of those discussions**."

And a story that is almost a product spec:

> "we had a Google sheet up, we put all the estimates in the Google sheet for the
> estimates for the sprint backlog. And at the end of the meeting, I deleted all
> the numbers. I just deleted that column and the team members are kind of pissed
> because I'd made them estimate the numbers. And they said, why did you have us do
> that? And I said, **I don't care about the numbers. I just cared if we put the
> right amount of work in the sprint.** […] I didn't want the numbers to remain
> because then people were going to feel like, no, I said four hours to code that
> thing and it's going to take me five. I'm going to feel bad or I better rush and
> be sloppy."

He also endorses "estimate only if something's gonna make a decision" and
recommends teams ask "how will this number be used?" before agreeing to estimate.
Note the date: this is Cohn *now*, not Cohn in 2005.

**[B] Jørgensen 2014 states the mechanism explicitly** — this is the strongest
peer-reviewed sentence available for the product's thesis:

> "A group-based, structured estimation process adds value to a mechanical
> combination of estimates **because sharing the knowledge increases the total
> amount of knowledge, such as the total amount of activities to be completed on a
> project**. The negative effect of group-based judgments, such as 'groupthink' and
> the willingness to take higher risks in groups, isn't documented to be present in
> software effort estimation."

And, naming planning poker: *"A Delphi-like estimation process, such as 'Planning
Poker,' where software developers show their independently derived estimates (their
'poker' cards) at the same time, seems to be particularly useful in software effort
estimation contexts."*

**[B] The underlying study.** Moløkken-Østvold & Jørgensen 2004 (§5): groups beat
mechanical averaging, and the proposed explanation is that groups *identified more
activities*. n=20, 5 groups, one project.

**[B] Planning poker discussion changes what gets built, not just what gets said.**
Moløkken-Østvold, Haugen & Benestad, *Using planning poker for combining expert
estimates in software projects*, Journal of Systems and Software 81(12), 2008
([DOI](https://doi.org/10.1016/j.jss.2008.05.016)) — I only had the abstract.
Planning-poker consensus estimates were less optimistic and more accurate than the
statistical mean of the same individuals' estimates; and *"A code analysis revealed
that for tasks estimated with planning poker, more effort was expended due to the
complexity of the changes to be made, possibly caused by the information provided
in group discussions."* That last clause is the closest thing in the literature to
evidence that the conversation changes the work itself.

**[B] Haugen's own list of why it works** (from his
[Simula slide deck](https://web-backend.simula.no/sites/default/files/publications/Haugen.2006.1.pdf)):
"Simultaneous display of estimates prevents bias / More questions asked and more
information shared / Broader range of developers provide estimates / Team feels
more ownership." And his summary recommendation: *"Use group discussions also to
increase motivation, increase ownership, **sort out ambiguities and define scope and
target quality for each task**."* Note this is a practitioner slide deck, not a
peer-reviewed finding.

**[A] Grenning's original paper** ("Common ground and differences become evident.
The team can focus its energy on the differences") — but framed as time-saving, not
as the point of the exercise.

**[A] Jørgensen 2004 guideline #3** (justify and criticize) has supporting evidence
from the general judgment literature: it improves accuracy particularly in
high-uncertainty situations, leads to a more analytical process, and improves
compensation for missing information. Effect size in his own software experiment
was small (~10%).

### Evidence AGAINST

**[A] Planning poker was WORSE on unfamiliar tasks.** Haugen, *An Empirical Study of
Using Planning Poker for User Story Estimation*, AGILE 2006
([DOI](https://doi.org/10.1109/AGILE.2006.16)); 101 user story estimates from one
XP team across four releases, alternating unstructured group estimation and
planning poker. Abstract: *"planning poker improved the team's estimation
performance in most cases, but that **it increased estimation error in the extreme
cases**."* His slide deck breaks it out:

| Task type | Method | n | Median MRE |
| --- | --- | --- | --- |
| Small, **familiar** | Unstructured group | 30 | 0.42 |
| Small, **familiar** | Planning poker | 21 | **0.25** |
| Large, **familiar** | Unstructured group | 14 | 0.25 |
| Large, **familiar** | Planning poker | 16 | **0.00** |
| Small, **unfamiliar** | Unstructured group | 4 | **0.50** |
| Small, **unfamiliar** | Planning poker | 7 | 0.80 |
| Large, **unfamiliar** | Unstructured group | 3 | **0.40** |
| Large, **unfamiliar** | Planning poker | 6 | 0.58 |

Two slides in his own deck: *"Planning poker better for all familiar tasks"* and
*"Planning poker worse for unfamiliar tasks"*. Small n on the unfamiliar rows
(3–7 tasks), so treat as suggestive rather than settled — but it points the wrong
way for a product whose pitch is "estimation is most valuable where the work is
ambiguous."

**[A] Group discussion accentuates optimism in the general literature.** Buehler,
Messervey & Griffin 2005 (§5). Three studies, consistent effect, identified
mediator ("planning for success"), and an explicit recommendation to aggregate
individual forecasts *instead of* discussing.

**[B] Planning poker is not clearly better than individuals estimating alone.**
Moløkken-Østvold & Haugen's control group of individual experts *"achieved
estimation accuracy similar to that achieved by estimators who estimated tasks
using planning poker"*, and both groups were unbiased at the median. The
demonstrated advantage of planning poker in that study is over *mechanical
averaging of the same people*, not over individual estimation as practised.

**[A] Jørgensen's review is explicit that the group-process evidence is weak:**
*"the evidence in favour of group-based combinations is not strong."*

**[A] Holub's objection** (§3): if the value is thinking about the problem, do the
thinking; the estimate is an excuse, and it aims the thinking at implementation
tasks rather than at whether the work is needed. There is no empirical rebuttal to
this in the literature I found.

**[A] Grenning's own retirement of the technique** (§1) plus his claim that affinity
grouping gets comparable results in roughly a tenth of the time. If the value is
the conversation, a faster technique that also produces conversation is strictly
better, and he says he has one.

**[A] The numbers themselves are near-worthless for forecasting.** Little &
Cottmeyer 2016 and Tawosi et al. 2022 (§2). If the product tells teams the number
doesn't matter, it is on solid ground; if any part of the product implies the
number supports forecasting, it is not.

### The verdict

**[B], leaning supportive, with an important gap.** The specific mechanism —
*group discussion surfaces activities and considerations individuals miss* — is
supported by Moløkken-Østvold & Jørgensen 2004, endorsed by Jørgensen in IEEE
Software, echoed in the 2008 code-analysis finding, and independently asserted by
Cohn and by Grenning's original paper. That is a real, coherent evidence base.

But it is thin (a handful of small studies, mostly from one research group), it is
contradicted by the broader psychology literature on group time prediction, and the
one direct study of planning poker on unfamiliar work found it *hurt* accuracy.

**The gap nobody has filled:** I found **no study** testing whether estimate
*dispersion* predicts anything — not requirement churn, not rework, not defect
density, not later scope change. The product's implicit hypothesis ("a wide spread
of cards means this story is ambiguous and needs more definition") is plausible,
intuitive, and **empirically untested**. That is simultaneously the biggest honesty
problem and the biggest opportunity: a multiplayer tool is exactly the instrument
that could generate that data.

---

## 9. Summary table

| Claim | Status |
| --- | --- |
| Planning poker was invented to speed up estimation meetings and get quiet people participating | **[A]** Grenning's own paper |
| Grenning stopped using and promoting planning poker in 2003 and now recommends affinity grouping | **[A]** Grenning's own words |
| Story points were originally ideal days renamed; both Jeffries and Cohn define them as effort ≈ time | **[A]** Both originators, in their own writing |
| "Story points measure complexity, not time" | **[C]** Contradicted by Jeffries *and* Cohn |
| The original deck was Fibonacci | **[C]** It was 1,2,3,5,7,10,∞ |
| Bucketing scheme (Fibonacci vs powers of 2) materially affects forecast quality | **[C]** Little & Cottmeyer: negligible; large buckets slightly worse |
| Story points add little forecasting value over counting stories | **[A]** Little & Cottmeyer, 55 projects + simulation |
| Story points correlate weakly with actual development time | **[A]** Tawosi et al., 37,440 issues, strong correlation in only 7% of projects |
| Simultaneous reveal reduces first-round anchoring | **[A]** Mechanism is sound; anchoring effects are large and experience-proof (Aranda & Easterbrook) |
| Planning poker "eliminates anchoring" | **[C]** Only round one; Haugen lists anchoring as a residual hazard |
| Combining independent estimates from diverse sources improves accuracy | **[A]** Jørgensen 2014 |
| Group *discussion* beats mechanical averaging because it surfaces missed activities | **[B]** One small study + Jørgensen's endorsement; his own review calls the evidence "not strong" |
| Group discussion makes time predictions *more* optimistic | **[A]** in general psychology (Buehler et al. 2005); **[B]** whether it transfers to software |
| Planning poker is worse than unstructured discussion on unfamiliar tasks | **[B]** One study, small n on the relevant cells, but it is the only direct evidence |
| Uncertainty narrows automatically as a project progresses | **[C]** Contradicted by McConnell himself, Little, and Eveleens & Verhoef |
| Remaining-work uncertainty stays roughly constant (factor of 3–4, p10→p90) | **[A]** Little 2006, corroborated by Eveleens & Verhoef 2009 and Little & Cottmeyer 2016 |
| ~80% of projects fail/are late (CHAOS) | **[C]** Figures called "meaningless without further information on the bias"; defensible number is ~30% average overrun |
| Estimation accuracy has not improved since the 1980s | **[A]** Jørgensen 2014 |
| Min/max ("90% confidence") intervals are systematically too narrow | **[A]** Jørgensen 2014 |
| A major cause of overruns is competitive-bidding incentives, not cognition | **[A]** Jørgensen (winner's curse) + Flyvbjerg (strategic misrepresentation), two independent traditions |
| Reference-class forecasting / the outside view improves forecasts | **[A]** theory (Kahneman & Tversky 1977); **[B]** field effect size (UK policy evaluation, non-randomised) |
| Estimates can be actively harmful (quality erosion; Parkinson's law) | **[A]** Jørgensen 2014 |
| No reliable method exists to debias an estimator after they've been anchored | **[A]** Jørgensen 2014 |
| Estimate *dispersion* signals ambiguity in the work | **Untested.** No study found either way. |

---

## 10. Implications for the product

**1. Change the historical claim, keep the design choice.** "Estimation was always
about clarity, not duration" is false and a knowledgeable user will catch it.
Grenning wanted a ballpark effort number fast; Jeffries and Cohn both mean
duration. The honest and stronger framing is forward-looking: *"The number is a
weak forecast — here's the evidence — so we've built the tool around the part that
does hold up: the conversation."* You can then cite Cohn deleting the spreadsheet
column, Jeffries' four regrets, Little & Cottmeyer, and Tawosi. That's a better
story than a false origin myth, and it's unassailable.

**2. Your best evidence is one specific mechanism. Use that, not vague "alignment"
language.** The defensible claim is: *group discussion surfaces activities and
risks that individuals miss, and that is why groups beat averaging.*
(Moløkken-Østvold & Jørgensen 2004; Jørgensen, IEEE Software 2014.) Anything
broader — "estimation creates shared understanding," "poker builds alignment" — is
beyond what the evidence carries. Design the product to *produce* the missed
activities: a place to capture "things we realised while disagreeing" is more
defensible than the vote itself.

**3. Simultaneous reveal is your one bulletproof feature — and it only covers round
one.** Anchoring is huge (2× swings), unaffected by experience, and has no known
cure once it lands. So: never show the ticket's existing estimate, never show a
deadline, never show who voted what before reveal, and be careful with words in
the story title ("minor change" measurably lowers estimates). After the reveal you
are in anchored territory; consider a second *blind* round rather than a talk-to-
consensus round.

**4. The uncomfortable finding you must design around: planning poker was worse on
unfamiliar work.** If you're going to claim estimation is most valuable where
ambiguity is highest, you're pointing the tool at the one condition where the
single direct study says it degrades accuracy. Two honest ways out: (a) explicitly
say you're not optimising for accuracy, you're optimising for surfacing ambiguity —
and treat a wide spread as a *stop signal* ("this story isn't ready; go split or
spike it") rather than as an input to a consensus number; or (b) build the
split/spike escape hatch as a first-class outcome, which is what Grenning's own
"play the infinity card and make the customer split the story" does.

**5. Push teams toward what actually correlates with better outcomes.** From
Jørgensen, in rough order of evidential strength: use historical estimation error
(not judgment) to set ranges; use org-specific checklists; combine genuinely
independent estimates; avoid exposure to anchors; avoid early estimates on
incomplete information; and ask whether the estimate is needed at all. A tool that
records your team's own past estimate-vs-actual distribution and shows you *your*
p10/p90 multiplier is doing reference-class forecasting, is well supported, and as
far as I can tell nobody ships it.

**6. Ship the estimate-vs-target-vs-commitment distinction.** McConnell's Thesis 10
is the most actionable idea in the entire #NoEstimates debate and it is cheap to
build: make the tool ask *"how will this number be used?"* and label the session
accordingly. Cohn independently recommends the same question.

**7. Do not build forecasting features that imply points predict dates.** Two
strong studies say they barely do. If you ship a burnup, show the p10–p90 band, and
show it not narrowing — that is what the data looks like.

**8. Consider owning the untested question.** Nobody has published on whether
estimate dispersion predicts churn, rework, or scope change. A multiplayer tool
with consented, anonymised telemetry could answer it. If it holds, you own the
evidence base for your own thesis; if it doesn't, you'd want to know before you've
built a company on it.

**9. Be ready for the two hardest objections.** Holub: *"nothing's stopping you from
thinking about the problem without using estimating as an excuse."* Grenning: *"We
stopped using and promoting Planning Poker in 2003."* You will meet both. Publish
your answers to them somewhere users can find, rather than hoping they don't come
up.

---

## Source index

**Planning poker origins**
- Grenning, *Planning Poker or How to avoid analysis paralysis while release planning* (2002) — https://wingman-sw.com/papers/PlanningPoker-v1.1.pdf
- Grenning, LinkedIn retrospective (2023) — https://www.linkedin.com/posts/jwgrenning_continuing-al-shalloways-suggestion-to-activity-7122276092870041600-95Xq
- Grenning, *Agile 2008 – Wisdom of Crowds Keynote and Planning Poker* — http://blog.wingman-sw.com/archives/20
- OEIS A193622 (original card values) — https://oeis.org/A193622/internal
- Cohn, *Agile Mentors Podcast #174: Why Estimating Still Matters* — https://www.mountaingoatsoftware.com/agile/podcast/174-why-estimating-still-matters-with-mike-cohn

**Story points**
- Jeffries, *Story Points Revisited* — https://ronjeffries.com/articles/019-01ff/story-points/Index.html
- Jeffries, scrumalliance mailing list, "Story point estimating" — https://groups.google.com/g/scrumalliance/c/ag8W8xtKQs8/m/4cOpyt8Jgr0J
- Jeffries, *Estimation is Evil* (PragPub, Feb 2013) — https://ronjeffries.com/articles/021-01ff/estimation-is-evil/
- Cohn, *What Are Story Points and Why Do We Use Them?* — https://www.mountaingoatsoftware.com/blog/what-are-story-points
- Cohn, *It's Effort, Not Complexity* — https://www.mountaingoatsoftware.com/blog/its-effort-not-complexity
- Cohn, *Agile Estimating: How Teams Estimate with Story Points* — https://www.mountaingoatsoftware.com/agile/agile-estimation-estimating-with-story-points
- Tawosi, Moussa & Sarro, ESEM 2022 — https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf · https://doi.org/10.1145/3544902.3546238
- Tawosi, *Predictiveness and Effectiveness of Story Points in Agile Software Development*, PhD thesis, UCL 2023 — https://discovery.ucl.ac.uk/id/eprint/10175111/
- Jørgensen, *Relative Estimation of Software Development Effort*, IEEE Software 2013 — https://web-backend.simula.no/sites/default/files/publications/Simula.simula.814.pdf · https://doi.org/10.1109/MS.2012.70

**#NoEstimates and responses**
- Zuill, *The NoEstimates Hashtag* — https://zuill.us/WoodyZuill/2013/05/17/the-noestimates-hashtag/
- Zuill, *Why do we need estimates?* — https://zuill.us/WoodyZuill/2013/04/13/why-do-we-need-estimates/
- Zuill, *No Estimate Programming Series – Intro Post* — https://zuill.us/WoodyZuill/2012/12/10/no-estimate-programming-series-intro-post/
- Holub, *#NoEstimates, An Introduction* — https://holub.com/noestimates-an-introduction/
- Duarte, *Story Points Considered Harmful* — https://softwaredevelopmenttoday.com/2012/01/story-points-considered-harmful-or-why-the-future-of-estimation-is-really-in-our-past/
- Duarte, *The #NoEstimates How To* — http://softwaredevelopmenttoday.blogspot.com/2013/07/the-noestimates-how-to.html
- Jeffries, *#NoEstimates isn't crazy* — https://ronjeffries.com/articles/018-01ff/no-estimates-logic/
- Jeffries, *Continued Discussion with Steve McConnell* — https://ronjeffries.com/articles/015-jul/mcconnell-2b/
- McConnell, *17 Theses on Software Estimation* — https://stevemcconnell.com/17-theses-software-estimation/
- McConnell, *17 Theses (Expanded)* — https://www.construx.com/blog/17-theses-on-software-estimation-expanded/
- Little & Cottmeyer, *To Estimate or #NoEstimates, that is the Question*, HICSS 2016 — https://toddlittleweb.com/Papers/Estimates%20or%20NoEstimates%20HICSS%202016-06-15.pdf

**Biases, planning fallacy, outside view**
- Kahneman & Tversky, *Intuitive Prediction: Biases and Corrective Procedures* (1977) — https://apps.dtic.mil/sti/tr/pdf/ADA047747.pdf · reprint https://doi.org/10.1017/CBO9780511809477.031
- Buehler, Griffin & Ross, *Exploring the "Planning Fallacy"*, JPSP 1994 — https://web.mit.edu/curhan/www/docs/Articles/biases/67_J_Personality_and_Social_Psychology_366,_1994.pdf
- Buehler, Messervey & Griffin, *Collaborative planning and prediction*, OBHDP 2005 — https://doi.org/10.1016/j.obhdp.2005.02.004
- Halkjelsvik & Jørgensen, *From Origami to Software Development*, Psychological Bulletin 2012 — https://doi.org/10.1037/a0025996
- Aranda & Easterbrook, *Anchoring and Adjustment in Software Estimation*, ESEC/FSE 2005 — http://www.cs.toronto.edu/~sme/papers/2005/ESEC-FSE-05-Aranda.pdf · https://doi.org/10.1145/1081706.1081761
- Flyvbjerg, *From Nobel Prize to Project Management: Getting Risks Right*, PMJ 2006 — https://doi.org/10.1177/875697280603700302
- Flyvbjerg, *Curbing Optimism Bias and Strategic Misrepresentation in Planning*, European Planning Studies 2008 — https://doi.org/10.1080/09654310701747936
- Flyvbjerg, *Quality control and due diligence in project management* — https://doi.org/10.48550/arXiv.1302.2544
- RCF policy evaluation, EJTIR — https://journals.open.tudelft.nl/ejtir/article/view/5504

**Cone of Uncertainty**
- Boehm, *Software Engineering Economics* (Prentice Hall, 1981) — original figure reproduced as Fig. 4 of Little 2006
- McConnell / Construx, *The Cone of Uncertainty* — https://www.construx.com/books/the-cone-of-uncertainty/
- Little, *Schedule Estimation and Uncertainty Surrounding the Cone of Uncertainty*, IEEE Software 2006 — https://toddlittleweb.com/Papers/Little%20Cone%20of%20Uncertainty.pdf · https://doi.org/10.1109/MS.2006.82
- Eveleens & Verhoef, *Quantifying IT forecast quality*, SCP 2009 — https://www.cs.vu.nl/~x/cone/cone.pdf

**Empirical estimation research (Jørgensen and colleagues)**
- Jørgensen, *What We Do and Don't Know about Software Development Effort Estimation*, IEEE Software 2014 — https://web-backend.simula.no/sites/default/files/publications/Simula.simula.2440.pdf · https://doi.org/10.1109/MS.2014.49
- Jørgensen, *A Review of Studies on Expert Estimation of Software Development Effort*, JSS 2004 — https://web-backend.simula.no/sites/default/files/publications/SE.4.Joergensen.2004.c.pdf
- Jørgensen, *Practical Guidelines for Expert-Judgment-Based Software Effort Estimation*, IEEE Software 2005 — https://web-backend.simula.no/sites/default/files/publications/Jorgensen.2005.3.pdf
- Jørgensen & Moløkken-Østvold, *How large are software cost overruns? A review of the 1994 CHAOS report*, IST 2006 — https://web-backend.simula.no/sites/default/files/publications/Jorgensen.2006.4.pdf · https://doi.org/10.1016/j.infsof.2005.07.002
- Moløkken-Østvold & Jørgensen, *Group Processes in Software Effort Estimation*, EMSE 2004 — https://doi.org/10.1023/B:EMSE.0000039882.39206.5a · earlier version https://ppig.org/files/2003-PPIG-15th-molokken.pdf
- Haugen, *An Empirical Study of Using Planning Poker for User Story Estimation*, AGILE 2006 — https://doi.org/10.1109/AGILE.2006.16 · slides https://web-backend.simula.no/sites/default/files/publications/Haugen.2006.1.pdf
- Moløkken-Østvold & Haugen, *Combining Estimates with Planning Poker—An Empirical Study*, ASWEC 2007 — https://doi.org/10.1109/ASWEC.2007.15
- Moløkken-Østvold, Haugen & Benestad, *Using planning poker for combining expert estimates in software projects*, JSS 2008 — https://doi.org/10.1016/j.jss.2008.05.016
