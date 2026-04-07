// ─── Core Types ──────────────────────────────────────
export type DateRange = 'today' | '7d' | '30d' | '90d' | 'all';

export type FunnelStage = 'lead' | 'engaged' | 'high_intent' | 'buyer' | 'booked';

export type ProductId = 
  | 'free_training' 
  | 'challenge' 
  | 'workshop' 
  | 'course' 
  | 'strategy' 
  | 'premium' 
  | 'partnership' 
  | 'hive';

// ─── User / Lead ─────────────────────────────────────
export interface Lead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  funnel_stage: FunnelStage;
  lead_score: number;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ab_variant: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Order ────────────────────────────────────────────
export interface Order {
  id: string;
  user_id: string;
  product_id: ProductId;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  cardcom_transaction_id: string | null;
  created_at: string;
}

// ─── Email Log ────────────────────────────────────────
export interface EmailLog {
  id: string;
  user_id: string;
  sequence_id: string;
  template_id: string;
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  resend_id: string | null;
  created_at: string;
}

// ─── A/B Test ─────────────────────────────────────────
export interface ABTest {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variant_a: string;
  variant_b: string;
  metric: string;
  visitors_a: number;
  visitors_b: number;
  conversions_a: number;
  conversions_b: number;
  winner: 'a' | 'b' | null;
  confidence: number;
  created_at: string;
  completed_at: string | null;
}

// ─── Booking ──────────────────────────────────────────
export interface Booking {
  id: string;
  user_id: string;
  type: 'strategy' | 'premium' | 'consultation';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  scheduled_at: string;
  calendly_event_id: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Hive Member ──────────────────────────────────────
export interface HiveMember {
  id: string;
  user_id: string;
  tier: 29 | 97;
  status: 'active' | 'cancelled' | 'paused';
  started_at: string;
  next_billing_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

// ─── Quiz Result ──────────────────────────────────────
export interface QuizResult {
  id: string;
  user_id: string | null;
  answers: Record<string, string | number>;
  score: number;
  recommended_product: ProductId;
  created_at: string;
}

// ─── Error Log ────────────────────────────────────────
export interface ErrorLog {
  id: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  context: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

// ─── Event ────────────────────────────────────────────
export interface TrackingEvent {
  id: string;
  type: string;
  user_id: string | null;
  anonymous_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─── Meta Ads ─────────────────────────────────────────
export interface MetaCampaign {
  name: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
}

// ─── Calendly Event ───────────────────────────────────
export interface CalendlyEvent {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: string;
  meetingUrl: string | null;
}

// ─── Video Analytics ──────────────────────────────────
export interface VideoAnalytics {
  id: string;
  name: string;
  plays: number;
  finishes: number;
  duration: number;
  completionRate: number;
}

// ─── Source Analytics ─────────────────────────────────
export interface SourceAnalytics {
  source: string;
  leads: number;
  buyers: number;
  revenue: number;
  conversionRate: number;
}

// ─── Revenue Stats ────────────────────────────────────
export interface RevenueStats {
  total: number;
  change: number;
  byProduct: Record<string, { revenue: number; count: number; name: string }>;
  orderCount: number;
}

// ─── Funnel Stage Data ────────────────────────────────
export interface FunnelStageData {
  stage: string;
  label: string;
  count: number;
  conversionRate: number;
}

// ─── API Integration Status ───────────────────────────
export interface ApiStatus {
  name: string;
  configured: boolean;
  lastSync?: string;
  error?: string;
}

// ─── Email Sequence Stats ─────────────────────────────
export interface EmailSequenceStats {
  sequenceId: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  ctr: number;
}

// ─── Hive Stats ───────────────────────────────────────
export interface HiveStats {
  total: number;
  tier29: number;
  tier97: number;
  mrr: number;
  newThisMonth: number;
  cancellations: number;
  atRisk: number;
}
