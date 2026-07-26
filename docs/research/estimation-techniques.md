# Estimation techniques: what the evidence actually supports

Research note for Wheel of Tim. Investigates concrete estimation techniques against primary
sources — original papers, the practitioners' own writing, and empirical studies — and assesses
each one twice: does it work, and does it survive translation into a real-time multiplayer web
tool?

The product's stance is that estimation is about finding clarity in a piece of work, not
predicting duration. That stance turns out to be the one the empirical literature best supports,
which is convenient but also load-bearing: several techniques below are worth building *only*
under that stance, and become actively harmful under a prediction stance.

## How to read the grades

Every technique carries two grades.

**Evidence** — how much we actually know:

| Grade | Meaning |
| --- | --- |
| **A** | Two or more independent empirical studies agree, at least one on real projects |
| **B** | One credible empirical study, or strong transfer from well-replicated cognitive psychology |
| **C** | Practitioner consensus with a plausible mechanism, but no direct test |
| **D** | Contested, or contradicted by the available data |

**Fit** — how the technique survives the medium:

| Grade | Meaning |
| --- | --- |
| **Native** | A web tool does this *better* than a room can |
| **Portable** | Translates, with real build effort |
| **Lossy** | Depends on physical affordances; translation loses the point |

Where evidence is thin, the note says so rather than dressing up practitioner consensus as
research. Several popular techniques turn out to rest on nothing but their own popularity.

---

## 1. The foundation: three findings everything else sits on

Before the individual techniques, three results recur throughout the literature and explain why
most of the techniques exist at all.

### 1.1 Anchoring is large, survives expertise, and survives disclaimers

