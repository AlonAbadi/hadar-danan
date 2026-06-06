/**
 * Shared types for the daily call-list pipeline.
 */

export type CandidateLead = {
  id:               string;
  name:             string | null;
  email:            string;
  phone:            string;
  status:           string;
  lastActivityAt:   string | null;
  createdAt:        string;
  utmSource:        string | null;
  utmCampaign:      string | null;
  marketingConsent: boolean;

  latestQuiz: {
    recommended_product: string;
    second_product:      string | null;
    match_percent:       number | null;
    answers:             Record<string, unknown>;
    created_at:          string;
  } | null;

  // Last 30 days, ordered desc.
  recentEvents: Array<{
    type:       string;
    metadata:   Record<string, unknown>;
    created_at: string;
  }>;

  // True if the user has any completed strategy/premium/partnership purchase
  // — these leads are excluded (they're already converted on high-ticket).
  hasCompletedHighTicket: boolean;

  // Most recent pending checkout for strategy/premium in last 7 days, if any.
  // Strong "they were about to buy but didn't" signal.
  pendingHighTicketCheckout: {
    product:    string;
    amount:     number;
    created_at: string;
  } | null;

  // True if the user was dormant >30 days then showed activity in last 72h.
  isAwakened: boolean;

  // Junk-signal flags (lib/daily-call-list/junk-filter)
  // Set when the user submitted >= 3 quizzes within a 6h window.
  multipleQuizSubmissions: boolean;
  // How many of their recent events were filtered as noise (asset clicks, etc).
  junkEventCount: number;

  // TrueSignal© AI synthesis from user_insights (≤7d old).
  // Null if no insight cached. The synthesis is authoritative — if it speaks
  // of curiosity or non-commitment, the scoring penalizes this lead.
  insight: {
    synthesis:    string;
    generated_at: string;
  } | null;
};

export type ScoredLead = CandidateLead & {
  score:    number;
  reasons:  string[];
};

export type LeadBrief = {
  opening:       string;       // Hebrew opening line for the call
  talkingPoints: string[];     // 2 short Hebrew bullets
  risk?:         string;       // Optional risk flag (e.g. "אין הסכמת שיווק")

  // AI go/no-go on whether this lead is actually worth calling today.
  // "no" leads are dropped from the final list before sending.
  goNoGo:        "go" | "no_go";
  noGoReason?:   string;       // One short Hebrew sentence when goNoGo="no_go"
};

export type FinalLead = ScoredLead & {
  brief: LeadBrief;
};
