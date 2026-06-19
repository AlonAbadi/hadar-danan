"use client";

import { useEffect } from "react";
import { CHALLENGE_PROOF_EXPERIMENT } from "@/lib/ab";

interface Props {
  variant: "A" | "B" | "C";
}

/**
 * Fires a PAGE_VIEW event tagged with the challenge_proof_position
 * experiment + the visitor's assigned variant on first paint. The events
 * route increments visitors_a / visitors_b on the matching experiments
 * row so /admin/abtesting can compute CVR against the purchase metric.
 *
 * Runs once per mount via the empty deps array. Idempotency at the
 * experiment row is handled by the counters being monotonic — duplicate
 * fires would only inflate visitor counts, but useEffect with [] in a
 * server-component child won't repeat unless the user re-navigates to
 * /challenge.
 */
export function ChallengeProofTracker({ variant }: Props) {
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PAGE_VIEW",
        metadata: {
          page:            "/challenge",
          ab_variant:      variant,
          experiment_name: CHALLENGE_PROOF_EXPERIMENT,
        },
      }),
    }).catch(() => {});
  }, [variant]);

  return null;
}
