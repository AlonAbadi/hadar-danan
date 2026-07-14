/**
 * /kriah v2 — key 2 of the two-key routing gate: ability-to-pay evidence.
 *
 * Canonical formula from BUILD_SPEC_KRIAH_V2_AUDIT §ג (approved):
 *  - LLM extracts structured commercial evidence from the six answers
 *    (temp 0, JSON). has_paying_clients becomes a deterministic bucket
 *    {0, 0.5, 1} derived from the quote field, never a raw float.
 *  - Regex boosters are FALLBACK-ONLY (fire only when the LLM missed the
 *    signal) — week 1 they are logged as shadow columns and NOT scored.
 *  - Depth is a confidence modifier normalized per answered question;
 *    a skipped Q4 is never penalized. Distress halves everything.
 *  - Hard cap at 1.0. Guaranteed evidence ∈ [0, 1].
 *
 * Routing (the truth table) lives in routeV2Ending below:
 *  crisisFloor → key-1 presence → truth table → phone gate.
 *  Week-1 simplifications (Alon's decision 6): static 0.72 threshold, no
 *  live capacity counter, expected volume ~4-5/week.
 */

import Anthropic from "@anthropic-ai/sdk";

export const EVIDENCE_MODEL = "claude-sonnet-4-6";
const EVIDENCE_MAX_TOKENS = 600;

export interface LlmEvidence {
  has_paying_clients:     number;        // 0-1 from model; bucketed downstream
  paying_clients_quote:   string | null; // verbatim positive quote or null
  price_points_mentioned: boolean;
  years_in_business:      number | null;
  team_size:              number | null;
  distress_money:         boolean;
  distress_quote:         string | null;
}

const EVIDENCE_SYSTEM = `אתה מחלץ ראיות מסחריות מתשובות טקסט חופשי בעברית. החזר JSON בלבד, ללא טקסט נוסף.

כללים:
- has_paying_clients (0.0-1.0): ראיה ללקוחות משלמים קיימים. דורש אזכור חיובי ממשי. paying_clients_quote חייב להיות ציטוט מילולי חיובי מהתשובות, או null אם אין.
- price_points_mentioned: true רק אם מוזכרים מחירים/סכומים/מחזור במסגרת חיובית.
- years_in_business: מספר שנות ותק בעסק אם נאמר במפורש (לא ותק כשכיר/ה), אחרת null. אל תבצע חשבון שנים בעצמך, החזר את המספר כפי שנכתב.
- team_size: מספר עובדים/אנשי צוות אם נאמר, אחרת null.
- כסף במסגרת-חוסר ("אין כסף", "בקושי סוגרת", "אין לקוחות") → distress_money=true עם distress_quote, וזו איננה ראיה חיובית.
- שאיפה עתידית ("אני רוצה להגיע ל...") אינה ראיה.

פורמט:
{"has_paying_clients":0.0,"paying_clients_quote":null,"price_points_mentioned":false,"years_in_business":null,"team_size":null,"distress_money":false,"distress_quote":null}`;