Aranda and Easterbrook's
[Anchoring and Adjustment in Software Estimation](http://www.cs.toronto.edu/~jaranda/pubs/AnchoringAdjustment.pdf)
(ESEC/FSE 2005, [doi](https://doi.org/10.1145/1081706.1081761)) gave 23 participants an identical
project brief that differed only in one quoted sentence from a client-side manager. In the control
condition the manager said he had no experience estimating. In the other two he offered a guess of
"2 months" or "20 months", explicitly labelled as a guess by a self-declared non-expert.

The results are stark. The low-anchor group's mean estimate was 6.8 months, and in the authors'
own words, "estimates on the high anchor condition were **more than twice as long** as those in the
low anchor condition". Restricting to participants with real-world estimation experience did not
remove the effect (means of 7.8 / 9.0 / 17.8 months for low / control / high). Restricting to
expert-judgement estimators produced *the strongest* effects of any subgroup (5.1 / 7.8 / 15.4
months).

The most useful detail for a product: confidence ranges did not save anyone. The paper tested the
*best-case* estimate from the low-anchor group against the *worst-case* estimate from the
high-anchor group, and even those two distributions were significantly different (means 8.7 vs 12.8
months, p < 0.05). As the authors put it, the effect is "too strong to be ignored".

**This is the single strongest empirical result in the whole area, and it is the entire
justification for simultaneous private reveal.** A number spoken aloud before the vote — by a tech
lead, by a product owner, by anyone — contaminates the room, and the contamination is not undone by
experience, by technique, or by asking people to widen their ranges.

### 1.2 Estimators are systematically overconfident about their own uncertainty

Jørgensen and colleagues at Simula have documented this repeatedly. In one study cited in
[Eliminating Over-Confidence in Software Development Effort Estimates](https://web-backend.simula.no/sites/default/files/publications/SE.5.Joergensen.2004.b.pdf)
(PROFES 2004, [doi](https://doi.org/10.1007/978-3-540-24659-6_13)), only **43%** of teams'
minimum–maximum effort intervals contained the actual effort — against a target of 90%.

Jørgensen's [seminar material](https://web-backend.simula.no/sites/default/files/publications/Simula.SE.186.pdf)
puts the calibration failure bluntly: when project managers claim "almost certain", they are about
60% certain, and in practice `"60% certain" = "75% certain" = "90% certain" = "99% certain"` — the
stated confidence carries almost no information.

### 1.3 Group discussion beats mechanical averaging — because it surfaces forgotten work

This is the finding that should shape the product most, and it is the least widely known.

Moløkken-Østvold and Jørgensen's
[Group Processes in Software Effort Estimation](https://doi.org/10.1023/B:EMSE.0000039882.39206.5a)
(Empirical Software Engineering 9(4), 2004; [preprint](https://www.ppig.org/files/2003-PPIG-15th-molokken.pdf))
took 20 software professionals, collected individual estimates, then formed five groups of four to
reach consensus by discussion. Group estimates were less optimistic than individual ones — and,
critically, **closer to actual effort than a mechanical average of the same individuals'
estimates**. The authors' explanation: the groups identified a greater number of the activities the
project actually required.

Jørgensen's
[Evidence-based guidelines for assessment of software development cost uncertainty](https://doi.org/10.1109/TSE.2005.128)
(IEEE TSE, 2005) turns this into an explicit recommendation: "combine uncertainty assessments from
different sources through group work, **not** through mechanical combination."

The mechanism matters enormously for product design. Group estimation does not help because
averaging cancels noise. It helps because **talking reveals work nobody had thought of**. That is a
clarity mechanism, not a prediction mechanism — and it means the artifact worth capturing from a
session is not the number but *what the conversation revealed*.

---

## 2. Estimation rulers / reference scales

**Evidence: B. Fit: Native.** The highest-leverage thing this product can build.

### What it is, per the sources

Mike Cohn's
[Estimating with Story Points](https://www.mountaingoatsoftware.com/agile/agile-estimation-estimating-with-story-points)
gives the canonical construction: "When estimating a new product backlog (or when multiple teams
are working on the same project), it helps to establish a few **baseline stories**." His procedure:

> Start with a 2-point story, one that everyone can agree is small but is not the smallest possible
> story. Then find a story that is about twice as big and that team members can agree to call a 5.
> [...] You want merely to find a pair of stories that span the one order of magnitude that will
> contain most estimates.

He adds a constraint worth encoding in the product: "Try to keep most estimates [...] within about
one order of magnitude, such as from 1 to 10. Studies have shown that people estimate best within
one order of magnitude."

James Grenning — who invented planning poker — independently identifies the ruler as a
*precondition* for poker working at all. In
[Agile Requirements, Estimation and Planning](https://wingman-sw.com/papers/Iteration0-Grenning-v1r0.pages.pdf)
(ESC 2012/2013):

> Planning poker is not always the right tool for the job. It goes much more smoothly when a team
> has a set of baseline story estimates so that they have a feel for the size of a story point.

That is two independent originators of the practice saying the same thing: **the ruler is not an
optional accessory to poker, it is the thing that makes poker mean anything.**

### The theoretical backing: the outside view

An estimation ruler is a small-scale version of what Flyvbjerg calls **reference class
forecasting**, in
[From Nobel Prize to Project Management: Getting Risks Right](https://arxiv.org/pdf/1302.3642)
(Project Management Journal 37(3), 2006, [doi](https://doi.org/10.1177/875697280603700302)).
Reference class forecasting "achieves accuracy by basing forecasts on actual performance in a
reference class of comparable projects and thereby bypassing both optimism bias and strategic
misrepresentation" — an *outside* view instead of an *inside* view.

**But there is a real tension here that practitioner writing glosses over.** Flyvbjerg's method
works because the reference class contains *actual outcomes*. A story-point ruler contains *prior
estimates*, and Cohn explicitly forbids updating them with outcomes (see decay, below). So an
estimation ruler gets the consistency benefit of an outside view but **not** the debiasing benefit —
it makes a team's estimates internally coherent without making them accurate. Under this product's
"clarity, not duration" stance that is exactly the right trade. Under a prediction stance it would
be a serious flaw, and it should not be marketed as accuracy.

### The failure it prevents is empirically real

Tawosi, Moussa and Sarro's
[On the Relationship Between Story Points and Development Effort in Agile Open-Source Software](https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf)
(ESEM 2022, [doi](https://doi.org/10.1145/3544902.3546238)) analysed **37,440 user stories across 37
Jira projects**. Their third research question asked how consistently teams apply story points
within a single project. The answer:

> the majority of the investigated projects (25 out of 32) **lack consistent human-expert
> estimations** for SP. The consistency starts to wear when the issues are estimated to be bigger
> than five points.

So the disease a ruler is meant to cure — the same team meaning different things by "5" at
different times — is documented at scale in real projects. That's the strongest available support
for building ruler tooling, even though no study has tested whether a ruler *fixes* it. Note the
honest gap: **the problem is grade-A evidenced, the remedy is grade-C.** The B grade overall
reflects that both originators converge on it and the failure mode is measured.

### Maintenance and decay

This is the part practitioner writing handles best, and it maps directly to product behaviour.

Cohn's [To Re-estimate or not](https://www.mountaingoatsoftware.com/blog/to-re-estimate-or-not-that-is-the-question)
gives the governing principle: rulers are built from *a priori* knowledge, and back-filling them
with *a posteriori* knowledge destroys them.

> Suppose the team is estimating a new item and want to say it's equivalent to 20 story points
> because it's similar to another item that has been estimated at 20 story points. That logic makes
> sense if the original item has not been re-estimated. If the old item was given an estimate of 10
> before the fact and re-estimated to 20 after the fact then it is harder to know if the new item
> should get a 10 or a 20.

He allows exactly two exceptions, and the second is the decay case:

1. The original estimate was catastrophically wrong *and* the cause was a rare one-off. (Not if
   "every estimate is systematically off by half" — that's a scale problem, not a ruler problem.)
2. **There has been a genuine change in relative size.** His example: the team discovers that
   learning AJAX is half as hard as they thought, so every AJAX-heavy reference story is now
   mis-scaled.

Cohn also [advises against re-estimating unfinished stories](https://www.linkedin.com/pulse/should-you-re-estimate-unfinished-stories-mike-cohn)
carried between sprints — leave the original estimate alone, except when an item is going back to
the backlog for several iterations.

So decay is not gradual drift to be continuously smoothed. It is **punctuated**: a capability
changes, and a whole *category* of reference stories goes stale at once. That is a very different
product behaviour from a rolling average. The right affordance is a way to retire or re-baseline a
category of references when the team's capability shifts — plus, per Tawosi, a nudge that
references above 5 points are the least trustworthy ones on the ruler.

### Why this is Native fit

A physical ruler is a wall of index cards. It survives until someone needs the meeting room. Nobody
can consult it asynchronously, it cannot be filtered to the stories relevant to the item in hand, it
has no history, and a new joiner cannot read it.

A web tool can hold the ruler as durable, versioned, in-context state and surface the two or three
most relevant reference stories *at the moment of the vote*. This is the clearest case in this
document where the medium is straightforwardly superior to the room, and where the competitive
surface is real: most estimation-poker tools ship a deck of cards and a timer, and treat the
reference scale as the user's problem.

---

## 3. Triangulation

**Evidence: C. Fit: Native.** Cheap to build on top of the ruler, and its originator ships it.

Cohn introduced the term in *Agile Estimating and Planning* and explains it in
[How to Prevent Estimate Inflation](https://www.mountaingoatsoftware.com/blog/how-to-prevent-estimate-inflation):

> I've found the best way to prevent estimate inflation from occurring is to always compare the item
> being estimated against two (or more) previously estimated product backlog items. In my *Agile
> Estimating and Planning* book, I referred to this as triangulation, borrowing the old nautical
> term for fixing a ship's location.

The procedure, from his [seven tips](https://www.mountaingoatsoftware.com/blog/how-can-we-get-the-best-estimates-of-story-size):
if you're thinking of a 5, find a 2 or 3 and an 8, and ask whether the new item sits properly
between them. Two comparisons, one below and one above.

Cohn is explicit that two is a deliberate cost/benefit compromise, not an optimum: "Ideally we'd
love to consider each estimate in comparison to all previous estimates. But that would be way too
much work. Triangulating a story by comparing it to two others is generally sufficient."

He also names the specific pathology it defends against — inflation under velocity pressure:

> consider the team that is trying to decide between estimating a story as either three or five.
> Remembering they are under pressure to increase velocity, they decide to call it a five. [...] But,
> when the team triangulates that story against another five or an eight, they'll most likely
> realize that the story is not really a five.

**Evidence assessment — be honest here.** There is no controlled study of triangulation. Not one.
Its grade is C: a coherent mechanism from a credible source, untested. What raises it above pure
folklore is that the failure it targets (within-project inconsistency, and specifically inconsistency
concentrated at the larger values) is precisely what Tawosi et al. measured at scale. Triangulation
is a plausible remedy for a demonstrated disease. That is not the same as a demonstrated remedy.

**Fit is Native, and there is an existence proof.** Cohn's own Planning Poker tool ships an
[auto-triangulate button](https://www.mountaingoatsoftware.com/blog/automatically-triangulating-estimates-in-planning-poker):
the facilitator names a value, and the system picks the nearest previously-estimated item below and
above it (random tie-break) and displays them. In a room, triangulation requires someone to
*remember* two comparable stories under time pressure — which is exactly the recall task the tool
removes. Given a stored ruler, this is close to free to build.

---

## 4. Affinity estimation and silent grouping

**Evidence: mixed — B for silent/bucketed sizing generally, D for affinity specifically.
Fit: Lossy to Portable.**

### Origins

**Affinity estimating** is attributed to Lowell Lindstrom, who presented it at a Scrum Trainer's
Retreat in Boston; the earliest detailed write-up is Chris Sterling's
[Affinity Estimating: A How-To](https://gettingagile.com/2008/07/04/affinity-estimating-a-how-to/)
(2008). Cards go on a wall along a smallest-to-largest spectrum, get sorted, then get bucketed under
size headings. Sterling reports running it with over 300 items in 2 hours, and recommends it above
20 items — below that, "Planning Poker or a more sequential approach may be more appropriate."

**Silent grouping** has a peer-reviewed write-up: Ken Power's
[Using Silent Grouping to Size User Stories](https://doi.org/10.1007/978-3-642-20677-1_5)
(XP 2011, LNBIP vol. 77, pp. 60–72). Power's abstract states the motivation directly:

> Planning Poker is a common technique for sizing user stories, however it has challenges. It can be
> time consuming and teams can get bogged down in unnecessary discussion. This paper describes a
> technique called Silent Grouping [...] so that large sets of user stories can be sized in minutes.

It draws on seven Scrum teams at Cisco's Unified Communications Business Unit and — relevant here —
includes an example of use with **distributed** teams. It is an experience report, not a controlled
study; the reported cost savings are not measured against a control.

There is a nice historical footnote: Grenning says planning poker itself came from the same root.
In [the original-paper retrospective](https://wingman-sw.com/articles/planning-poker) he credits
Total Quality Management practice at Teradyne in the 1980s, where "one of the techniques used in
brainstorming was silent grouping. First we'd all write our ideas on post-it notes, then we'd share
them and group them. This way there was no polluting of each other's opinions when the most dominant
or senior person spoke."

### The one head-to-head study is not kind to affinity

Poženel, Fürst, Vavpotič and Hovelja,
[Agile Effort Estimation: Comparing the Accuracy and Efficiency of Planning Poker, Bucket System, and
Affinity Estimation Methods](https://arxiv.org/pdf/2401.16152)
(Int. J. Software Engineering and Knowledge Engineering, 2023,
[doi](https://doi.org/10.1142/S021819402350064X)) is the only empirical comparison of these three.
Eight teams, 29 students, four sprints, the same 23 user stories for every team, within-subjects,
with the order of methods permuted across teams and sprints to control for maturation.

**Accuracy** (Balanced Relative Error): Affinity Estimation was *statistically significantly less
accurate* than Planning Poker. Planning Poker and Bucket System were indistinguishable — both at a
BRE median of 0.71.

**Time**: Planning Poker took a median 24.5 minutes per sprint estimation; Bucket System 15 minutes;
Affinity Estimation 16 minutes. Planning Poker was significantly slower than both, with large effect
sizes (Cliff's delta 0.537 and 0.566).

Their conclusion: Bucket System wins overall — Planning Poker's accuracy at roughly 60% of its time
cost. Affinity Estimation is the one to drop.

**Caveats the authors themselves raise**: student subjects, a small backlog, small teams, and
self-reported timings. They followed Carver et al.'s checklist for empirical studies with students,
but external validity to professional teams remains an open question. One study should not settle
this. It is, however, the only direct evidence that exists, and it points away from affinity.

### Fit

Both techniques are **spatial**: their whole mechanism is many people simultaneously manipulating
many cards on a shared surface, in silence. Reproducing that needs a real-time multi-cursor canvas
with drag-and-drop — a substantial build, and a different product from a card-reveal tool.

The Bucket System is the interesting exception. Its
[mechanics as described in the paper](https://arxiv.org/pdf/2401.16152) are mostly *assignment*
rather than *spatial arrangement*: seed a reference story in a central bucket, sample two more
against it, then divide the remaining items among team members who each place theirs into a bucket
independently and silently, followed by a group "sanity check" pass where anyone can flag a
placement and trigger discussion. That decomposes cleanly into ordinary web UI — list assignment,
per-user private placement, a review pass with flagging. **Bucket System is Portable and matched
poker's accuracy at 60% of the cost. Affinity estimation is Lossy and lost on accuracy.** If only
one gets built, it should be the bucket flow.

---

## 5. Calibration training (Hubbard)

**Evidence: B in general, D for transfer to software estimation. Fit: Native mechanically.**
The most seductive item in this list and the one I'd be most careful about.

### What Hubbard claims, in his own words

Hubbard Decision Research's
[Calibrated Probability Assessments: An Introduction](http://www.hubbardresearch.com/wp-content/uploads/2019/06/Introduction-to-Calibrating-Probability-Assessments-Hubbard-Decision-Research.pdf)
is the primary statement of the method behind *How to Measure Anything*. Its two headline findings:

> 1. Almost all experts are consistently overconfident in their estimates prior to training and
> 2. Most experts are able to reach nearly ideal calibration (within statistically allowable error)
>    after training.

Roughly three hours of training suffices for most people, and the paper aggregates "the Combined
Results of 11 Studies in Probability 'Calibration' Training". The techniques are: repeated trivia
tests with immediate feedback; the **equivalent bet** (you should be indifferent between betting on
your interval and spinning a dial with a 90% win chance); habitually listing pros and cons; and an
anti-anchoring device — instead of asking for a range directly, start from absurd bounds and ask
"what is the probability the quantity is more (less) than X?", then infer the range.

The [Uncertainty Project's write-up of the exercise](https://www.theuncertaintyproject.org/tools/estimator-calibration)
gives the number people quote: untrained participants typically land about **11 of 20** true values
inside their stated 90% intervals, rather than 18 of 20.

Hubbard's own paper contains a caveat worth quoting, since enthusiasts skip it: "Feedback training
alone may take a very long period of time or may have limited effectiveness." The claimed results
come from *combinations* of techniques.

### Does it transfer to software estimation? Mostly, no — and this is the honest answer

Three separate reasons for scepticism.

**First, the general transfer literature is not encouraging.** Lichtenstein and Fischhoff's
[Training for calibration](https://www.academia.edu/26381998/Training_for_calibration)
(Organizational Behavior and Human Performance, 1980) — the study Hubbard cites as foundational —
found improvement on several tasks but explicitly *failed* on others, including uncertain
quantities. Their own summary: subjects "consistently failed to translate probabilistic training to
numerically uncertain contexts". Calibration training on trivia demonstrably improves trivia
calibration; the leap to estimating a piece of work you have never done is a different task.

**Second, the one software-specific test was a partial failure.** Jørgensen and Moløkken's
[Eliminating Over-Confidence in Software Development Effort Estimates](https://web-backend.simula.no/sites/default/files/publications/SE.5.Joergensen.2004.b.pdf)
(PROFES 2004) is the closest thing to a direct test. Nineteen realistically composed estimation teams
estimated the same software project. Ten received no guidance; nine were instructed to begin by
recalling the distribution of estimation error from similar past projects — i.e. exactly the outside
view calibration is supposed to install. The result:

> the recall of the error distribution of the Group B teams did have an impact, but **mainly on the
> assessment of the estimated minimum effort, not on the maximum effort**.

Only three of the nine trained teams gave maximum values close to the history-based maximum. The
intervention moved the floor and left the ceiling untouched — which is the wrong half, since
overconfidence about the ceiling is what wrecks plans. The authors' recommendation is a *trained
human facilitator*, not a self-service exercise.

**Third, framing beats training.** Jørgensen's
[Realism in assessment of effort estimation uncertainty: it matters how you ask](https://doi.org/10.1109/TSE.2004.1274041)
(IEEE TSE 30(4), 2004) studied 47 projects under traditional framing and 23 under an alternative
framing across two companies, and concluded that asking for a minimum–maximum interval is itself the
problem. Better: "How likely is it that the actual effort will be more than / less than X?" — or,
per his [seminar notes](https://web-backend.simula.no/sites/default/files/publications/Simula.SE.186.pdf),
"What proportion of similar projects have been overrun by more than X?"

That is a *much* cheaper intervention than a training course, and it has direct empirical support in
software specifically. If the product wants to improve how uncertainty is expressed, changing the
question is better evidenced than training the person.

### Fit and recommendation

Mechanically the fit is **Native and excellent** — a browser is the ideal delivery vehicle for
timed trivia quizzes with instant Brier-style scoring and a personal calibration curve. It would
also be fun, and it would demo beautifully.

That is precisely the trap. **The build is easy, the demo is great, and the evidence that it improves
the thing this product exists to improve is weak.** It also sits awkwardly against the product's own
stance: calibration training is a technique for producing better *confidence intervals over
quantities*, which is a prediction activity. A tool whose thesis is "estimation is about clarity, not
duration" would be arguing against itself by shipping a duration-forecasting trainer as a headline
feature.

If it ships at all, ship it as an optional side exercise, don't claim transfer to story sizing, and
prefer Jørgensen's reframing — which costs one line of copy — over a training module.

---

## 6. Handling divergence

**Evidence: A for the general shape, B for the specific protocol. Fit: Native.**
This section is treated as the most important one, per the brief, and the evidence supports that
weighting — with one significant complication.

### Divergence is the point, not the problem

Planning poker was invented to *manufacture* this moment. Grenning's
[account of the original 2002 session](https://wingman-sw.com/papers/Iteration0-Grenning-v1r0.pages.pdf):

> The customer read a story. The two senior engineers discuss the impact of the story on the system.
> Reluctantly, an estimate is tossed out on the table. They go back and forth for quite a while.
> Everyone else in the room is drifting off, definitely not engaged. [...] When the discussion finally
> ends, the estimate did not really change over all that discussion, 20 minutes wasted.

His diagnosis is not that the estimate was wrong: "The problem with that meeting was that only two
guys were engaged, and even when they agreed they chose to talk about it, and talk about it…
Everyone else nodded and slept. **It's the team's estimate and they need to be engaged.**"

So the mechanic exists to expose disagreement that a discussion-first process suppresses. Combined
with §1.3 — group discussion helps because it surfaces overlooked activities — the picture is
coherent: **a 1 against a 13 is not a failure of the estimation process, it is the process
succeeding at finding a place where two people are looking at different pieces of work.** That
framing is exactly this product's thesis, and it is well supported.

### The canonical protocol

Grenning's own description, from the same paper:

> When developers do not agree, the outliers discuss their estimates. The low outlier will describe
> why the story is so easy, the high outlier will describe why the story is so hard. Maybe the
> product owner will chime in on what is included in the story. The whole team plays again. Usually
> estimates converge quickly. **If they don't, pull the card out to discuss later, or average the
> estimates, or take the high or low. Whatever the team decides is OK.**

Four things worth noticing, because they are all product decisions:

1. **Only the outliers speak**, and they speak to *why*, not to *what number*. This bounds the
   discussion and keeps it about the work.
2. **The whole team re-votes**, not just the outliers. Convergence has to be earned from everyone.
3. **There is an explicit escape hatch.** Non-convergence is a legitimate outcome. Grenning names
   three: defer the card, average, or take an extreme.
4. **The team chooses the tie-break rule**, and Grenning declines to prescribe one.

His large-backlog variant adds two more escape hatches worth stealing verbatim: alongside Low /
Medium / Hard piles, he uses a **"More info"** pile and a **"You must be kidding!"** pile. Cards that
refuse to settle get named — he calls them "Nervous Nellie" cards — and "if you can't [settle them]
it is a sign that more info is needed, or someone is kidding."

Under a clarity stance, *"we could not agree, and here is what we disagreed about"* is a
first-class, valuable result. Most tools cannot represent it. That is a genuine product gap.

### The complication: convergence is not always good

This is where honest reporting matters, because the practitioner literature is uniformly
enthusiastic and the empirical literature is not.

**Haugen (2006)**, [An Empirical Study of Using Planning Poker for User Story Estimation](https://doi.org/10.1109/AGILE.2006.16)
(AGILE 2006), analysed 101 user story estimates across four releases of a real XP team — two
releases with unstructured group estimation, two with planning poker. Planning poker improved median
accuracy (median MRE 0.25 vs 0.33 per the
[author's slides](https://web-backend.simula.no/sites/default/files/publications/Haugen.2006.1.pdf))
but the paper's own summary is careful: planning poker "improved the team's estimation performance in
most cases, but **it increased estimation error in the extreme cases**". The effect depended on
familiarity — poker helped on work resembling what the team had done before, and hurt on unfamiliar
work, plausibly because simultaneous reveal *limits* discussion exactly where discussion is most
needed.

**Mahnič and Hovelja (2012)**,
[On using planning poker for estimating user stories](https://doi.org/10.1016/j.jss.2012.04.005)
(JSS 85(9)), ran 13 student teams on a common project alongside a group of experts. Students'
estimates were over-optimistic and **planning poker made the over-optimism worse**. The experts'
poker estimates were much closer to actual effort and beat the statistical combination of their own
individual estimates. Their conclusion: "the optimism bias caused by group discussion diminishes or
even disappears as the expertise of the people involved in the group estimation process increases."

**Moløkken-Østvold, Haugen and Benestad (2008)**,
[Using planning poker for combining expert estimates in software projects](https://doi.org/10.1016/j.jss.2008.03.058)
(JSS 81(12)), studied a real project where half the tasks used poker. Poker consensus estimates were
less optimistic and more accurate than the statistical combination of individual estimates for the
same tasks — but against a *control group of individual experts* on control tasks in the same
project, accuracy was similar, and both groups were unbiased at the median. A code analysis found
more effort was expended on poker-estimated tasks "due to the complexity of the changes to be made,
possibly caused by the information provided in group discussions" — i.e. the discussion changed what
got built, not just what got predicted.

**What this means for the product.** Group discussion is not a reliable accuracy machine. It is a
reliable *information-surfacing* machine whose effect on the number depends on who is in the room
and how familiar the work is. Since the discussion can converge an inexperienced team onto a shared
wrong answer, **a tool that optimises for reaching consensus quickly is optimising for the wrong
thing.** Forced convergence, auto-averaging, and "time to consensus" metrics all push in the harmful
direction. The right optimisation target is: did the divergence get explored, and did the team
record what it learned?

### Why fit is Native

This is the second place where the medium clearly beats the room.

- **Simultaneity is enforceable.** Physical cards can be peeked at, laid down late, or adjusted after
  glancing sideways. A server can guarantee no vote is visible until all are in, which makes the §1.1
  anchoring protection real rather than aspirational.
- **Divergence is detectable.** The tool knows the spread the instant votes land, and can route
  automatically to the outlier protocol instead of relying on a facilitator noticing.
- **Turn-taking can be structured.** "Lowest, then highest, then re-vote" is a state machine. In a
  room it depends on a facilitator having the social capital to stop a senior person talking.
- **The output can be captured.** The clarification that resolves a 1-vs-13 is the most valuable
  thing produced in the session and, in a room, it evaporates. A tool can attach it to the story.
- **Non-convergence can be represented** as a real state with real follow-up, rather than a meeting
  that ran out of time.

The honest limitation: **reading the room does not translate.** A skilled facilitator sees who has
gone quiet, who is deferring, who does not understand the story but will not say so. No amount of UI
recovers that. The partial substitutes are explicit affordances — a non-numeric "I don't have enough
context" card, a private per-voter confidence flag — which give people a low-cost way to say what
their body language would otherwise have said. That is a mitigation, not a replacement, and it
should be described as one.

---

## 7. Scale choice

**Evidence: A that it barely matters. Fit: Native but low value.**
The most over-discussed question in estimation, and the one with the clearest empirical answer.

### The rationale for logarithmic scales is psychophysics, not mathematics

Cohn's [Why the Fibonacci Sequence Works Well for Estimating](https://www.mountaingoatsoftware.com/blog/why-the-fibonacci-sequence-works-well-for-estimating)
grounds the choice in **Weber's Law**: the difference we can perceive between two magnitudes is a
percentage, not an absolute. After 2, each Fibonacci number is about 60% larger than the previous,
so each step is equally discriminable. He notes that 40 and 100 in the *modified* sequence are 100%
and 150% jumps, and defends them on the basis that Weber's Law is known not to hold at extreme values.

His own verdict on Fibonacci versus doubling is notably relaxed: "These days I remain fairly
impartial between the two sets of values. Either set of values exhibits attributes of Weber's Law."

Grenning independently arrived at a *different* sparse scale for a practical reason: "In my original
paper I suggested a sparse sequence where when the numbers got bigger, there were larger gaps. I
wanted to avoid arguing 10 vs. 11. [...] I prefer a set of numbers that are easy to add up for quick
estimates (1, 2, 3, 5, 8, 10, 15, 20, 30, 50, and so on)."

Both inventors converge on the same underlying property — **sparseness that grows** — and diverge on
the specific numbers without either claiming an advantage. That is the tell.

### Direct evidence: no scale beats another

The [HICSS 2016 study](https://toddlittleweb.com/Papers/Estimates%20or%20NoEstimates%20HICSS%202016-06-15.pdf),
*To Estimate or #NoEstimates, that is the Question*, is the best evidence available on this and is
rarely cited in scale debates. It analysed **55 projects from 9 organisations**, from startups to
large multinationals, and then built a simulation model validated against that data. Among the
parameters they varied was "the bucketing approach used (e.g. none, modified Fibonacci, power of 2,
etc.)". The finding:

> **Bucketing had very little impact** although larger buckets such as powers of 4 slightly eroded
> the added value of velocity.

So: Fibonacci vs powers of two vs T-shirts makes essentially no measurable difference. Only at
extreme coarseness (powers of 4) does anything degrade. **Any argument for one scale over another is
an argument about team ergonomics and false precision, not accuracy.** Configurable decks are table
stakes; they are not a differentiator, and effort spent on scale configurability is effort not spent
on the ruler.

### "Just count the stories": the #NoEstimates throughput argument

Woody Zuill's definition, as quoted in the HICSS paper: "#NoEstimates is a hashtag for the topic of
exploring alternatives to estimates [of time, effort, cost] for making decisions in software
development."

The empirical case is stronger than its reputation:

- **HICSS 2016** (55 projects): "projections based on throughput (story counts) were **essentially
  identical** to that of using velocity (story points)." The throughput P90/P10 error band averaged
  6% narrower than velocity's, which the authors correctly call insignificant. Crucially, *neither*
  forecast well — P90/P10 of about 3.5 for both. Instantaneous velocity had a P90/P10 of 4.5 and
  **did not improve over the life of a project**. Their simulation found story points add value only
  "when there is large variation in story size" — which story splitting removes anyway.
- **Vasco Duarte's own data** ([A better way to predict project release date](https://softwaredevelopmenttoday.com/2012/07/a-better-way-to-predict-project-release-date/)):
  on one 24-iteration project, forecasting from the first 3 iterations, story points overestimated
  delivered scope by 20% while story counts underestimated by 4%; from 5 iterations, 13% vs 4%.
  Duarte himself flags the limitation — "this is data from one single project". His
  [earlier analysis](https://softwaredevelopmenttoday.com/2012/01/story-points-considered-harmful-or-why-the-future-of-estimation-is-really-in-our-past/)
  across nine projects found correlations between point sums and story counts of 0.51 to 0.92,
  i.e. "both metrics represent a signal of the same underlying information".
- **Tawosi et al. (2022)** supply the mechanism at scale. Across 37 projects, story points correlated
  only *low* (35%) or *medium* (58%) with development time; strong correlation appeared in about 5 of
  32 projects. Against actually-logged time, 50% of projects showed low correlation. Pearson was below
  Spearman in 75% of projects, so the relationship is not even usually linear.

**The honest synthesis:** if the purpose of estimating is to forecast a date, the evidence says
counting stories is as good as pointing them, and pointing them is a lot more work. If the purpose is
to build shared understanding of a piece of work, throughput data cannot do that at all, because
there is no conversation in it. **This is the argument that most justifies the product's stance** —
it is a clean concession on the forecasting axis that leaves the clarity axis untouched, and it means
the product should not compete on forecast accuracy, because it would lose to a story counter.

There is one further practical implication. Tawosi et al. found consistency "starts to wear when the
issues are estimated to be bigger than five points", and recommend teams "break down all tasks/issues
estimated" above that. That is a stronger and better-evidenced product feature than any scale
choice: **flag or gate values above 5–8 as split candidates.**

---

## 8. Anti-patterns

Each of these is documented as harmful by people with standing to say so. Together they define what
the product must refuse to build.

### 8.1 Estimates treated as commitments

**Evidence: A (documented mechanism plus a formal standard change in response).**

The Scrum Guide changed "commit" to "forecast" in its June 2011 revision. Ken Schwaber explained why
[on his own blog](https://kenschwaber.wordpress.com/2011/05/03/empiricism-the-act-of-making-decisions-based-on-what-is/),
two months before the change shipped:

> many Scrum Teams use the word commit as if it were a "guarantee." This is a residue of waterfall,
> where an estimate was a contract. [...] I have found team after team that feels they have to do
> anything to deliver their commitment. **The usual victim is quality.**

The accompanying Scrum Update document ([reported by InfoQ](https://www.infoq.com/news/2011/07/UpdatedScrumGuide/))
made it normative: "Development Teams do not commit to completing the work planned during a Sprint
Planning Meeting. The Development Team creates a forecast of work it believes will be done, but that
forecast will change as more becomes known throughout the Sprint."

Grenning lists "Estimates are viewed as commitments" among the core problems of traditional
estimation, and describes the resulting body language precisely: "Ask an engineer for an estimate for
a new feature. Promise that it will only be used for budgetary and planning purposes. [...] You'll see
arms crossed and an effort to back away."

*Product implication:* never surface a session result in language that implies a promise. No "the
team committed to N points". This is a copy decision more than a feature decision, and it is free.

### 8.2 Velocity used as a productivity metric

**Evidence: A (unanimous among the practice's originators; supported by measurement research).**

Martin Fowler, [XpVelocity](https://martinfowler.com/bliki/XpVelocity.html):

> Velocity is a tool for calibrating estimations for YesterdaysWeather, **it is not a measure of
> productivity**. [...] velocity is a team measure, not an individual measure. Using velocity as a
> productivity measure kills agility.

Fowler's [CannotMeasureProductivity](https://martinfowler.com/bliki/CannotMeasureProductivity.html)
(2003) gives the underlying argument: productivity requires measuring output, we cannot measure
software output, and "any true measure of software development productivity must be based on
delivered business value". In [OutcomeOverOutput](https://martinfowler.com/bliki/OutcomeOverOutput.html)
he adds the replicability problem directly: "There's poor replicability with Function Point or Story
Points — different people will give the same things different point scores."

Grenning's warnings are a ready-made list of things not to build:

> - Don't create incentives for velocity goals
> - Don't make stretch goals
> - Don't measure individual velocity
> - Don't compare the velocity from one team to another

Ron Jeffries, in [Story Points Revisited](https://www.ronjeffries.com/articles/019-01ff/story-points/Index.html)
(2019) — "I may have invented story points, and if I did, I'm sorry now" — is equally direct:

> - I certainly deplore their misuse;
> - I think using them to predict "when we'll be done" is at best a weak idea;
> - I think tracking how actuals compare with estimates is at best wasteful;
> - **I think comparing teams on quality of estimates or velocity is harmful.**

Thoughtworks placed ["velocity as productivity"](https://www.thoughtworks.com/radar/techniques/velocity-as-productivity)
in the **Hold** ring of its Technology Radar, noting that it "leads to unproductive team behaviors
that optimize this metric at the expense of actual working software".

The measurement-research counterpart is Forsgren, Storey, Maddila, Zimmermann, Houck and Butler,
[The SPACE of Developer Productivity](https://queue.acm.org/detail.cfm?id=3454124) (ACM Queue 19(1),
2021), whose central claim is that productivity "cannot be reduced to a single dimension (or
metric!)" and that "only by examining a constellation of metrics in tension can we understand and
influence developer productivity".

*Product implication:* no velocity leaderboards, no individual velocity, no trend lines framed as
improvement. Note that Jeffries' third bullet also rules out **estimate-vs-actual accuracy
tracking**, which is a feature many tools ship and which would be a natural thing to build here.

### 8.3 Cross-team point comparison

**Evidence: A.**

Fowler's [StandardStoryPoints](https://martinfowler.com/bliki/StandardStoryPoints.html) addresses
this head-on. Baked into a team's points are "all sorts of assumptions about the nature of the team's
task, the capability of the team, and whether the team are optimistic or pessimistic estimators", and
normalising across teams means normalising all of that. Then the sharp part:

> The dangerous aspect comes from once you have a standard unit for measurement across teams, someone
> is inevitably going to use it to compare the performance of teams. Even if everyone swears till they
> are blue in the face that they won't [...] there will always be the suspicion that this will happen
> eventually. **This will cause teams to distort their measurements** so that it seems that they get
> more story points done.

His cost/benefit conclusion: "to be worth trying, this has to yield some valuable benefits — but I
don't see any."

Cohn is more permissive but describes the same failure mode in
[Is It a Good Idea to Establish a Common Baseline for Story Points?](https://www.mountaingoatsoftware.com/blog/is-it-a-good-idea-to-establish-a-common-baseline-for-story-points):
a cross-team velocity chart "can be very dangerous"; "Almost all such comparisons are disruptive to
performance of the combined, overall group or department"; and the inflation mechanism is specific —
a team arguing between 5 and 8 under velocity pressure "will be more likely to assign the 8".

Cohn does describe a legitimate narrow case in
[Establishing a Common Baseline for Story Points](https://www.mountaingoatsoftware.com/blog/establishing-a-common-baseline-for-story-points):
**multiple teams working on one product**, where representatives jointly estimate a dozen items to
seed a shared ruler. He reports doing this with 44 estimators from 22 teams, taking about two hours
for twelve items. He is [quoted](https://www.scrum.org/forum/scrum-forum/5662/normalization-story-points-between-scrum-teams)
drawing the boundary explicitly: "If two teams are on separate projects I would not standardize the
points."

*Product implication:* a **shared ruler across teams on one product** is legitimate and buildable. A
**common point currency across an organisation** is not, and any org-level rollup view invites exactly
the comparison every source above warns about. Note this is a genuine commercial tension — org-wide
dashboards are what enterprise buyers ask for, and the entire literature says don't.

---

## 9. Ranked shortlist

Ranked by evidence-of-value × fit-for-this-medium. Rank 1 is where I would put the next unit of
effort.

| # | Technique | Evidence | Fit | Why it ranks here |
| --- | --- | --- | --- | --- |
| **1** | **Enforced simultaneous private reveal** | **A** | **Native** | Anchoring is the largest, best-replicated effect in the field ([Aranda & Easterbrook](http://www.cs.toronto.edu/~jaranda/pubs/AnchoringAdjustment.pdf): >2× swing, survives expertise, not fixed by confidence ranges). A server can *guarantee* what a card table only encourages. Non-negotiable: no vote visible to anyone — including the facilitator — before reveal. |
| **2** | **Persistent, in-context estimation ruler** | **B** | **Native** | Both inventors of the practice call baselines a precondition ([Cohn](https://www.mountaingoatsoftware.com/agile/agile-estimation-estimating-with-story-points), [Grenning](https://wingman-sw.com/papers/Iteration0-Grenning-v1r0.pages.pdf)), and the failure it targets is measured at scale ([Tawosi](https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf): 25/32 projects inconsistent). A wall of cards dies with the meeting room; durable versioned state doesn't. Biggest gap in the competitive field. |
| **3** | **Structured divergence protocol** | **A/B** | **Native** | The moment the mechanic exists to create ([Grenning](https://wingman-sw.com/papers/Iteration0-Grenning-v1r0.pages.pdf)), and the moment that produces the value ([Moløkken-Østvold & Jørgensen](https://doi.org/10.1023/B:EMSE.0000039882.39206.5a): discussion beats averaging by finding forgotten work). Auto-detect spread → low outlier, then high outlier, then whole-team re-vote → cap the rounds → offer real escape hatches. |
| **4** | **Capture the clarification as the artifact** | **B** | **Native** | Follows directly from §1.3: the value is the surfaced work, not the number. In a room it evaporates; here it can attach to the story. This is the product's stance made executable, and it's differentiating. |
| **5** | **Triangulation prompt** | **C** | **Native** | Untested, but a coherent remedy for a documented disease, from the person who named it — and [his own tool ships it](https://www.mountaingoatsoftware.com/blog/automatically-triangulating-estimates-in-planning-poker). Near-free once #2 exists: surface one reference below and one above the value under discussion. |
| **6** | **Split-gate above 5–8 points** | **A** | **Native** | [Tawosi](https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf) found consistency "starts to wear" above five points and recommends breaking those down. One rule, strong evidence, trivial build — better value than any scale-configuration work. |
| **7** | **Non-convergence as a first-class outcome** | **B** | **Native** | Grenning's "More info" / "You must be kidding!" piles and deferred "Nervous Nellie" cards. Under a clarity stance, "we couldn't agree, and here's why" is a *result*. Almost no tool can represent it. |
| **8** | **Bucket-system bulk sizing for large backlogs** | **B** | **Portable** | [Poženel et al.](https://arxiv.org/pdf/2401.16152): matched poker's accuracy at ~60% of the time (15 vs 24.5 min median). Its mechanics are assignment, not spatial arrangement, so it decomposes into ordinary UI. Real build cost; do it after 1–7. |
| **9** | **Jørgensen's uncertainty reframing** | **B** | **Native** | If uncertainty is ever expressed, ask "how likely is it that this is more than X?" rather than for a min–max range ([TSE 2004](https://doi.org/10.1109/TSE.2004.1274041)). Costs one line of copy. Ranked low only because it's peripheral to relative sizing. |
| **10** | **Calibration training module** | **B general / D transfer** | Native mechanically | Easy to build, great demo, weak evidence of transfer to software ([Lichtenstein & Fischhoff](https://www.academia.edu/26381998/Training_for_calibration); [Jørgensen & Moløkken](https://web-backend.simula.no/sites/default/files/publications/SE.5.Joergensen.2004.b.pdf) moved the minimum but not the maximum). Also argues against the product's own stance. Optional side exercise at most. |

---

## 10. Not worth building

Each of these is either contradicted by evidence, or documented as harmful by the people who
invented the practice.

| Don't build | Why not |
| --- | --- |
| **Cross-team / org-wide point normalisation** | [Fowler](https://martinfowler.com/bliki/StandardStoryPoints.html): someone will inevitably compare teams, "this will cause teams to distort their measurements", and "to be worth trying, this has to yield some valuable benefits — but I don't see any." Cohn agrees for separate projects. *Exception:* a shared ruler for multiple teams on **one product** is legitimate. |
| **Velocity leaderboards, cross-team dashboards, individual velocity** | Unanimous: [Fowler](https://martinfowler.com/bliki/XpVelocity.html) ("kills agility"), [Grenning](https://wingman-sw.com/papers/Iteration0-Grenning-v1r0.pages.pdf) (four explicit don'ts), [Jeffries](https://www.ronjeffries.com/articles/019-01ff/story-points/Index.html) ("harmful"), [Thoughtworks](https://www.thoughtworks.com/radar/techniques/velocity-as-productivity) (Hold ring), [SPACE](https://queue.acm.org/detail.cfm?id=3454124) (no single metric). |
| **Estimate-vs-actual accuracy tracking / estimator scoring** | [Jeffries](https://www.ronjeffries.com/articles/019-01ff/story-points/Index.html): "tracking how actuals compare with estimates is at best wasteful". It also corrupts the ruler by mixing a posteriori into a priori knowledge ([Cohn](https://www.mountaingoatsoftware.com/blog/to-re-estimate-or-not-that-is-the-question)), and it would make people defend numbers instead of explore work. |
| **Points → hours/days conversion** | Reintroduces exactly the commitment framing the Scrum Guide moved away from in 2011 ([Schwaber](https://kenschwaber.wordpress.com/2011/05/03/empiricism-the-act-of-making-decisions-based-on-what-is/): "The usual victim is quality"), and asserts a link [Tawosi](https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf) shows is weak or non-linear in most real projects. |
| **Auto-averaging or forced consensus** | [Jørgensen's TSE guidelines](https://doi.org/10.1109/TSE.2005.128): combine "through group work, not through mechanical combination" — the discussion *is* the value. Averaging skips it and throws away the only thing worth having. |
| **"Time to consensus" as a headline metric** | Optimises for the harmful direction. [Mahnič & Hovelja](https://doi.org/10.1016/j.jss.2012.04.005) found poker *amplified* over-optimism in inexperienced teams; [Haugen](https://doi.org/10.1109/AGILE.2006.16) found it worse on unfamiliar work. Fast convergence can mean a team agreed on the wrong thing quickly. |
| **Deep scale configurability as a differentiator** | [HICSS 2016](https://toddlittleweb.com/Papers/Estimates%20or%20NoEstimates%20HICSS%202016-06-15.pdf) tested this directly across 55 projects plus simulation: "Bucketing had very little impact." Cohn is "fairly impartial" between Fibonacci and doubling. Ship a few decks; stop there. |
| **Affinity estimation as a spatial canvas** | The only head-to-head study ([Poženel et al.](https://arxiv.org/pdf/2401.16152)) found it *significantly less accurate* than both alternatives, with no time advantage over the Bucket System. Highest build cost (real-time multi-cursor drag), weakest evidence, Lossy fit. Build the bucket flow instead. |
| **Retrospective re-estimation of completed reference stories** | [Cohn](https://www.mountaingoatsoftware.com/blog/to-re-estimate-or-not-that-is-the-question): mixing after-the-fact knowledge into the ruler destroys its comparability. Support *retiring* or *re-baselining* a stale category instead — decay is punctuated, not gradual. |
| **Predicted delivery dates** | [HICSS 2016](https://toddlittleweb.com/Papers/Estimates%20or%20NoEstimates%20HICSS%202016-06-15.pdf): both velocity and throughput forecasts carry a P90/P10 of ~3.5, and velocity variance **does not shrink over a project's life**. Competing on forecast accuracy means losing to a team that just counts stories — and abandoning the stance that makes this product coherent. |

---

## Appendix: source list

**Peer-reviewed empirical**

- Aranda & Easterbrook, *Anchoring and Adjustment in Software Estimation*, ESEC/FSE 2005 — [doi](https://doi.org/10.1145/1081706.1081761) · [PDF](http://www.cs.toronto.edu/~jaranda/pubs/AnchoringAdjustment.pdf)
- Moløkken-Østvold & Jørgensen, *Group Processes in Software Effort Estimation*, EMSE 9(4) 2004 — [doi](https://doi.org/10.1023/B:EMSE.0000039882.39206.5a) · [preprint](https://www.ppig.org/files/2003-PPIG-15th-molokken.pdf)
- Haugen, *An Empirical Study of Using Planning Poker for User Story Estimation*, AGILE 2006 — [doi](https://doi.org/10.1109/AGILE.2006.16) · [slides](https://web-backend.simula.no/sites/default/files/publications/Haugen.2006.1.pdf)
- Moløkken-Østvold, Haugen & Benestad, *Using planning poker for combining expert estimates in software projects*, JSS 81(12) 2008 — [doi](https://doi.org/10.1016/j.jss.2008.03.058)
- Mahnič & Hovelja, *On using planning poker for estimating user stories*, JSS 85(9) 2012 — [doi](https://doi.org/10.1016/j.jss.2012.04.005)
- Poženel, Fürst, Vavpotič & Hovelja, *Agile Effort Estimation: Planning Poker, Bucket System and Affinity Estimation*, IJSEKE 2023 — [doi](https://doi.org/10.1142/S021819402350064X) · [PDF](https://arxiv.org/pdf/2401.16152)
- Tawosi, Moussa & Sarro, *On the Relationship Between Story Points and Development Effort in Agile Open-Source Software*, ESEM 2022 — [doi](https://doi.org/10.1145/3544902.3546238) · [PDF](https://solar.cs.ucl.ac.uk/pdf/tawosi2022esem.pdf)
- Power, *Using Silent Grouping to Size User Stories*, XP 2011 — [doi](https://doi.org/10.1007/978-3-642-20677-1_5)
- Jørgensen, *Realism in assessment of effort estimation uncertainty: it matters how you ask*, IEEE TSE 30(4) 2004 — [doi](https://doi.org/10.1109/TSE.2004.1274041)
- Jørgensen, *Evidence-based guidelines for assessment of software development cost uncertainty*, IEEE TSE 2005 — [doi](https://doi.org/10.1109/TSE.2005.128)
- Jørgensen & Moløkken, *Eliminating Over-Confidence in Software Development Effort Estimates*, PROFES 2004 — [doi](https://doi.org/10.1007/978-3-540-24659-6_13) · [PDF](https://web-backend.simula.no/sites/default/files/publications/SE.5.Joergensen.2004.b.pdf)
- Lichtenstein & Fischhoff, *Training for calibration*, OBHP 1980 — [PDF](https://www.academia.edu/26381998/Training_for_calibration)
- Flyvbjerg, *From Nobel Prize to Project Management: Getting Risks Right*, PMJ 37(3) 2006 — [doi](https://doi.org/10.1177/875697280603700302) · [PDF](https://arxiv.org/pdf/1302.3642)
- Forsgren et al., *The SPACE of Developer Productivity*, ACM Queue 19(1) 2021 — [article](https://queue.acm.org/detail.cfm?id=3454124)
- Little & Verhoef, *To Estimate or #NoEstimates, that is the Question*, HICSS 2016 — [PDF](https://toddlittleweb.com/Papers/Estimates%20or%20NoEstimates%20HICSS%202016-06-15.pdf) (data originally collected by Vasco Duarte; see [Little's talk abstract](https://confengine.com/conferences/agile-india-2016/proposal/1794/to-estimate-or-noestimates-that-is-the-question))

**Practitioner primary (the originators' own writing)**

- Grenning, *Planning Poker* (2002 original) — [paper](https://www.wingman-sw.com/papers/PlanningPoker-v1.1.pdf) · [origin story](https://wingman-sw.com/articles/planning-poker)
- Grenning, *Agile Requirements, Estimation and Planning — Iteration Zero* — [PDF](https://wingman-sw.com/papers/Iteration0-Grenning-v1r0.pages.pdf)
- Cohn, [Estimating with Story Points](https://www.mountaingoatsoftware.com/agile/agile-estimation-estimating-with-story-points) · [triangulation](https://www.mountaingoatsoftware.com/blog/how-to-prevent-estimate-inflation) · [auto-triangulate](https://www.mountaingoatsoftware.com/blog/automatically-triangulating-estimates-in-planning-poker) · [Fibonacci/Weber](https://www.mountaingoatsoftware.com/blog/why-the-fibonacci-sequence-works-well-for-estimating) · [re-estimation](https://www.mountaingoatsoftware.com/blog/to-re-estimate-or-not-that-is-the-question) · [common baseline](https://www.mountaingoatsoftware.com/blog/establishing-a-common-baseline-for-story-points) · [baseline risks](https://www.mountaingoatsoftware.com/blog/is-it-a-good-idea-to-establish-a-common-baseline-for-story-points)
- Jeffries, [Story Points Revisited](https://www.ronjeffries.com/articles/019-01ff/story-points/Index.html)
- Fowler, [XpVelocity](https://martinfowler.com/bliki/XpVelocity.html) · [StandardStoryPoints](https://martinfowler.com/bliki/StandardStoryPoints.html) · [CannotMeasureProductivity](https://martinfowler.com/bliki/CannotMeasureProductivity.html) · [OutcomeOverOutput](https://martinfowler.com/bliki/OutcomeOverOutput.html)
- Schwaber, [Empiricism, the act of making decisions based on what is](https://kenschwaber.wordpress.com/2011/05/03/empiricism-the-act-of-making-decisions-based-on-what-is/) · [2011 Scrum Guide change](https://www.infoq.com/news/2011/07/UpdatedScrumGuide/)
- Hubbard Decision Research, [Calibrated Probability Assessments: An Introduction](http://www.hubbardresearch.com/wp-content/uploads/2019/06/Introduction-to-Calibrating-Probability-Assessments-Hubbard-Decision-Research.pdf) · [the exercise](https://www.theuncertaintyproject.org/tools/estimator-calibration)
- Duarte, [Story Points Considered Harmful](https://softwaredevelopmenttoday.com/2012/01/story-points-considered-harmful-or-why-the-future-of-estimation-is-really-in-our-past/) · [A better way to predict project release date](https://softwaredevelopmenttoday.com/2012/07/a-better-way-to-predict-project-release-date/)
- Sterling, [Affinity Estimating: A How-To](https://gettingagile.com/2008/07/04/affinity-estimating-a-how-to/) (earliest write-up of Lindstrom's technique)
- Thoughtworks Technology Radar, [Velocity as productivity](https://www.thoughtworks.com/radar/techniques/velocity-as-productivity) (Hold)
