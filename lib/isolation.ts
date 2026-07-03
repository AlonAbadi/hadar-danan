/**
 * v2 isolation contract helpers (BUILD_SPEC_KRIAH_V2 §1 + AUDIT §א).
 *
 * Everything /kriah writes during testing is stamped is_test:true, and every
 * real-world side effect (email, WhatsApp, Cardcom, Meta CAPI, admin alerts,
 * Hadar's queues) must pass through one of these gates. All gates are inert
 * for live traffic: is_test defaults to false on every existing row.
 */

/** Emails allowed to RECEIVE real sends during is_test runs (testers). */
const TEST_EMAIL_ALLOWLIST = new Set(
  (process.env.TEST_EMAIL_ALLOWLIST ?? "alonabadi9@gmail.com,hadard1113@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

/** True → suppress the send. Allowlisted testers still get real emails. */
export function suppressTestEmail(isTest: unknown, email: string | null | undefined): boolean {
  if (isTest !== true) return false;
  return !TEST_EMAIL_ALLOWLIST.has((email ?? "").toLowerCase());
}

/** The kill-switch flag for the /kriah funnel itself. */
export function unifiedFunnelEnabled(): boolean {
  return process.env.UNIFIED_FUNNEL_ENABLED === "true";
}

/**
 * Preview-secret check: lets a real mobile device test /kriah while the flag
 * is off, without exposing the funnel. Accepts the secret via header, query
 * param, or cookie value.
 */
export function kriahPreviewAllowed(provided: string | null | undefined): boolean {
  const secret = process.env.KRIAH_PREVIEW_SECRET;
  if (!secret) return false;
  return provided === secret;
}
