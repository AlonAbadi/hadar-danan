import { createServerClient } from '@/lib/supabase/server';
import ConversionsClient from './client';

export const dynamic = 'force-dynamic';

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197:  'אתגר 7 ימים',
  workshop_1080:  'סדנה יום אחד',
  course_1800:    'קורס דיגיטלי',
  strategy_4000:  'פגישת אסטרטגיה',
  premium_14000:  'יום צילום פרמיום',
  test_1:         'מוצר בדיקה',
};

const PRODUCT_CUSTOM_EVENT: Record<string, string> = {
  challenge_197:  'PurchaseChallenge',
  workshop_1080:  'PurchaseWorkshop',
  course_1800:    'PurchaseCourse',
  strategy_4000:  'PurchaseStrategy',
  premium_14000:  'PurchasePremium',
  test_1:         'PurchaseTest',
};

function rangeToSince(range: string): string {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return since.toISOString();
}

export type EventRow = {
  eventName:   string;
  source:      string;
  count:       number;
  totalValue?: number;
  avgValue?:   number;
  lastFired:   string | null;
};

async function getConversionsData(range: string) {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  const since = rangeToSince(range);

  const [purchasesRes, signupsRes, partnerRes, atelierRes, checkoutsRes, schedulesRes, subscribesRes] = await Promise.all([
    sb
      .from('purchases')
      .select('product, amount, amount_paid, created_at')
      .eq('status', 'completed')
      .gte('created_at', since),
    sb
      .from('events')
      .select('created_at')
      .eq('type', 'USER_SIGNED_UP')
      .gte('created_at', since),
    sb
      .from('events')
      .select('created_at')
      .eq('type', 'PARTNERSHIP_LEAD')
      .gte('created_at', since),
    sb
      .from('atelier_applications')
      .select('created_at')
      .gte('created_at', since),
    sb
      .from('events')
      .select('created_at')
      .eq('type', 'CHECKOUT_STARTED')
      .gte('created_at', since),
    sb
      .from('events')
      .select('created_at')
      .eq('type', 'CALL_BOOKED')
      .gte('created_at', since),
    sb
      .from('events')
      .select('created_at')
      .eq('type', 'HIVE_JOINED')
      .gte('created_at', since),
  ]);

  type Row = { created_at: string };
  type PurchaseRow = Row & { product: string; amount: number | null; amount_paid: number | null };

  const purchases: PurchaseRow[] = purchasesRes.data ?? [];
  const signups:   Row[]         = signupsRes.data   ?? [];
  const partners:  Row[]         = partnerRes.data   ?? [];
  const ateliers:  Row[]         = atelierRes.data   ?? [];
  const checkouts: Row[]         = checkoutsRes.data ?? [];
  const schedules: Row[]         = schedulesRes.data ?? [];
  const subscribes: Row[]        = subscribesRes.data ?? [];

  const newest = (rows: Row[]): string | null =>
    rows.length === 0 ? null : rows.reduce((a, b) => (a.created_at > b.created_at ? a : b)).created_at;

  // ─── Purchase events ────────────────────────────────────
  const totalPurchaseRevenue = purchases.reduce((s, p) => s + (p.amount_paid ?? p.amount ?? 0), 0);
  const purchaseEvent: EventRow = {
    eventName: 'Purchase',
    source:    'כל הרכישות',
    count:     purchases.length,
    totalValue: totalPurchaseRevenue,
    avgValue:  purchases.length > 0 ? Math.round(totalPurchaseRevenue / purchases.length) : 0,
    lastFired: newest(purchases),
  };

  const productEventRows: EventRow[] = Object.entries(PRODUCT_CUSTOM_EVENT).map(([productKey, eventName]) => {
    const rows = purchases.filter((p) => p.product === productKey);
    const value = rows.reduce((s, p) => s + (p.amount_paid ?? p.amount ?? 0), 0);
    return {
      eventName,
      source:     PRODUCT_LABELS[productKey] ?? productKey,
      count:      rows.length,
      totalValue: value,
      avgValue:   rows.length > 0 ? Math.round(value / rows.length) : 0,
      lastFired:  newest(rows),
    };
  }).filter((r) => r.count > 0);

  // ─── Lead/engagement events ─────────────────────────────
  const leadCount = signups.length + ateliers.length + partners.length;
  const allLeadRows = [...signups, ...ateliers, ...partners];

  const engagementRows: EventRow[] = [
    {
      eventName: 'Lead',
      source:    `הרשמות (${signups.length}) + atelier (${ateliers.length}) + partnership (${partners.length})`,
      count:     leadCount,
      lastFired: newest(allLeadRows),
    },
    {
      eventName: 'AtelierLead',
      source:    'טופס atelier',
      count:     ateliers.length,
      lastFired: newest(ateliers),
    },
    {
      eventName: 'PartnershipLead',
      source:    'טופס שותפות אסטרטגית',
      count:     partners.length,
      lastFired: newest(partners),
    },
    {
      eventName: 'InitiateCheckout',
      source:    'התחלת רכישה',
      count:     checkouts.length,
      lastFired: newest(checkouts),
    },
    {
      eventName: 'Schedule',
      source:    'הזמנת פגישה (אסטרטגיה/פרמיום/שותפות)',
      count:     schedules.length,
      lastFired: newest(schedules),
    },
    {
      eventName: 'Subscribe',
      source:    'הצטרפות לכוורת',
      count:     subscribes.length,
      lastFired: newest(subscribes),
    },
  ].filter((r) => r.count > 0);

  // ─── Pick latest fired across everything ────────────────
  const allTimestamps = [
    ...purchases.map((p) => p.created_at),
    ...signups.map((s) => s.created_at),
    ...partners.map((p) => p.created_at),
    ...ateliers.map((a) => a.created_at),
    ...checkouts.map((c) => c.created_at),
    ...schedules.map((s) => s.created_at),
    ...subscribes.map((s) => s.created_at),
  ];
  const lastEventTime = allTimestamps.length === 0
    ? null
    : allTimestamps.reduce((a, b) => (a > b ? a : b));

  return {
    purchaseEvent,
    productEventRows,
    engagementRows,
    totalPurchases: purchases.length,
    totalRevenue:   totalPurchaseRevenue,
    totalLeads:     leadCount,
    lastEventTime,
  };
}

export default async function ConversionsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = range || '30d';
  const data = await getConversionsData(dateRange);

  return <ConversionsClient data={data} dateRange={dateRange} />;
}
