/**
 * Gap detection pipeline (מנוע הפער) — INTERNAL ONLY, abstention-first.
 *
 * Orchestrates the multi-stage detector from SIGNAL_GAP_SOLUTION.md:
 *   Stage 0  crisis floor (deterministic, validated 3/3 recall / 0 FP)
 *   Stage A  per-answer tagging (concreteness / separatedness / tense / vantage)
 *   Stage B  seam Q3↔Q5 — k samples × 3 independent framings (incl. adversarial)
 *   Stage C  fusion (ערבוב)
 *   Stage D  aggregate → agreement-based raw signals (no LLM)
 *   Stage E  calibrated gate + abstention (conservative v1 thresholds)
 *   Stage F  constrained generation (only if gate opens) — threshold + crossing
 *   Stage G  quote-or-discard verifier (deterministic restoration check)
 *
 * Every ambiguity resolves toward ABSTAIN. A missing gap costs nothing; a wrong
 * one costs a person. Never renders to a user in this phase.
 *
 * Requires the Anthropic API (runs on Vercel, not in the sandbox). Soft-fails to
 * an abstain result on any error.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  GAP_ENGINE_VERSION, GAP_MODEL, crisisFloor,
  STAGE_A_SYSTEM, stageAUser, STAGE_B_SYSTEM, stageBUser,
  STAGE_C_SYSTEM, stageCUser, STAGE_F_SYSTEM, stageFUser,
  type GapResult, type GapSeam, type GapEvidenceBinding,
} from "@/lib/prompts/gap-engine";

const SIGNAL_QUESTION_LABELS: Record<string, string> = {
  flow_zone:          "רגע שבו שכחת מהזמן",
  effortless_mastery: "מה קל לך עד שקשה להסביר איך",
  hard_period:        "תקופה קשה ומה היא לימדה",
  what_helped:        "מה עזר לך לצאת מזה / מה פיתחת",
  message_to_past:    "מה היית אומר/ת למי שנמצא היום איפה שהיית",
};

// Tuning — conservative by design. Widen only with human-validation evidence.
const SEAM_SAMPLES   = 3;   // k samples per framing
const EMIT_AGREEMENT = 0.7; // fraction of seam judgments that must agree to emit a gap
const EMIT_MIN_CONF  = 0.62;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractJson(text: string): any | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) { try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; } } }
  }
  return null;
}

async function ask(client: Anthropic, system: string, user: string, temperature: number, maxTokens = 400): Promise<unknown | null> {
  try {
    const r = await client.messages.create({
      model: GAP_MODEL, max_tokens: maxTokens, temperature, system,
      messages: [{ role: "user", content: user }],
    });
    const txt = r.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    return extractJson(txt);
  } catch {
    return null;
  }
}

const norm = (s: string) => s.replace(/[֑-ׇ]/g, "").replace(/\s+/g, " ").trim(); // strip niqqud + collapse ws

function abstain(signals: Record<string, unknown>, safety: "ok" | "do_not_name" = "ok"): GapResult {
  return {
    present: "abstain", seam: safety === "do_not_name" ? "unclear" : "unclear",
    safety, confidence: safety === "do_not_name" ? 0.55 : 0.4,
    signals, reading: null, crossing: null, evidence: [], version: GAP_ENGINE_VERSION,
  };
}

export async function detectGap(answers: Record<string, string>): Promise<GapResult> {
  // ── Stage 0: crisis floor (deterministic, no LLM) ──────────────────────
  if (crisisFloor(answers)) {
    return abstain({ reason: "crisis_floor" }, "do_not_name");
  }

  const q1 = answers.flow_zone ?? "";
  const q2 = answers.effortless_mastery ?? "";
  const q3 = answers.hard_period ?? "";
  const q5 = answers.message_to_past ?? "";

  // Too thin to judge at all → abstain before spending tokens.
  if (norm(`${q3} ${q5}`).replace(/ /g, "").length < 60) {
    return abstain({ reason: "too_thin" });
  }

  const client = new Anthropic();

  // ── Stage B: seam ensemble (the crux) ──────────────────────────────────
  const framings = ["direct", "adversarial", "nli"] as const;
  const seamCalls: Promise<unknown | null>[] = [];
  for (const f of framings) {
    for (let k = 0; k < SEAM_SAMPLES; k++) {
      seamCalls.push(ask(client, STAGE_B_SYSTEM, stageBUser(q3, q5, f), 0.7));
    }
  }
  // Stage C (fusion) in parallel with the seam ensemble.
  const fusionP = ask(client, STAGE_C_SYSTEM, stageCUser(q1, q2), 0.4);

  const seamResults = (await Promise.all(seamCalls)).filter(Boolean) as Record<string, unknown>[];
  if (seamResults.length === 0) return abstain({ reason: "seam_no_response" });

  const labels = seamResults.map((r) => String(r.label ?? "unclear"));
  const total = labels.length;
  const nOver  = labels.filter((l) => l === "overshoot").length;
  const nMetab = labels.filter((l) => l === "metabolized").length;
  const pOver  = nOver / total;
  const pMetab = nMetab / total;
  const agreement = Math.max(pOver, pMetab);

  const fusion = (await fusionP) as Record<string, unknown> | null;
  const fusionPresent = fusion?.fusion_present === true;

  const signals: Record<string, unknown> = {
    seam_samples: total, p_overshoot: +pOver.toFixed(2), p_metab: +pMetab.toFixed(2),
    agreement: +agreement.toFixed(2), fusion: fusionPresent,
  };

  // ── Stage E: calibrated gate (conservative v1) ─────────────────────────
  // Strong metabolized agreement → affirm the gift, no gap (safe, no generation).
  if (pMetab >= EMIT_AGREEMENT && pMetab > pOver) {
    return { present: "no", seam: "metabolized", safety: "ok",
      confidence: +Math.min(0.85, 0.5 + 0.35 * pMetab).toFixed(2),
      signals, reading: null, crossing: null, evidence: [], version: GAP_ENGINE_VERSION };
  }

  // Strong overshoot agreement (or overshoot + fusion) → candidate gap.
  const overshootSignal = pOver >= EMIT_AGREEMENT || (pOver >= 0.5 && fusionPresent);
  const rawConf = Math.min(0.9, 0.45 + 0.4 * pOver + (fusionPresent ? 0.08 : 0));
  if (!overshootSignal || rawConf < EMIT_MIN_CONF) {
    return abstain(signals); // ambiguous middle → abstain (the validated safe default)
  }

  // ── Collect grounded spans for generation (from the seam + fusion outputs) ──
  const spanPool: { source: string; text: string }[] = [];
  for (const r of seamResults) {
    if (typeof r.q3_span === "string" && r.q3_span.trim()) spanPool.push({ source: "hard_period", text: r.q3_span.trim() });
    if (typeof r.q5_span === "string" && r.q5_span.trim()) spanPool.push({ source: "message_to_past", text: r.q5_span.trim() });
  }
  if (fusion && typeof fusion.gift_span === "string") spanPool.push({ source: "effortless_mastery", text: fusion.gift_span.trim() });
  if (fusion && typeof fusion.attached_voice_span === "string" && fusion.attached_voice_span)
    spanPool.push({ source: "effortless_mastery", text: (fusion.attached_voice_span as string).trim() });

  // Verify each candidate span is an actual verbatim substring of its answer (restoration).
  const verifiedSpans = spanPool.filter((s) => {
    const src = answers[s.source] ?? "";
    return s.text.length > 3 && norm(src).includes(norm(s.text));
  });
  // De-dup
  const uniqSpans = Array.from(new Map(verifiedSpans.map((s) => [s.text, s])).values()).slice(0, 6);

  if (uniqSpans.length === 0) {
    // Overshoot detected but nothing grounded to quote → abstain (quote-or-discard).
    return abstain({ ...signals, reason: "no_grounded_span" });
  }

  // ── Stage F: constrained generation ────────────────────────────────────
  const gen = (await ask(client, STAGE_F_SYSTEM, stageFUser(uniqSpans), 0.5, 600)) as Record<string, unknown> | null;
  if (!gen || typeof gen.reading !== "string" || !gen.reading.trim()) {
    return abstain({ ...signals, reason: "gen_abstained" });
  }

  // ── Stage G: quote-or-discard on the bindings ──────────────────────────
  const bindings: GapEvidenceBinding[] = Array.isArray(gen.bindings)
    ? (gen.bindings as Record<string, unknown>[])
        .map((b) => ({ claim: String(b.claim ?? ""), span: String(b.span ?? ""), source: String(b.source ?? "") }))
        .filter((b) => {
          const src = answers[b.source] ?? "";
          return b.span.length > 3 && norm(src).includes(norm(b.span));
        })
    : [];
  if (bindings.length === 0) {
    // Reading has no surviving grounded binding → force abstain (invariant).
    return abstain({ ...signals, reason: "binding_failed" });
  }

  const present: GapResult["present"] = pOver >= 0.85 ? "yes" : "partial";
  const seam: GapSeam = "overshoot";
  const safety: GapResult["safety"] = "caution"; // any emitted gap is at least caution
  const crossing = typeof gen.crossing === "string" && gen.crossing.trim() ? gen.crossing.trim() : null;

  return {
    present, seam, safety, confidence: +rawConf.toFixed(2), signals,
    reading: gen.reading.trim(), crossing, evidence: bindings, version: GAP_ENGINE_VERSION,
  };
}
