# Agent Report — landing-page-expert

**Task**: Full homepage + quiz funnel CRO audit and recommendations for beegood.online
**Date**: 2026-04-22
**Status**: success

---

## Page Brief

- **Offer**: Free diagnostic quiz → free training signup (lead magnet); value ladder ₪197–₪30,000/mo
- **Audience**: Israeli business owners, coaches, influencers — creating content but not seeing results
- **Traffic source**: Meta ads (primary), organic / direct
- **Awareness level**: Problem-aware (knows content isn't working) but Solution-unaware (doesn't know why or what to do)
- **Primary CTA**: Quiz → lead form → email nurture → product recommendation
- **Page structure read**: Full `app/page.tsx`, `lib/ab.ts`, `app/quiz/page.tsx`, `app/quiz/QuizClient.tsx`, `components/landing/StatsSection.tsx`, `components/SocialProofStrip.tsx`, `components/home/HomeStickyBar.tsx`, `components/landing/PhilosophySection.tsx`, `data/reviews.ts`, `lib/quiz-config.ts`

---

## Diagnostic Scores (1–5)

| Dimension | Score | Biggest Fix |
|---|---|---|
| **Clarity** | 3/5 | The offer above the fold is emotional/philosophical but doesn't state a concrete benefit in 5 seconds. The quiz CTA explains what to click but not what the visitor gets |
| **Relevance** | 3/5 | Meta ad traffic landing here without a matching ad hook will bounce — the headline variants speak to a sophisticated problem, but cold Meta traffic needs more concrete framing |
| **Value** | 3/5 | "Free quiz" is low perceived value; free training is the actual value but it's buried three clicks deep. No explicit "what you'll get from this quiz" promise |
| **Friction** | 4/5 | Hero → quiz is one click, good. Lead gate at step 6 requires name + email + phone for anonymous users — that's 3 fields + a consent checkbox. Phone field is the highest friction point |
| **Distraction** | 2/5 | The footer "יש לך זיכוי? בדוק באזור האישי שלך" link points to a dead credit system, competes for attention, and erodes trust. Full product grid below fold creates choice paralysis |
| **Anxiety** | 3/5 | No risk reversal adjacent to CTA. "What happens after I click?" is unanswered. No "how long does it take?" promise. Visitors fear commitment and wasted time |
| **Urgency** | 2/5 | Near-zero urgency. No scarcity, countdown, or time-sensitive framing anywhere on homepage. Products exist but no "next workshop date" or waitlist language above the fold |

**Overall conversion readiness: 2.9/5** — The page has strong design craft and a solid backend, but is missing several foundational conversion triggers above the fold.

---

## UX/UI Analysis

### Hero Section (Above the Fold)

**Desktop F-pattern analysis:**
The eye enters top-right (RTL) and reads the headline. The TrueSignal© pill badge appears first — this is correct brand anchoring but the text "שיטת TrueSignal©" means nothing to a cold visitor who just saw a Meta ad. It functions as insider language before trust is established.

The headline renders in the right 45% panel. The left 55% is Hadar's photo. Visual hierarchy: Photo → Headline → Body text → CTA. The photo does the heavy lifting of establishing "there's a real person here" which is correct.

**Problem**: Below the headline, the description line in both A and B variants is in muted gray (`#9E9990`) — the second lowest contrast text color in the design system. On a phone at 100 nits, this line will be nearly invisible. The description carries the "why click" message, and it's the least readable element in the hierarchy.

**Mobile thumb-zone:**
The CTA button is pinned at `bottom: 32px` on mobile — correct thumb-zone placement. Full-width button is good. However, there is no secondary trust signal between the headline and the CTA. The distance between "I read the headline" and "I'm being asked to click" contains only a muted gray description. The micro-trust gap is unaddressed.

**What the eye sees first/second/third (mobile):**
1. Hadar's face/photo (full bleed background)
2. Gold pill badge — TrueSignal©
3. Headline (white, bold, large)
4. Description (gray, small — often skipped)
5. CTA button (gold, full-width)

**Missing between steps 4 and 5**: One trust signal. The visitor has no reason to believe clicking the quiz is worth their time before they're asked to do it. Even a single number — "הצטרפו 3,500+ עסקים" — placed between the description and the CTA button would close this gap.

### Stats Section

Three animated counters: `3,500+ לקוחות`, `50,000+ תכנים`, `80+ תחומים`. These appear immediately after the hero fold.

