/**
 * Commitment scoring for /apply ("3 ימי פתוחים") applications.
 *
 * Not a quality score - a SIGNAL of effort and will. Three axes:
 *   - depth (0-40):       how much they wrote across the 5 open questions
 *   - specificity (0-30): digits + sentence boundaries as proxy for concreteness
 *   - commitment (0-30):  Hebrew commitment-language hits
 *
 * Total 0-100. Computed server-side and stored on the row so future filtering /
 * ranking in the CRM is cheap.
 */

export const STAGE_OPEN_KEYS = ["idea", "stage", "stuck", "give", "why"] as const;

const COMMIT_WORDS = [
  "אעשה", "אשקיע", "להשקיע", "להגיע", "מחויבות", "מתחייב", "מתחייבת",
  "אני נחושה", "נחוש", "על הסף", "נדרש", "להעז", "ללכת",
  "אין לוותר", "אין דבר", "שעות", "מקדישה", "מסור", "רצינות",
] as const;

export interface ScoreBreakdown {
  depth:       number;
  specificity: number;
  commitment:  number;
  totalLen:    number;
  hits:        number;
}

export function scoreApplication(answers: Record<string, string>): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const full = STAGE_OPEN_KEYS.map((k) => String(answers[k] ?? "")).join(" ");

  const totalLen = full.trim().length;
  const depth    = Math.min(40, Math.round((totalLen / 900) * 40));

  const digits      = (full.match(/\d/g) || []).length;
  const sentences   = (full.match(/[.!?\n]/g) || []).length;
  const specificity = Math.min(15, digits * 2) + Math.min(15, sentences * 2);

  const hits       = COMMIT_WORDS.reduce((n, w) => (full.includes(w) ? n + 1 : n), 0);
  const commitment = Math.min(30, hits * 6);

  return {
    score: depth + specificity + commitment,
    breakdown: { depth, specificity, commitment, totalLen, hits },
  };
}
