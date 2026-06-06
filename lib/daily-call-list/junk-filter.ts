/**
 * Junk-signal filters.
 *
 * Source of the Lotam-incident (2026-06-06): the email recommended a lead
 * because her quiz scored 96% premium match and she had "12 events in 7 days".
 * In reality:
 *   - She'd filled the quiz 3 times in under 20 seconds each
 *   - Every quiz answer was the letter D
 *   - All her LINK_CLICKED events were on a /fonts/*.woff file
 *
 * The scoring math counted these. A human (or TrueSignal) would have
 * recognized them as noise. These filters codify that recognition.
 */

export type QuizRow = {
  user_id:             string;
  recommended_product: string;
  second_product:      string | null;
  match_percent:       number | null;
  answers:             Record<string, unknown>;
  created_at:          string;
};

export type EventRow = {
  user_id:    string;
  type:       string;
  metadata:   Record<string, unknown>;
  created_at: string;
};

// Static / non-product paths that should not count as engagement.
const ASSET_EXT_RE = /\.(css|js|woff|woff2|ttf|otf|eot|ico|png|jpe?g|svg|webp|gif|map|json|xml|txt|pdf)(\?|$)/i;
const NON_PRODUCT_PATH_RE = /^\/(?:api|_next|fonts?|static|images?|public|favicon|robots|sitemap)/i;

/**
 * Is this LINK_CLICKED metadata pointing at a real product page?
 * The link metadata shape can be `{ url: "..." }` or `{ href: "..." }`.
 */
export function isJunkLinkClick(metadata: Record<string, unknown>): boolean {
  const raw = (metadata.url ?? metadata.href ?? metadata.target ?? "") as string;
  if (!raw || typeof raw !== "string") return true;

  let path = raw;
  try {
    if (/^https?:\/\//i.test(raw)) path = new URL(raw).pathname;
  } catch {
    // fall through with raw
  }

  if (ASSET_EXT_RE.test(path))         return true;
  if (NON_PRODUCT_PATH_RE.test(path))  return true;
  return false;
}

/**
 * Is this PAGE_VIEW metadata for a real page?
 * Metadata shape: `{ page: "/path" }` from PageTracker.
 */
export function isJunkPageView(metadata: Record<string, unknown>): boolean {
  const page = (metadata.page ?? metadata.path ?? "") as string;
  if (!page || typeof page !== "string") return true;
  if (NON_PRODUCT_PATH_RE.test(page))   return true;
  if (ASSET_EXT_RE.test(page))          return true;
  return false;
}

/**
 * Detect a junk quiz row:
 *  - all answers the same letter ("D D D D D D") → speed-clicking
 *  - very short completion span between answers if available
 *
 * We can't see completion-time directly; the proxy is uniformity of answers.
 */
export function isJunkQuiz(q: QuizRow): boolean {
  const answers = q.answers ?? {};
  const values = Object.values(answers).filter(v => typeof v === "string") as string[];
  if (values.length === 0) return false; // can't judge; leave it

  // All answers identical
  const unique = new Set(values);
  if (values.length >= 3 && unique.size === 1) return true;

  return false;
}

/**
 * For a user with multiple quiz submissions: keep only the latest non-junk one.
 * If all quizzes in the recent set are junk, return null.
 *
 * Also flags as junk when the user submitted >= 3 quizzes within 6 hours
 * (clear sign of poking at the result, not deciding).
 */
export function selectBestQuiz(quizzes: QuizRow[]): { quiz: QuizRow | null; multipleSubmissionsFlag: boolean } {
  if (quizzes.length === 0) return { quiz: null, multipleSubmissionsFlag: false };

  // Sort newest first
  const sorted = [...quizzes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Flag: 3+ quizzes within a 6h window
  let multipleSubmissionsFlag = false;
  if (sorted.length >= 3) {
    const newest = new Date(sorted[0]!.created_at).getTime();
    const third  = new Date(sorted[2]!.created_at).getTime();
    if (newest - third < 6 * 60 * 60 * 1000) multipleSubmissionsFlag = true;
  }

  const nonJunk = sorted.find(q => !isJunkQuiz(q));
  return { quiz: nonJunk ?? null, multipleSubmissionsFlag };
}

/**
 * Filter out junk events. Returns the cleaned list + count of how many junk
 * events were dropped (useful for the brief context: "11 of her 12 events
 * were noise — call with caution").
 */
export function cleanEvents(events: EventRow[]): { cleaned: EventRow[]; junkCount: number } {
  let junk = 0;
  const cleaned = events.filter(e => {
    if (e.type === "LINK_CLICKED" && isJunkLinkClick(e.metadata ?? {})) { junk++; return false; }
    if (e.type === "PAGE_VIEW"    && isJunkPageView(e.metadata  ?? {})) { junk++; return false; }
    return true;
  });
  return { cleaned, junkCount: junk };
}
