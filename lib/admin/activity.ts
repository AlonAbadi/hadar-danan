import { createServerClient } from '@/lib/supabase/server';

// ════════════════════════════════════════════════════════
// USER ACTIVITY REPORT — /admin/activity
//
// Aggregates the event log into per-registered-user visit
// metrics. A "visit" (session) = consecutive events with
// gaps under 30 minutes; time-on-site = sum of session
// spans. Bounded query (registered users' events only,
// capped window + row cap) — the events table must never
// be full-scanned on page load (NANO compute).
// ════════════════════════════════════════════════════════

const SESSION_GAP_MS = 30 * 60 * 1000;
const MAX_EVENT_ROWS = 30_000;

// Internal / QA accounts — hidden by default in the report
export const INTERNAL_EMAILS = [
  'alonabadi9@gmail.com',
  'hadard1113@gmail.com',
  'broadcast-qa@beegood.online',
];
export const INTERNAL_DOMAINS = ['thequietreturn.com', 'goodtoseeya.com'];

export interface UserActivity {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;          // normalized acquisition source
  createdAt: string;
  visits: number;          // distinct sessions in the window
  totalMinutes: number;    // sum of session spans
  pageViews: number;
  distinctPages: string[]; // up to 6, most recent first
  emailVisits: number;     // sessions that started from an email click
  referrers: string[];     // external referrer domains seen
  lastSeen: string | null;
  hasCheckout: boolean;
  hasPurchase: boolean;
  score: number;           // 0-100 activity score
  tier: 'hot' | 'active' | 'occasional' | 'dormant';
  isInternal: boolean;
}

export interface ActivityReport {
  users: UserActivity[];
  daysBack: number;
  truncated: boolean;      // event row cap hit — oldest events dropped
  generatedAt: string;
}

function normalizeSource(raw: string | null): string {
  if (!raw) return 'ישיר / לא ידוע';
  let s = raw;
  try { s = decodeURIComponent(raw); } catch { /* keep raw */ }
  const lower = s.toLowerCase().trim();
  if (lower === 'ig' || lower === 'instagram') return 'Instagram';
  if (lower === 'fb' || lower === 'facebook') return 'Facebook';
  if (lower === 'linktree') return 'Linktree';
  if (lower === 'email') return 'אימייל';
  if (lower === 'google') return 'Google';
  return s;
}

function referrerDomain(referrer: unknown): string | null {
  if (typeof referrer !== 'string' || !referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host === 'beegood.online' || host.endsWith('.vercel.app') || host === 'localhost') return null;
    if (host === 'secure.cardcom.solutions' || host === 'accounts.google.com') return null;
    return host.replace(/^l\./, ''); // l.instagram.com → instagram.com
  } catch {
    return null;
  }
}

// The scoring principles (each dimension capped, sum = 100):
//   Frequency 35 — return visits are the strongest loyalty signal
//   Depth     25 — minutes on site (15) + breadth of pages (10)
//   Recency   25 — activity decays; a hot user is a recent user
//   Intent    15 — checkout started (7) + completed purchase (8)
function computeScore(u: {
  visits: number; totalMinutes: number; distinctPages: number;
  lastSeen: string | null; hasCheckout: boolean; hasPurchase: boolean;
}): number {
  const frequency = (Math.min(u.visits, 10) / 10) * 35;
  const depth =
    (Math.min(u.totalMinutes, 60) / 60) * 15 +
    (Math.min(u.distinctPages, 8) / 8) * 10;
  let recency = 0;
  if (u.lastSeen) {
    const days = (Date.now() - new Date(u.lastSeen).getTime()) / 86_400_000;
    recency = days <= 7 ? 25 : days <= 14 ? 20 : days <= 30 ? 14 : days <= 60 ? 8 : days <= 90 ? 4 : 0;
  }
  const intent = (u.hasCheckout ? 7 : 0) + (u.hasPurchase ? 8 : 0);
  return Math.round(frequency + depth + recency + intent);
}

function tierOf(score: number): UserActivity['tier'] {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'active';
  if (score >= 15) return 'occasional';
  return 'dormant';
}