**Issue 1 — Specificity mismatch**: "50,000 תכנים" is a production stat — it tells the visitor about output volume but says nothing about results. What the problem-aware visitor needs is: "תוצאות" not "תכנים." Consider replacing with "3,500+ לקוחות", "4 שנים", "97% ממליצים" (which matches the CLAUDE.md original intent for this section) — outcome-oriented numbers.

**Issue 2 — Counter starts at 0**: Every visitor watches the counter animate from zero. On a slow mobile connection, the section may scroll past before animation completes. This is a minor UX friction point.

**Issue 3 — Missing labels**: "80 תחומים" lacks context — 80 business niches? Why does that matter to the visitor? This stat needs either a clarifying sub-label or replacement.

### SocialProofStrip

Rotating testimonials with Google 5.0 badge — placed between StatsSection and PhilosophySection. This is solid architecture. The auto-rotate at 6 seconds is fast enough to show variety but slow enough to read.

**Issue**: The strip sits between two dark sections and is visually de-emphasized by the `#141820` background with low-opacity gold borders. On mobile it blends into the page. The aggregate rating (5.0) is shown correctly but it should also show the review count ("5.0 · 55 ביקורות") to increase credibility weight.

**FEATURED_REVIEWS selection in `data/reviews.ts`**: The 6 featured reviews are curated intelligently — they include outcome language (רועי מנדלמן: "הפכתם את הנקודה הכי קשה לנקודת חוזקה"), process language (ענת חנקין: "אסטרטגיה טובה ועדכנית, מעטפת שיווקית מדהימה"), and emotional language (שירה לוי גרנט: "דרככם אנחנו מצליחים להביע את מי שאנחנו"). This is strong selection. The problem is they're hidden in a rotating strip — most visitors will see only 1 or 2 before scrolling past.

### Philosophy Section

"הגישה שלנו" with three principle cards (Compass, Flame, TrendingUp icons). This section makes a coherent strategic argument:
1. Strategy first
2. Content from inside
3. Sales that arrive naturally

The problem is placement: this section appears **after** the stats strip, meaning the visitor is asked to understand a philosophy before they've decided to care. Philosophy is a retention tool — it works best when the visitor has already opted in at the level of "this might be for me." For cold traffic, this section delays the descent toward product consideration.

**Cognitive load — products section**: The products section presents 8 products across three visual formats (zigzag ladder, 2-col premium grid, wide hive card). For a visitor who doesn't know which product is right for them, this is maximum choice paralysis. The quiz exists specifically to solve this problem — but there is no CTA at the top of the products section directing visitors to take the quiz before browsing products.

### Social Proof Section (Bottom)

Three testimonials with initials-only avatars. The Google 5.0 badge is repeated. The section headline: "מעל 3,500 עסקים כבר מצאו את הבהירות שלהם עם הדר" — this is good copy, outcome-focused.

**Problem**: The three testimonials selected in `app/page.tsx` (ניסן אלנקווה, נטע מרום, נטלי גדקר) are all generic praise without measurable outcomes. Compare with the available testimonials that do have outcome language (רועי מנדלמן: "הפכתם את הנקודה הכי קשה לנקודת חוזקה ואני אפילו נהנה מזה עכשיו", gal masas: "הביא לי הרבה פניות", ענת חנקין: "מעטפת שיווקית מדהימה עם מלא ערך"). The current selection misses an opportunity to demonstrate tangible ROI.

**No photos on testimonials**: Initial-letter avatars are the weakest possible social proof format. Google reviews inherently carry some credibility, but the current rendering (initial in a gold gradient circle) looks identical to a generated placeholder. At minimum, the Google badge next to each testimonial should be more prominent.

### HomeStickyBar

Appears after 400px scroll AND only when the hero CTA is not in view. The logic is correct — it doesn't compete with the hero CTA.

**Copy issue**: The bar says "לא בטוח/ה איפה להתחיל?" and "קוויז קצר - ונדע בדיוק מה מתאים לך" then repeats the hero CTA text. This is good — it gives a reason to click ("לא בטוח/ה") that speaks to the undecided visitor. 

**Issue**: The CTA text in the sticky bar is pulled from `content.cta` — the A/B variant CTA text. Variant A: "בדוק מה באמת חסר בשיווק שלך ←" is a long CTA text that may truncate on small screens at `padding: 10px 20px, fontSize: 13`. Consider a shorter sticky bar CTA regardless of variant.

### Footer

