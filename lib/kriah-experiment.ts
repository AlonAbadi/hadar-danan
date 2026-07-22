/**
 * kriah funnel A/B — customer-journey experiment (client-safe, no imports).
 *
 * control = the current flow (S2→S3→S4→S6→S7→S8-email→Q1…).
 * variant = S4 cut (feeds nothing), S6+S7 merged into one screen, and the email
 *           moved from before the questions to right AFTER the first open answer.
 *
 * Assignment is STICKY: a 60-day cookie locks a visitor to one arm so it can
 * never change across the 8 screens, a refresh, or a return visit. The kill
 * switch (`active:false`) forces everyone to control instantly and reversibly.
 */
export type KriahArm = "control" | "variant";

export const KRIAH_EXP = {
  id: "kriah_flow_v1",
  active: true, // ← kill switch: set false to send everyone to control
  variantShare: 0.5, // fraction assigned to variant (0..1)
} as const;

const COOKIE = "kriah_arm";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(name + "="))?.split("=")[1];
}

/** Resolve the visitor's arm once and lock it in a cookie. Idempotent. */
export function resolveKriahArm(): KriahArm {
  if (!KRIAH_EXP.active) return "control";
  const existing = readCookie(COOKIE);
  if (existing === "control" || existing === "variant") return existing;
  const arm: KriahArm = Math.random() < KRIAH_EXP.variantShare ? "variant" : "control";
  try {
    document.cookie = `${COOKIE}=${arm}; path=/; max-age=${60 * 60 * 24 * 60}; SameSite=Lax`;
  } catch {
    /* cookie write must never break the funnel */
  }
  return arm;
}