// Fallback-only regexes (AUDIT §ג: fire only when the LLM missed the signal).
// Week 1: logged as shadow columns, NOT added to the score.
const STAFF_RE = /(יש לי עסק|צוות|\d+\s*עובד(ים|ות))/;
const STAFF_NEG_RE = /לא עובד/;
const MONEY_RE = /(₪|ש"ח|שקל|אלף|מחזור|הכנסה)/;
const MONEY_NEG_RE = /(אין|בלי|חסר)[^.]{0,20}(₪|ש"ח|שקל|אלף|מחזור|הכנסה|כסף)/;

export interface EvidenceResult {
  llm:          LlmEvidence | null;
  evidence:     number;        // final score ∈ [0,1]; 0 when llm is null
  regex_staff:  boolean;       // shadow only
  regex_money:  boolean;       // shadow only
  distress:     boolean;
}

export async function extractEvidence(
  answers: Record<string, string | undefined>,
  answeredCount: number,
  totalChars: number,
): Promise<EvidenceResult> {
  const text = Object.values(answers).filter(Boolean).join("\n\n");
  const regex_staff = STAFF_RE.test(text) && !STAFF_NEG_RE.test(text);
  const regex_money = MONEY_RE.test(text) && !MONEY_NEG_RE.test(text);

  let llm: LlmEvidence | null = null;
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model:       EVIDENCE_MODEL,
      max_tokens:  EVIDENCE_MAX_TOKENS,
      temperature: 0,
      system:      EVIDENCE_SYSTEM,
      messages: [{
        role: "user",
        content: `התשובות (${answeredCount} מתוך 6 שאלות נענו):\n\n${text}\n\nהחזר JSON בלבד.`,
      }],
    });
    const raw = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    const jsonStart = raw.indexOf("{");
    const jsonEnd   = raw.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as Partial<LlmEvidence>;
      llm = {
        has_paying_clients:     typeof parsed.has_paying_clients === "number" ? parsed.has_paying_clients : 0,
        paying_clients_quote:   typeof parsed.paying_clients_quote === "string" && parsed.paying_clients_quote.trim() ? parsed.paying_clients_quote : null,
        price_points_mentioned: parsed.price_points_mentioned === true,
        years_in_business:      typeof parsed.years_in_business === "number" ? parsed.years_in_business : null,
        team_size:              typeof parsed.team_size === "number" ? parsed.team_size : null,
        distress_money:         parsed.distress_money === true,
        distress_quote:         typeof parsed.distress_quote === "string" && parsed.distress_quote.trim() ? parsed.distress_quote : null,
      };
    }
  } catch {
    // Evidence extraction is best-effort: a failure degrades to evidence=0
    // (cell B/C routing) — never blocks the user's reading.
  }

  if (!llm) {
    return { llm: null, evidence: 0, regex_staff, regex_money, distress: false };
  }

  // hpc: deterministic bucket from the quote, not the raw float.
  const hpc = llm.paying_clients_quote ? 1.0 : (llm.has_paying_clients >= 0.5 ? 0.5 : 0.0);
  const years = Math.min(Math.max(llm.years_in_business ?? 0, 0), 40);
  const team  = llm.team_size ?? 0;

  let raw =
    0.45 * hpc +
    0.20 * (llm.price_points_mentioned ? 1 : 0) +
    0.20 * Math.min(years / 3, 1) +
    0.15 * Math.min(team / 2, 1);
  raw = Math.min(raw, 1.0);

  // Depth: confidence modifier, normalized per answered question so a
  // skipped Q4 is never a penalty. 90 chars/answer is the calibrated floor.
  const depthConf = totalChars < 90 * Math.max(answeredCount, 1) ? 0.85 : 1.0;
  const evidence = raw * depthConf * (llm.distress_money ? 0.5 : 1.0);

  return { llm, evidence, regex_staff, regex_money, distress: llm.distress_money };
}

export type V2Ending = "concierge" | "hive" | "pre_revenue" | "crisis_soft";

/**
 * The truth table (AUDIT §ג). Decision order is mandatory:
 * crisis → key-1 presence → table → phone gate.
 *
 *  A) ESTABLISHED (key1 C/D) + phone → concierge (worth a personal WhatsApp)
 *  B) ESTABLISHED + no phone         → hive (unreachable, can't promise contact)
 *  C) EARLY (key1 A/B)               → hive (₪590 by day-2 email)
 *  D) veteran tenure ≥7y (A/B)       → hive + flag (weekly re-scan)
 *  Pre-revenue: declared A + evidence<0.3 → gift-only.
 *
 * NOTE (2026-07-14): concierge routes on the SELF-DECLARED business stage
 * (key1) + reachability, NOT on evidence_score. The identity-first
 * questionnaire asks about gift/story, not revenue, so the LLM evidence read is
 * ~0 for nearly everyone and concierge never fired (0/148). key1 is a reliable
 * self-report; an established business that left a phone is meeting-worthy.
 */
export function routeV2Ending(opts: {
  crisis:        boolean;
  key1:          "A" | "B" | "C" | "D" | null;
  evidence:      number;
  years:         number;
  phoneGiven:    boolean;
}): { ending: V2Ending; cell: string } {
  const { crisis, key1, evidence, years, phoneGiven } = opts;

  if (crisis) return { ending: "crisis_soft", cell: "crisis" };

  // No key-1 (abandoned mid-flow / legacy) → never promote commercially.
  if (!key1) return { ending: "hive", cell: "no_key1" };

  const high = key1 === "C" || key1 === "D";

  if (key1 === "A" && evidence < 0.3) return { ending: "pre_revenue", cell: "pre_revenue" };

  // Established business (C/D) is the premium-fit stage. Phone is a hard gate
  // for the concierge PROMISE — an unreachable lead is a broken promise, so
  // without a phone they go to the warm (hive) queue instead.
  if (high) {
    return phoneGiven
      ? { ending: "concierge", cell: "established_reachable" }
      : { ending: "hive", cell: "established_no_phone" };
  }

  // Veteran override: extracted tenure ≥7y beats a modest self-declaration —
  // a self-deprecating veteran must not fall into the ₪590 anchor unseen.
  if (years >= 7) return { ending: "hive", cell: "veteran_flag" };

  return { ending: "hive", cell: "early_stage" };
}
