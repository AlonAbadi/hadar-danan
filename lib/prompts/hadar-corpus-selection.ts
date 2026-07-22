/**
 * Runtime corpus quote selection — per-customer sampling with same-domain
 * filtering.
 *
 * Two rules from Alon 2026-07-10:
 *
 * 1. Same-domain filter. If the customer is a lawyer, don't feed the model
 *    quotes from Hadar's shoot with a lawyer client. Forces cross-domain
 *    pattern extraction (the whole point of Move #3, and useful discipline
 *    for every move). Prevents the model from lazily copying a same-industry
 *    exemplar with names swapped.
 *
 * 2. Per-customer sampling. Two customers in the same archetype should NOT
 *    see the same top-5 quotes in the model's prompt. We deterministically
 *    shuffle by extractionId so the same customer sees a stable prompt across
 *    retries, but different customers see different sample sets. Effect:
 *    varied hooks/bodies across the paying user base.
 *
 * Also emits the same INJECTED_QUOTES text format sync-hadar-corpus produces,
 * so drop-in token replacement in HADAR_SIGNATURE_MOVES stays identical.
 */
import { CORPUS_QUOTES_BY_MOVE, type CorpusQuote } from "./hadar-corpus-quotes";

const MAX_QUOTES_PER_MOVE = 5;

const MOVE_NAMES: Record<number, string> = {
  1:  "External→Internal Translation",
  2:  "Service Reframe",
  3:  "אני אקביל לך Parable-Building",
  4:  "Tangible Metaphor Anchor",
  5:  "Sold-Inversion",
  6:  "Self-as-Example",
  7:  "Projective Embodiment",
  8:  "Anti-Flattery",
  9:  "Sensory-to-Business Translation",
  10: "Process-as-Proof",
  11: "Receptive Embodiment",
  12: "Specificity-as-Service",
  13: "Silent Authority Positioning",
  14: "Category-Rename / Reclaim",
  15: "Diagnostic-Framework Reveal",
};

// ── Domain mapping ────────────────────────────────────────────────────
// Loose keyword mapping. `domainOfSource` extracts the domain from a corpus
// C-tag; `domainOfOccupation` extracts it from a customer's free-text
// occupation. When they match, that quote is filtered out of the sample.
//
// The tags below match the naming convention used in HADAR_RAW_QUOTES.md and
// the deep-read filenames — extending this map is safe (unknown → null =
// no filter, quote stays available).
const DOMAIN_BY_SOURCE_SLUG: Record<string, string | null> = {
  "dana-lawyer":         "legal",
  "avraham-vatiner":     "real-estate",
  "avraham":             "wedding-events",   // wedding-band, distinct from real-estate
  "nogatin":             "catering",
  "hila-uri-lev":        "couples-therapy",
  "toko-aroma":          "sensory-scent",
  "mirvi-inbar":         "coaching",
  "sheli":               "coaching",
  "eviatar":             "handcraft",        // furniture / woodwork
  "orian":               null,               // domain unknown until content read
  "amirim":              "industrial-design",
  "tzilum-hadar2":       null,               // Hadar herself
  "ben-yair":            "coaching",
  "hadar-etgar":         null,
  "hadar-lesson-1":      null,
  "michael-kadosh":      null,
};

const DOMAIN_KEYWORDS: [string, string[]][] = [
  ["legal",             ["עורך דין", "עורכת דין", "עו״ד", "עו\"ד", "משפט"]],
  ["real-estate",       ["מתווך", "נדל\"ן", "נדלן", "נדל״ן"]],
  ["wedding-events",    ["חתונ", "אירוע", "להקה", "די ג'יי", "diskin"]],
  ["catering",          ["קייטרינג", "אוכל", "בישול"]],
  ["couples-therapy",   ["זוגי", "טיפול זוגי", "מטפל", "מטפלת"]],
  ["sensory-scent",     ["ריח", "פרפיומריה", "נר"]],
  ["coaching",          ["מאמן", "מאמנת", "יועץ", "יועצת", "אימון"]],
  ["handcraft",         ["רהיטים", "נגר", "יד עבודה", "כלים"]],
  ["industrial-design", ["עיצוב תעשייתי", "מעצב"]],
  ["cognitive-b2b",     ["אסטרטגי", "מנטור", "עסקי"]],
];

export function domainOfSource(source: string): string | null {
  const s = source.toLowerCase();
  for (const [slug, domain] of Object.entries(DOMAIN_BY_SOURCE_SLUG)) {
    if (s.includes(slug)) return domain;
  }
  return null;
}

export function domainOfOccupation(occupation: string | null | undefined): string | null {
  if (!occupation) return null;
  const s = occupation;
  for (const [domain, keywords] of DOMAIN_KEYWORDS) {
    for (const kw of keywords) if (s.includes(kw)) return domain;
  }
  return null;
}