export async function getUserActivityReport(daysBack = 180): Promise<ActivityReport> {
  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - daysBack * 86_400_000).toISOString();

  type UserRow = { id: string; email: string; name: string | null; status: string; utm_source: string | null; created_at: string; last_activity_at: string | null };
  const users: UserRow[] = [];
  for (let page = 0; ; page++) {
    // last_activity_at (migration 013) is missing from the hand-written types file
    const { data, error } = await (supabase as any)
      .from('users')
      .select('id, email, name, status, utm_source, created_at, last_activity_at')
      .not('auth_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`activity report users query: ${error.message}`);
    users.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  type Ev = { user_id: string; type: string; created_at: string; metadata: Record<string, unknown> | null };
  const events: Ev[] = [];
  let truncated = false;
  // Newest first so that hitting the cap drops the oldest events, not the freshest
  for (let page = 0; page * 1000 < MAX_EVENT_ROWS; page++) {
    const { data, error } = await supabase
      .from('events')
      .select('user_id, type, created_at, metadata')
      .not('user_id', 'is', null)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`activity report events query: ${error.message}`);
    events.push(...((data ?? []) as Ev[]));
    if (!data || data.length < 1000) break;
    if ((page + 1) * 1000 >= MAX_EVENT_ROWS) truncated = true;
  }

  const byUser = new Map<string, Ev[]>();
  for (const e of events) {
    const list = byUser.get(e.user_id);
    if (list) list.push(e);
    else byUser.set(e.user_id, [e]);
  }

  const report: UserActivity[] = users.map((u) => {
    // events arrive newest-first — sessionize oldest-first
    const evs = (byUser.get(u.id) ?? []).slice().reverse();

    const sessions: { start: number; end: number; firstType: string }[] = [];
    let cur: { start: number; end: number; firstType: string } | null = null;
    const pagesSeen = new Set<string>();
    const refDomains = new Set<string>();
    let pageViews = 0;
    let hasCheckout = false;
    let hasPurchase = false;
    let emailVisits = 0;

    for (const e of evs) {
      const t = new Date(e.created_at).getTime();
      if (!cur || t - cur.end > SESSION_GAP_MS) {
        cur = { start: t, end: t, firstType: e.type };
        sessions.push(cur);
        if (e.type === 'LINK_CLICKED' || e.type === 'EMAIL_OPENED') emailVisits++;
      } else {
        cur.end = t;
      }
      if (e.type === 'PAGE_VIEW') {
        pageViews++;
        const page = e.metadata?.page;
        if (typeof page === 'string') pagesSeen.add(page);
      }
      if (e.type === 'CHECKOUT_STARTED') hasCheckout = true;
      if (e.type === 'PURCHASE_COMPLETED' || e.type.endsWith('_PURCHASED')) hasPurchase = true;
      const dom = referrerDomain(e.metadata?.referrer);
      if (dom) refDomains.add(dom);
    }

    const totalMinutes = Math.round(sessions.reduce((s, x) => s + (x.end - x.start), 0) / 60_000);
    const lastSeen = evs.length ? evs[evs.length - 1].created_at : u.last_activity_at;
    const emailLower = u.email.toLowerCase();
    const isInternal =
      INTERNAL_EMAILS.includes(emailLower) ||
      INTERNAL_DOMAINS.some((d) => emailLower.endsWith(`@${d}`));

    const score = computeScore({
      visits: sessions.length,
      totalMinutes,
      distinctPages: pagesSeen.size,
      lastSeen,
      hasCheckout,
      hasPurchase: hasPurchase || u.status === 'buyer' || u.status === 'booked',
    });

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.status,
      source: normalizeSource(u.utm_source),
      createdAt: u.created_at,
      visits: sessions.length,
      totalMinutes,
      pageViews,
      distinctPages: [...pagesSeen].slice(-6).reverse(),
      emailVisits,
      referrers: [...refDomains],
      lastSeen,
      hasCheckout,
      hasPurchase,
      score,
      tier: tierOf(score),
      isInternal,
    };
  });

  report.sort((a, b) => b.score - a.score || b.visits - a.visits || b.totalMinutes - a.totalMinutes);

  return { users: report, daysBack, truncated, generatedAt: new Date().toISOString() };
}
