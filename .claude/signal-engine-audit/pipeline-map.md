# Signal Engine — Pipeline Map (Step 1 output)

**Audit goal:** Improve recommendation logic in `/signal` to maximize signal → deal conversion.
**Constraint:** No conversion data yet — reasoning-based optimization only.
**Target metric:** Recommendation → paid product purchase or qualified booking.

---

## 1. Pre-question intro/instructions
**File:** [app/signal/SignalClient.tsx:317-381](../../app/signal/SignalClient.tsx#L317-L381) (Intro component)

- Heading: "מנוע האות"
- Sub-headline: "חמש שאלות. אות מותגי אחד."
- Further sub: "לא מה שאתם מוכרים, אלא מה שרק אתם יכולים לתת."
- Pre-question guidance (line 354): "כעשר דקות. כתיבה או הקלטה בקול. שאלה 3 על תקופה קשה, מותר לדלג. הטיוטה נשמרת."
- Post-answers promise (line 358): "בסוף נשאר אצלך משפט אחד להגיד בקול בלי להתנצל, הקהל שמחפש בדיוק אותך, ושלושה כיווני תוכן להתחיל מהם בלי לחכות."

## 2. The 5 questions
**File:** [lib/prompts/signal-engine.ts:11-37](../../lib/prompts/signal-engine.ts#L11-L37)

| # | Key | Label | Hint |
|---|-----|-------|------|
| 1 | flow_zone | "רגע שבו שכחת מהזמן" | "מתי לאחרונה היית בעשייה ולא הרגשת איך הזמן חלף. תאר/י את הסיטואציה ומה עשית בה." |
| 2 | effortless_mastery | "מה קל לך עד שקשה להסביר איך" | "הדבר שכל כך טבעי לך, עד שאתה/את כבר לא רואה אותו ככישרון - אתה/את פשוט עושה אותו" |
| 3 | hard_period | "תקופה קשה ומה היא לימדה אותך" | "אפשר לדלג או לכתוב רק את מה שמרגיש בסדר לחלוק. אין כאן רשות לחקור כאב שאתה/את לא רוצה/ה להעלות." |
| 4 | what_helped | "מה עזר לך לצאת מזה, מה פיתחת בעצמך" | "כלי, גישה, הרגל, שאלה שהפכה למפתח. דברים שלמדת לא מספר, אלא חיית אותם." |
| 5 | message_to_past | "מה היית אומר/ת למי שנמצא היום איפה שהיית" | "פנייה ישירה. מה הוא חייב לדעת, מה הוא חייב להפסיק לעשות, ולאן ללכת קודם." |

Q3 explicitly skippable. No character limits in the question definitions.

## 3. Input mechanism
**File:** [app/signal/SignalClient.tsx:439-474](../../app/signal/SignalClient.tsx#L439-L474)

- Voice OR text (VoiceInput component + textarea)
- Soft client minimum `MIN_CHARS = 40` per question (line 40); Q3 exempt (line 126)
- Counter when below: "עוד {N} תווים לפחות" + "{len} / 40+"
- Advance button disabled below threshold (line 130)
- Placeholder: "או הקלד/י כאן — בלי לערוך, כפי שאתה/את מדבר/ת."
- Server validation stricter floor: 3+ answers with 8+ chars each (route.ts:286-290)

## 4. LLM extraction system prompt
**File:** [lib/prompts/signal-engine.ts:55-148](../../lib/prompts/signal-engine.ts#L55-L148)

- **Model:** claude-sonnet-4-6
- **Max tokens:** 1600
- **Length:** ~94 lines Hebrew instructions, 4 core principles + 5 writing principles + output rules
- **Key directives:**
  - Pain as *ground* (where growth comes from), not identity
  - Element = talent × passion intersection
  - Signal = pain + element in one sentence
  - Output Hebrew only, no markdown, no em dashes, no emoji
  - All fields (except public_card_statement) in second person (אתה/את)
  - Cannot mention the extraction process
  - Gender-aware grammar (passed via route.ts:166-175)

## 5. Output schema (LLM signal)
**File:** [lib/prompts/signal-engine.ts:43-53](../../lib/prompts/signal-engine.ts#L43-L53)

| Field | Represents |
|-------|------------|
| `pain_source` | Ground the user grew from (קרקע) |
| `element` | Talent × passion zone (האלמנט) |
| `signal` | One-sentence summary: pain + element = unique offer |
| `signal_promise` | Forward-pointing potential, not yet seen |
| `central_tool` | Practice/method developed through the difficulty |
| `people` | Audience as "where you were" — not demographics |
| `content_directions` | 3 concrete content angles |
| `warm_note` | Personal closing + flag if any answer was thin |
| `public_card_statement` | ≤110 chars, written to user's audience for shareable PNG card |

## 6. Bucket router
**File:** [lib/signal/score.ts](../../lib/signal/score.ts)

Rules-based, deterministic. Inputs: answers, occupation, userStatus, hiveActive. Priority order:

1. `userStatus IN ['buyer','booked']` AND `!hiveActive` → **hive** (retention)
2. `founderHint && depth ≥ 480 && commitHits ≥ 2` → **strategy**
3. `depth < 80` → **none**
4. Default → **challenge**

**Constants:**
- `STRATEGY_MIN_DEPTH = 480`
- `STRATEGY_MIN_COMMIT_HITS = 2`
- `TOO_SHALLOW_MAX_DEPTH = 80`
- `COMMIT_WORDS` lexicon — kept in sync with `/apply` deliberately
- `FOUNDER_HINTS` regex array on occupation

**Critical observation:** Bucket decision does NOT use any of the 7 LLM signal fields. Rules-only, on raw input answers + metadata.

## 7. Offer presentation per bucket
**File:** [app/signal/SignalClient.tsx:1291-1717](../../app/signal/SignalClient.tsx#L1291-L1717)

### Bridge (lines 1291-1331)
Gender-aware opener + bucket-specific tail:
- challenge → "שבעה ימים, וזה הופך לתוכן."
- strategy → "פנים אל פנים, על העסק שלך."
- hive → "מקום שממשיכים לעבוד בו עליו."
- none → omitted

### NONE (lines 1350-1363)
"האות שלך נשמר. תוכלו לחזור אליו בכל רגע." — NO CTA, NO LINK, NO OFFER.

### CHALLENGE (lines 1552-1612) — default
- Header: "אתגר 7 הימים" / Price: ₪197 (anchor ₪297)
- Headline: "7 ימים, 7 סרטונים שמייצרים מכירות"
- 5 bullets, stats "3,500+ / 7 / 97%"
- CTA: "להצטרף לאתגר ←" → `/challenge`
- Refund guarantee, upsell ladder hint to ₪1,080 workshop

### STRATEGY (lines 1614-1675)
- Header: "פגישת אסטרטגיה" / Price: ₪4,000
- Headline: "90 דקות מולי. בהירות מלאה לאן הולכים."
- 5 bullets, stats "90 / 500+ / 4"
- CTA: "לקבוע פגישת אסטרטגיה ←" → `/strategy/book`
- Second-meeting guarantee, upsell ladder to ₪14,000 premium

### HIVE (lines 1677-1717) — existing customers only
- Header: "הכוורת" / Price: ₪97/mo
- Headline: "האות נשאר חי בקהילה."
- 4 bullets, no stats
- CTA: "להצטרף לכוורת ←" → `/hive`
- No guarantee, no upsell ladder

## Side effects on extraction
**File:** [app/api/signal/extract/route.ts:403-450](../../app/api/signal/extract/route.ts#L403-L450)

- Fires `SIGNAL_EXTRACTED` event
- Enqueues `signal_welcome` email (template_key, 0h delay)
- Signal returned regardless of job-queue success (soft-fail)
- No bucket-dependent side effects beyond what's shown to the user

---

## 5 Tensions identified (from map alone)

1. **Soul questions, commerce router.** 5 questions extract spiritual signal; router scores depth + lexicon. 7-field LLM signal goes unused by the router.
2. **4 buckets for 7 products.** Workshop (₪1,080), course (₪1,800), premium (₪14k), partnership (₪10-30k/mo) never routed to.
3. **`none` is a dead-end.** No CTA, no warm next-step. User just gave 10 min, gets sent home.
4. **No qualification upstream — only downstream inference.** Nothing about budget, urgency, business stage. Router has to *guess* from answer text.
5. **Intro promises artifacts, not transformation.** Pivot to commercial offer feels like bait-and-switch when reveal happens.

---

## Step 2 — Audit plan (5 parallel agents)

| Agent | Mandate | Slice of map |
|---|---|---|
| `lead-fit-qualifier` (custom) | Are the 5 questions + LLM prompt extracting conversion-predictive signals or vanity signals? What's the smallest upstream change to qualify without breaking magic? | §1, §2, §4 |
| `offer-routing-strategist` (custom) | Are the 4 buckets + thresholds the right design? Should the LLM 7-field output drive routing? "none" bucket redesign. Up/down-routing rules. | §6, §7 |
| `creative-director` | Intro + questions — is the framing pulling the right answers for conversion, or only for self-discovery? Brand-voice integrity if we change framing. | §1, §2 |
| `claude-api` | LLM prompt structure & output schema — should it output a commercial fit signal (bucket recommendation, confidence, missing data)? Prompt-level change spec. | §4, §5 |
| `yahav-marketing:page-cro` | The 4 offer cards (especially `none`) — is the reveal moment believable? Specific copy + CTA changes per bucket. | §7 |

Run in parallel. Synthesize findings. Prioritize fixes by leverage + reversibility. Then ship Step 5 (user-facing improvements) starting with highest-leverage layer.