**Critical issue**: The link "יש לך זיכוי? בדוק באזור האישי שלך ←" links to `/my` and references the credit system that was fully removed in April 2026 (confirmed in CLAUDE.md: "credit system removed"). This link is dead-end UX — clicking it leads to a redirect to `/account` which shows no credit. This should be removed immediately.

The footer navigation is comprehensive (10 links) which is good for SEO and for visitors who scroll to investigate before buying. The TrueSignal© microcopy footer line is strong brand positioning.

---

## Copy Analysis

### A/B Headline Variants

**Variant A:**
- Headline: "אתה יכול למכור רק את מה שאתה. / השאלה אם השיווק שלך משדר את זה."
- Description: "אנחנו מזהים את הפער - והופכים אותו לאסטרטגיה ולתוכן שמביא תוצאות ביום צילום אחד."
- CTA: "בדוק מה באמת חסר בשיווק שלך ←"

**Variant B:**
- Headline: "לא כל תוכן עובד. / רק תוכן שנבנה נכון."
- Description: "אנחנו מתחילים באסטרטגיה - ומסיימים ביום צילום שמייצר תוכן שבאמת עובד."
- CTA: "רוצה להבין מה נכון לעסק שלך? ←"

**Assessment — Variant A is stronger for the following reasons:**

1. **Personalization**: Variant A uses second person "אתה" and names the psychological tension (you can only sell what you are — is your marketing transmitting that?). This is a Rorschach statement — every business owner who has tried content and failed will hear themselves in it.

2. **Variant B is generic**: "לא כל תוכן עובד / רק תוכן שנבנה נכון" is functionally true but says nothing surprising. Every content agency makes this claim. It's a feature statement (built right = works) not a belief-system challenge.

3. **CTA quality**: Variant A's CTA "בדוק מה באמת חסר" uses loss framing (something is missing — I need to know what). Variant B's CTA "רוצה להבין מה נכון" is softer and less urgent.

**However**: Both variants share the same structural weakness — the description line is doing the strategic work that the headline should do. In Variant A, the description ("אנחנו מזהים את הפער...") is a company statement, not a visitor benefit. It switches from "you" to "we" at the worst possible moment — right when the visitor is deciding to stay.

**Schwartz Awareness Level Analysis:**

Cold Meta traffic landing here is likely at Stage 2 (Problem Aware) — they know content isn't working but don't know why or what the solution is. Variant A enters at Stage 2 correctly by naming the invisible tension (is your marketing transmitting who you are?). Variant B's opening line "לא כל תוכן עובד" is also Stage 2 but is less specific to the psychological pain state.

The philosophy section and product descriptions push into Stage 3 (Solution Aware) — this is the right sequence, but it happens too slowly.

**AIDA arc assessment:**

- **Attention**: Hero headline — decent (A better than B)
- **Interest**: Description + TrueSignal badge — weak, because it pivots to "we" too quickly
- **Desire**: Philosophy section, testimonials — present but too far down the page
- **Action**: CTA button + sticky bar — present

The page lacks a strong Interest bridge between the headline and the CTA. The visitor goes from an emotional statement directly to an action request, with only a muted gray description paragraph in between. The interest layer needs expansion or social proof injection.

### CTA Copy Analysis

