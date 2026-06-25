/**
 * B2 — soft, confidence-gated "refine with Hadar" suggestion.
 *
 * The engine SUGGESTS, it does not impose. There is no "draft" verdict stamped
 * on the person or the signal. When (and only when) the maturity read is a
 * HIGH-CONFIDENCE "raw", the result page shows ONE gentle, optional invitation
 * to refine the signal with Hadar before publishing it. Everyone else — mature,
 * transitional, uncertain, or low-confidence — gets the full final result with
 * no extra framing.
 *
 * Why this shape (per the agreed risk-reduction): the human/engine disagreements
 * in validation were all on the borderline middle. Gating on confidence + acting
 * only on a clear "raw" removes that error zone. And because it is a soft,
 * ignorable suggestion (never blocks, never changes price, never labels the
 * person), a misread costs almost nothing in either direction.
 *
 * Master switch is OFF until Hadar validates ~20 reads + a canary pass. Flip with
 * SIGNAL_FRAMING_ENABLED=true — one env switch, no logic redeploy.
 */
import type { RoutingSignal } from "@/lib/prompts/signal-engine";
import { validateRoutingSignal } from "@/lib/prompts/signal-engine";

// ON by default (the new design, per owner decision). Kill-switch: set
// SIGNAL_FRAMING_ENABLED=false in env to instantly disable the maturity-driven
// framing (draft stamp + soft refine suggestion) without a redeploy. The crisis
// floor is a SEPARATE, still-unbuilt layer — this flag does not touch it.
export const SIGNAL_FRAMING_ENABLED = process.env.SIGNAL_FRAMING_ENABLED !== "false";

// Only act on confident reads — the borderline middle (where engine and human
// disagreed in validation) stays at the safe default.
const REFINE_MIN_CONFIDENCE = 0.7;

export interface Framing {
  // true → show ONE soft, optional "refine with Hadar before you publish"
  // invitation. false (default) → full final result, no extra framing.
  suggestRefine: boolean;
}

export const NO_FRAMING: Framing = { suggestRefine: false };

export function determineFraming(routingSignal: RoutingSignal | unknown): Framing {
  // Flag off → never suggest. This keeps the whole layer inert until validated.
  if (!SIGNAL_FRAMING_ENABLED) return NO_FRAMING;
  if (!validateRoutingSignal(routingSignal)) return NO_FRAMING;

  const suggestRefine =
    routingSignal.signal_maturity === "raw" &&
    routingSignal.confidence >= REFINE_MIN_CONFIDENCE;

  return { suggestRefine };
}