// ── Deterministic hash → sample ordering ──────────────────────────────
// FNV-1a over (extractionId + move + index) gives a stable but varying
// ranking of each move's quotes per customer. Different customer → different
// hash → different top-5 selection.
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h;
}

function shuffleByHash<T>(items: T[], seed: string): T[] {
  return items
    .map((item, i) => ({ item, rank: fnv1a(`${seed}:${i}`) }))
    .sort((a, b) => a.rank - b.rank)
    .map((x) => x.item);
}

// ── The builder ───────────────────────────────────────────────────────
export interface CustomerCorpusCtx {
  extractionId: string;
  occupation:   string | null | undefined;
  // 2026-07-22 Alon: rotate the quote sample per video too, not just per
  // customer. Different videos in the same season see different subsets, so
  // the model has genuinely different raw material — a mechanical way to
  // reduce cross-video similarity in output. When absent (Phase 1/2 packs)
  // the shuffle falls back to per-customer behavior.
  videoNumber?: number | null;
}

/**
 * Returns the `INJECTED_QUOTES` string tuned for a specific customer.
 * Format is byte-identical to the sync-hadar-corpus output, so the string
 * drops in wherever `__CUSTOMER_INJECTED_QUOTES__` appears in a system
 * prompt.
 */
export function buildInjectedQuotesForCustomer(ctx: CustomerCorpusCtx): string {
  const customerDomain = domainOfOccupation(ctx.occupation);

  const lines: string[] = [
    "בלוק לימוד פנימי — לא לפלט. אלה תבניות מהקול של הדר, לא ציטוטים לשימוש.",
    "",
    "הכלל הברזל: אסור להשתמש באף אחד מהמשפטים למטה verbatim בפלט של הלקוח/ה. אסור להשתמש בחמש מילים רצופות מכל משפט למטה. הפלט הוא של הלקוח/ה — בעולם שלו/ה, בשפה שלו/ה, עם הדוגמאות שלו/ה.",
    "",
    "מה כן לעשות: לקרוא כל משפט, לחלץ את המנגנון הרטורי (המבנה הקצבי, מהלך המחשבה, סוג המטפורה, נקודת ההיפוך). לזרוק את המילים. לכתוב מחדש מהיסוד עם החומר של הלקוח/ה. אם אני מזהה שהוצאת משפט של הדר עם שמות הוחלפו — פסלתי את הפלט.",
    "",
    "הדוגמאות פר מהלך:",
    "",
  ];

  const orderedMoves = Object.keys(CORPUS_QUOTES_BY_MOVE)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);

  for (const n of orderedMoves) {
    const moveName = MOVE_NAMES[n] || `Move ${n}`;
    const all      = CORPUS_QUOTES_BY_MOVE[n] || [];

    // 1) Same-domain filter — if we can identify both customer's and quote's
    //    domain and they match, drop the quote (unless it would empty the
    //    move entirely, in which case we keep the least-tainted subset).
    const crossDomain = customerDomain
      ? all.filter((q: CorpusQuote) => domainOfSource(q.source) !== customerDomain)
      : all;
    const pool = crossDomain.length > 0 ? crossDomain : all;

    // 2) Per-customer shuffle — deterministic by extractionId + move number.
    // If videoNumber is present, folds it in so each video sees a different
    // subset while the sampling stays deterministic per (customer, move,
    // video).
    const seedTail = ctx.videoNumber != null ? `:v${ctx.videoNumber}` : "";
    const shuffled = shuffleByHash(pool, `${ctx.extractionId}:${n}${seedTail}`);
    const picks    = shuffled.slice(0, MAX_QUOTES_PER_MOVE);
    if (picks.length === 0) continue;

    lines.push(`מהלך #${n} — ${moveName}:`);
    for (const q of picks) {
      const clean = q.quote.replace(/`/g, "'");
      lines.push(`  - "${clean}"`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * The placeholder token that appears in every SYSTEM prompt where the
 * pre-baked `${INJECTED_QUOTES}` used to be substituted. Route handlers call
 * `personalizeSystemPrompt(SYSTEM, ctx)` before sending to Claude.
 */
export const INJECTED_QUOTES_TOKEN = "__CUSTOMER_INJECTED_QUOTES__";

/**
 * One-liner every shoot-day route uses instead of feeding the static SYSTEM
 * constant directly to Anthropic. Replaces the token with the customer's
 * personalized quote sample; if the token isn't present (older prompts that
 * pre-date this refactor) the prompt passes through untouched.
 */
export function personalizeSystemPrompt(systemPrompt: string, ctx: CustomerCorpusCtx): string {
  if (!systemPrompt.includes(INJECTED_QUOTES_TOKEN)) return systemPrompt;
  return systemPrompt.replace(INJECTED_QUOTES_TOKEN, buildInjectedQuotesForCustomer(ctx));
}