Hero CTA: "בדוק מה באמת חסר בשיווק שלך ←" (Variant A)
- Outcome-focused: no. It asks the visitor to check (action-focused), not to gain something.
- Better framing: make it a benefit, not a task. "גלה מה עוצר אותך ←" (discover what's blocking you) or "קבל המלצה אישית ←" (get a personal recommendation).

Lead gate CTA on quiz step 6: "גלה את ההמלצה שלי ←" — this is stronger. It's benefit-focused (discover my recommendation) and personal (שלי = mine).

Sticky bar CTA: repeats the hero CTA text — correct for consistency but the sticky bar context (mid-scroll, undecided user) would benefit from a shorter, punchier text.

### Social Proof Copy Assessment

The rotating strip testimonials (FEATURED_REVIEWS) include some outcome language but most are about the experience (atmosphere, team, professionalism). This is appropriate for credibility but doesn't address the specific anxiety of the problem-aware visitor: "will this actually work for my business?"

The three hardcoded testimonials on the homepage bottom section are pure vibe testimonials with no metrics. The best available outcome testimonials in `data/reviews.ts` are:

- רועי מנדלמן (id 28): "הצלחתם להפוך את הנקודה שהכי קשה לי בעסק לנקודת חוזקה ואני אפילו נהנה מזה עכשיו"
- gal masas (id 31): "הביא לי הרבה פניות" + "אחרי אכזבות מחברות אחרות"
- ענת חנקין (id 41): "אסטרטגיה טובה ועדכנית, מעטפת שיווקית ממש מדהימה"
- tal barell (id 33): "הקפיץ לי את העסק והעלה לי את רמת החשיפה וכמות הלקוחות"

These four testimonials are in the database but not on the homepage. They should replace the current three.

---

## Conversion Psychology Assessment

### Loss Aversion
**Present**: Weakly present. Variant A's "בדוק מה באמת חסר בשיווק שלך" implies something is missing. The quiz result page shows a "confidence bar" and "incoherence warning" that create mild anxiety about misalignment.
**Missing**: No explicit loss framing on the homepage. No statement of what continues to be lost for every week the visitor doesn't act (leads, visibility, revenue). The cost of inaction is never named.
**Recommendation**: Add one loss-framing sentence below the headline: "כל תוכן שאתה מפרסם בלי בהירות הוא תקציב שנזרק."

### Social Proof Placement
**Issue**: The testimonials (both the strip and the bottom section) are placed in the wrong position relative to the point of doubt. The visitor's primary moment of doubt is at the CTA button — "should I take this quiz?" That moment receives zero social proof. The testimonials are shown either at the top (strip) or at the very bottom (after products), but never adjacent to the conversion action.
**Recommendation**: Place one brief testimonial or a stat ("3,500+ עסקים כבר עברו את האבחון") directly below the hero CTA button.

### Anchoring
**Current state**: The products section shows prices from free → ₪197 → ₪1,080 → ₪1,800 → ₪4,000 → ₪14,000 → ₪10,000-30,000/mo. The ascending value ladder is a good anchoring sequence if the visitor sees the high prices first. Currently, the ladder is presented top-to-bottom with free first — this means visitors who stop early see only the low-value options.
**Issue**: The premium products (₪14,000 and ₪10,000-30,000/mo) are shown below the standard ladder. For visitors who scroll far enough, they will anchor lower products against the premium, making them seem affordable. For visitors who stop at the ladder, there's no anchoring from the premium tier.
**Recommendation**: Consider adding a subtle "צוות נבחר מפרסמים עובד עם הדר בתקציב חודשי של ₪10,000-30,000" line near the top of the products section to anchor the upper boundary before visitors see the lower prices.

### Commitment & Consistency / Zeigarnik Effect
**Present**: The quiz exploits this well. The progress bar shows "1/6" through "6/6" — the Zeigarnik effect (uncompleted tasks create tension) drives completion. The slide animation between questions creates forward momentum. The "result is ready" lead gate creates a gap (you've done the work, now close the loop) that increases form submission probability.
**Missing**: The homepage doesn't prime this loop. The CTA says "בדוק מה חסר" but doesn't say "6 שאלות קצרות." Naming the quiz length ("שש שאלות, 2 דקות") in the homepage CTA area would pre-commit the visitor to a specific, bounded investment — dramatically reducing the cost perception of clicking.

### Risk Reversal
**Missing entirely**. No guarantees, no "no-spam" promises, no "takes 2 minutes" time commitment statement appear near the hero CTA. The lead gate on quiz step 6 says "ללא ספאם. ניתן לבטל בכל עת." — this is present but only visible after the visitor has already clicked through 6 questions. The same anti-anxiety text should appear below the hero CTA.
**Note**: The strategy session page does have a "לא פיצחנו בפגישה הראשונה? פגישה נוספת עלינו" guarantee. This is strong risk reversal — it should be referenced from the homepage and quiz result page.

### Von Restorff Effect (Isolation / Distinctiveness)
The gold CTA button on the dark background is visually correct. It does stand out. The glow shadow (`0 0 40px rgba(201,150,74,0.15)`) is subtle — consider strengthening the glow on hover to increase the visual "call out" effect.

### Reciprocity
The free training as a lead magnet is a reciprocity play. But its value is underexplained on the homepage. Visitors see "הדרכה חינמית" in the products section but don't know what they'll learn. A specific promise ("90 דקות שמסבירים למה השיווק שלך לא עובד — ומה לעשות במקום") would increase perceived value of the lead magnet.

---

## Prioritized Recommendations

### #1 — Add Trust Signal Below Hero CTA
**What**: Add a single line of micro-copy directly below the hero CTA button in both mobile and desktop hero sections. Add to `app/page.tsx` in both the `md:hidden` and `hidden md:block` sections, immediately after the `<a href="/quiz">` element.
**Exact copy**: `"6 שאלות · 2 דקות · ללא כרטיס אשראי"`
**Why**: Risk reversal + time commitment pre-commitment. Addresses the three largest anxieties before the click: how long, what it costs, what commitment is required. The visitor commits to "2 minutes" not to an unknown process.
**Impact**: HIGH — this single addition directly reduces bounce at the primary conversion point.
**Effort**: LOW — one line of JSX in two places in `app/page.tsx`.

---

### #2 — Fix the Dead Credit Link in Footer
**What**: Remove the entire `<div className="text-center">` block in the footer section of `app/page.tsx` that contains the "יש לך זיכוי? בדוק באזור האישי שלך ←" link. The credit system was removed in April 2026 and this link leads to a dead end.
**Why**: Dead-end UX actively destroys trust. A visitor who clicks this, finds nothing, and returns now doubts the credibility of every other claim on the page. It also signals the site is unmaintained.
**Impact**: HIGH (trust preservation) — trust damage is amplified by platform context (Meta ad traffic is skeptical by default).
**Effort**: LOW — delete ~10 lines from `app/page.tsx`.

---

### #3 — Replace Bottom Testimonials with Outcome-Focused Reviews
**What**: In `app/page.tsx`, replace the three hardcoded entries in the `TESTIMONIALS` const (currently ניסן אלנקווה, נטע מרום, נטלי גדקר) with the three outcome testimonials from `data/reviews.ts`:
- רועי מנדלמן (id 28): outcome = business pain → strength transformation
- gal masas (id 31): outcome = "הביא לי הרבה פניות" + recovered from prior disappointment
- tal barell (id 33): outcome = "הקפיץ לי את העסק, העלה רמת החשיפה וכמות הלקוחות"
**Why**: Outcome testimonials convert. Experience testimonials ("the atmosphere was great") build likability. For a business selling results, the bottom-of-page testimonials should prove results exist, not describe a pleasant experience. The current three testimonials say nothing about business outcomes.
**Impact**: MEDIUM-HIGH — testimonials at this position are read by the most motivated visitors (those who scrolled the whole page). Converting these visitors is highest-leverage.
**Effort**: LOW — change 3 text entries and names in `app/page.tsx`.

---

### #4 — Test Variant C Headline (New A/B Test Arm)
**What**: Add Variant C to `lib/ab.ts` alongside A and B. The new variant directly names the problem at the level of the visitor's internal monologue.
**Exact copy (see Hebrew Copy section below)**.
**Why**: Variant A and B both describe the problem from the outside. Variant C enters the visitor's mind at their most vulnerable private thought — the moment they wonder "why isn't my content working?" This is entering the conversation already happening in their head (Eugene Schwartz's core principle). It tests a different psychological entry point: awareness of personal failure vs. systemic problem.
**Impact**: HIGH — if it beats A, this becomes permanent. If not, data.
**Effort**: MEDIUM — requires `lib/ab.ts` update, `middleware.ts` adjustment to assign 3 variants, admin A/B UI update.

---

### #5 — Add a "Quiz CTA Bridge" at Top of Products Section
**What**: Before `<ProductsSection />` in `app/page.tsx`, add a narrow banner or text line that reads: "לא בטוח מה מתאים לך? ← [קח את הקוויז]" — linking to `/quiz`. This should be visually subtle (not a full section) — perhaps a centered line with a small arrow link in gold.
**Why**: Visitors who scroll past the hero and land on the products section face choice paralysis — 8 products with no guidance. This micro-CTA re-routes uncertain visitors back into the quiz funnel instead of letting them bounce from overwhelm. It exploits the Zeigarnik loop ("the quiz will tell me which one is right") as a relief valve.
**Impact**: HIGH — this recovers visitors who are interested but overwhelmed. Choice paralysis is a silent conversion killer.
**Effort**: LOW — 5 lines of JSX above `<ProductsSection />`.

---

### #6 — Strengthen StatsSection Copy (Replace "50,000 תכנים")
**What**: In `components/landing/StatsSection.tsx`, change the STATS array:
- Keep: `{ value: 3500, label: "לקוחות" }` → change label to `"עסקים ליוינו"`
- Replace: `{ value: 50000, label: "תכנים" }` → `{ value: 97, label: "% ממליצים" }`
- Keep/adjust: `{ value: 80, label: "תחומים" }` → or change to `{ value: 4, label: "שנות ניסיון" }`
**Why**: "50,000 תכנים" is a production metric, not a results metric. Problem-aware visitors need to see that other business owners in their situation succeeded, not that a lot of videos were produced. "97% ממליצים" and "4 שנות ניסיון" speak to trust and longevity — the actual anxieties of a visitor evaluating an unfamiliar brand.
**Impact**: MEDIUM — stats sections are read by a significant portion of visitors who scroll past the hero.
**Effort**: LOW — 3 line changes in `StatsSection.tsx`.

---

### #7 — Add Social Proof Count to SocialProofStrip
**What**: In `components/SocialProofStrip.tsx`, next to the `AGGREGATE.rating.toFixed(1)` display, add the review count: "5.0 · 55 ביקורות". The count is the number of reviews in `data/reviews.ts` (55 entries).
**Why**: A 5.0 rating from an unknown number of reviews has less weight than "5.0 from 55 reviews." The count provides the N-size that makes the aggregate credible. All major review platforms show count for this reason.
**Impact**: MEDIUM — incremental trust increase in a high-visibility position.
**Effort**: LOW — 5 characters added in `SocialProofStrip.tsx`.

---

### #8 — Fix the Lead Gate Phone Field (Reduce Friction)
**What**: In `app/quiz/QuizClient.tsx`, for anonymous users, consider making the phone field optional at step 6 OR split the lead gate into two micro-steps: step 6a = name + email only (CTA: "הראה לי את ההמלצה"), then on the result page, a soft ask for phone ("רוצה שנחזור אליך? הוסף מספר").
**Why**: A 3-field form (name + email + phone) + consent checkbox is 4 total inputs. Research consistently shows each additional field reduces completion by 5–10%. Phone is the highest friction field for Israeli users who fear WhatsApp follow-up before they've decided to engage. Reducing to 2 mandatory fields (name + email) with optional phone will likely increase lead form completion rate.
**Impact**: HIGH — the lead gate is the primary conversion bottleneck in the funnel.
**Effort**: MEDIUM — requires `QuizClient.tsx` changes and `api/signup` confirmation that phone is nullable.

---

### #9 — Add Urgency/Scarcity to Workshop and Challenge Cards in ProductsSection
**What**: The products section in `app/page.tsx` (ROW1_PRODUCTS) doesn't surface upcoming dates. The components `NextChallengeBadge` and `NextWorkshopBadge` exist in the codebase (referenced in CLAUDE.md) but are not rendered on the homepage product cards. Import and add these badges to the challenge and workshop cards.
**Why**: The single most effective urgency trigger for a digital product is a specific upcoming date. "הסדנה הבאה: 3 במאי — 2 מקומות פנויים" converts better than any copy change because it's a factual, time-bound reason to act now.
**Impact**: HIGH for those two products specifically.
**Effort**: MEDIUM — requires confirming `NextChallengeBadge` is importable in the homepage context, and adding to the product cards.

---

### #10 — Remove Binge CTA Section (or Demote)
**What**: The "בינג׳" card section that appears between the products and the social proof section is a secondary destination competing with the primary conversion goal. A visitor who clicks "לכל התכנים" is leaving the funnel without converting.
**Why**: Distraction principle — every link that isn't the primary CTA is a potential leak. The binge hub may serve retention/SEO purposes, but as a homepage section it splits attention at the worst possible moment (post-product consideration, pre-testimonial).
**Recommendation**: Either (a) remove this card from the homepage entirely and link to `/binge` only from the nav, or (b) demote it to the footer navigation row.
**Impact**: LOW-MEDIUM — reduces distraction, marginal lift expected.
**Effort**: LOW — remove one section from `app/page.tsx`.

---

## Improved Hebrew Copy

### Hero Headline — Variant C (New A/B Test Arm)

```
Headline line 1: "המצלמה דולקת. התוכן עולה. הלקוחות לא מגיעים."
Headline line 2: "יש סיבה לזה. ואנחנו יודעים מה היא."
```

**Rationale**: This enters the exact internal monologue of the problem-aware business owner. It names the gap between effort and result — the most painful cognitive dissonance for someone who is "doing everything right" and still not converting. The second line creates curiosity and positions Hadar as the expert who has the answer, not just another agency offering a "better strategy." The cadence (three-beat frustration → relief) is direct response proven in Hebrew markets.

**Description to accompany Variant C:**
```
"3,500+ עסקים עברו אבחון מדויק עם שיטת TrueSignal© וגילו בדיוק מה עצר אותם. 6 שאלות. 2 דקות. המלצה אישית."
```

**CTA for Variant C:**
```
"גלה מה עוצר אותך ←"
```

---

### Hero CTA Button — Improved Version (Applies to All Variants)

**Current (Variant A)**: "בדוק מה באמת חסר בשיווק שלך ←"  
**Current (Variant B)**: "רוצה להבין מה נכון לעסק שלך? ←"

**Improved CTA (test independently)**: "קבל המלצה אישית בחינם ←"

**Rationale**: "קבל" (receive/get) is outcome-framed, not action-framed. "אישית" (personal) increases relevance. "בחינם" removes the last resistance point. This is shorter than both current variants, loads faster on mobile, and names the output not the process.

---

### Trust Signal Line — Below Hero CTA Button

Add this micro-copy line immediately after the hero CTA `<a>` element in both mobile and desktop sections:

```
"6 שאלות · 2 דקות · ללא כרטיס אשראי"
```

Style: `color: #9E9990, fontSize: 12px, textAlign: center, marginTop: 10px`

**Alternative (higher trust, longer):**
```
"הצטרפו כבר 3,500+ עסקים · ללא ספאם, ביטול בכל עת"
```

---

### Subheadline for Desktop (Below Main Headline, Above Description)

Add between `<h1>` and `<p>` in the desktop hero section:

**For Variant A:**
```
"כשהשיווק משדר מי שאתה באמת — הלקוחות הנכונים מוצאים אותך בעצמם."
```

**For Variant C:**
```
"שיטת TrueSignal© עזרה ל-3,500+ עסקים לגלות בדיוק את הסיגנל שהיה חסר להם."
```

Style: `color: #C9964A, fontSize: 14px, fontWeight: 600, marginBottom: 12px, lineHeight: 1.5`

---

### Micro-copy for Lead Gate (Step 6) — Improve the Intro

**Current**: "מלא פרטים כדי לקבל את ההמלצה האישית שלך" (anonymous users)

**Improved**: "כמעט שם. ההמלצה שלך מוכנה — נשאר רק להכיר אותך."

Then sub-line: "מלא שם ואימייל ותוך שניות תראה את האבחון המלא שלך. ללא ספאם, ביטול בכל עת."

**Rationale**: "כמעט שם" acknowledges progress (Zeigarnik: you've done 6/6 steps, one more micro-step to complete the loop). "ההמלצה שלך מוכנה" creates urgency through implication (it exists and is waiting — you're withholding it from yourself by not filling the form).

---

## Quiz Page Audit

### Quiz Intro / Entry State

The quiz has no intro screen. It begins at question 1 immediately, with the question title rendered at the top: "איפה העסק שלך עכשיו?" with subtitle "ענה בכנות - זה יעזור לנו למצוא את הצעד הנכון."

**What's missing**: A brief 3–5 second "loading" state or orientation frame that tells the visitor:
- What they're about to do ("6 שאלות קצרות")
- What they'll get ("המלצה אישית על הצעד הנכון לעסק שלך")
- How long it takes ("~ 2 דקות")
- A visual cue that the quiz is personalized to them

Without this, the visitor feels dropped into a test. With a brief orientation frame (even a single introductory card before question 1), the visitor makes a micro-commitment to complete — dramatically reducing abandonment on question 1.

**Recommended intro card** (step -0.5, before question 1, shown for first-time visitors):
```
Title: "נמצאים את הצעד הנכון עבורך"
Body: "6 שאלות על העסק שלך ועל המטרות שלך. בסוף — המלצה מדויקת על מה לעשות הבא, מותאמת אישית."
Sub: "לוקח כ-2 דקות"
CTA: "מתחיל ←"
```

### Quiz CTA on Homepage — Does It Create Enough Desire?

The homepage CTA says "בדוק מה באמת חסר בשיווק שלך ←" (Variant A). This is curiosity-driven but not desire-driven. It creates the question "what is missing?" but doesn't promise a specific valuable answer. The gap between "check what's missing" and "get a personalized plan" is significant.

The CTA does not:
- Name what the visitor will receive ("המלצה אישית")
- Specify the time investment ("2 דקות")
- Surface the quiz format ("6 שאלות")

All three of these would increase CTR on the quiz CTA.

The sticky bar copy is stronger: "לא בטוח/ה איפה להתחיל? קוויז קצר - ונדע בדיוק מה מתאים לך" — the phrase "ונדע בדיוק" (we'll know exactly) is more concrete and outcome-forward. This should influence the hero CTA rewrite.

### Quiz Page — Abandonment Reduction Opportunities

**Issue 1 — No progress labeling on question 1**: Question 1 shows `"1 / 6"` in small gray text top-right, but doesn't tell the visitor they can expect to finish quickly. A time estimate ("~ 2 דקות") next to the counter would reduce abandonment at the entry point.

**Issue 2 — No back button on question 1**: Correct UX — there's nothing to go back to. But the "placeholder div" taking up 48px of space creates a visual gap. This could be used for a trust signal instead: a small "55 ביקורות גוגל ★★★★★" on question 1 to reinforce the decision to continue.

**Issue 3 — Lead gate (step 6) friction**: As noted in Recommendation #8 — three fields is too many. The gate introduces: Name, Email, Phone, Consent checkbox, submit button. For anonymous users this is the steepest part of the funnel. The text "מלא פרטים כדי לקבל את ההמלצה האישית שלך" doesn't adequately justify why providing a phone number is required to see a quiz result.

**Issue 4 — No explanation of what happens next after submitting**: The lead gate submit button says "גלה את ההמלצה שלי ←". There's no mention that the user will also receive an email with the free training. This is the actual value (email sequence with free training link) but it's not mentioned at the moment of form submission. Adding "ונשלח לך גישה להדרכה חינמית בת 90 דקות" below the submit button would dramatically increase perceived value of submitting.

**Issue 5 — Result page social proof is weak**: The result page shows "94 בעלות עסקים כבר השתתפו" (hard-coded at line 1095 in QuizClient.tsx) in tiny text after the testimonial section. This number (94) is much lower than the "3,500+" on the homepage and actually creates a credibility problem — if 3,500+ businesses have been helped, why have only 94 participated in this? This number should be updated or removed.

**Issue 6 — Dual CTA buttons on result page**: The result page shows two side-by-side buttons: primary (gold, full text CTA) and secondary (transparent border, "פרטים"). Both buttons navigate to `winner.href`. This means the secondary "פרטים" button is a UX dead-end — it goes to the same page as the primary CTA but looks like it should show more info inline. This creates confusion. The secondary button should either show a modal with product details, or be removed.

**Issue 7 — No email capture confirmation state**: After submitting the lead gate, the visitor is taken directly to the result page. There's no confirmation that they've registered or what they should expect in their inbox. A brief transition state ("תודה! שלחנו לך אימייל לכתובת...") would reduce anxiety and reduce "is this a scam?" doubts.

### Quiz Questions — Assessment

The 6 questions are well-calibrated:
1. Business stage (Q1)
2. Marketing block (Q2)
3. Content relationship (Q3)
4. Learning style (Q4)
5. Urgency (Q5)
6. Budget comfort (Q6)

The scoring matrix (SCORES) in QuizClient.tsx is sophisticated — each answer distributes points across all 7 product tiers weighted by relevance. This is clean architecture.

One structural concern: Q6 (budget) directly controls which tier the visitor lands on. A visitor who answers Q6-A ("מעדיף להתחיל חינם") will almost certainly be routed to `free_training` regardless of other answers. This is correct funnel logic, but it means budget-anxious visitors who could afford the challenge (₪197) are being pre-emptively downgraded. Consider weighting Q6 slightly less heavily, or add a secondary recommendation that shows "אפשר גם להתחיל כאן בפחות מ-₪200" on the free_training result page.

---

## Recommended Next Agent

**web-developer** — to implement the following changes in priority order:

1. **Remove dead credit link from footer** (`app/page.tsx`, footer section — delete the "יש לך זיכוי" `<div>`)
2. **Add trust micro-copy below hero CTA** (`app/page.tsx`, both mobile and desktop hero sections — add `"6 שאלות · 2 דקות · ללא כרטיס אשראי"` after the `<a href="/quiz">` CTA element)
3. **Replace bottom testimonials with outcome testimonials** (`app/page.tsx`, TESTIMONIALS const — swap in רועי מנדלמן, gal masas, tal barell from `data/reviews.ts`)
4. **Add quiz bridge CTA above ProductsSection** (`app/page.tsx`, add one-line link before `<ProductsSection />`)
5. **Update StatsSection stats** (`components/landing/StatsSection.tsx`, change "50,000 תכנים" → "97% ממליצים" and "80 תחומים" → "4 שנות ניסיון")
6. **Add Variant C to A/B test** (`lib/ab.ts` — add type, content, and update `parseVariant`; `middleware.ts` — assign 3-way split)
7. **Add review count to SocialProofStrip** (`components/SocialProofStrip.tsx` — add "· 55 ביקורות" next to the 5.0 score)
