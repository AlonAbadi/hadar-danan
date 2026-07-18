import { createServerClient } from '@/lib/supabase/server';

// ════════════════════════════════════════════════════════
// USER ACTIVITY REPORT — /admin/activity
//
// Aggregates the event log into per-registered-user visit
// metrics, plus real product usage: free training viewing
// (video_events), challenge progress (challenge_enrollments),
// Signal Engine extractions (signal_extractions) and the
// broadcast room (broadcast_takes).
//
// A "visit" (session) = consecutive events with gaps under
// 30 minutes; time-on-site = sum of session spans. Bounded
// queries only (registered users' events, capped window +
// row caps) — the events table must never be full-scanned
// on page load (NANO compute).
// ════════════════════════════════════════════════════════

const SESSION_GAP_MS = 30 * 60 * 1000;
const MAX_EVENT_ROWS = 30_000;
const MAX_VIDEO_ROWS = 15_000;

// Vimeo ids of the free training lesson (השיעור החינמי)
const TRAINING_VIDEO_IDS = new Set(['1178865564']);

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
  distinctPages: string[]; // up to 6
  emailVisits: number;     // sessions that started from an email click
  referrers: string[];     // external referrer domains seen
  lastSeen: string | null;
  hasCheckout: boolean;
  hasPurchase: boolean;
  // ── product usage ──
  trainingPct: number;         // max % watched of the free training lesson
  videoViews: number;          // attributed video events (all videos)
  challenge: { currentDay: number; daysCompleted: number; completed: boolean } | null;
  signalCount: number;         // Signal Engine extractions (מנוע האות)
  signalBucket: string | null; // latest routing bucket
  broadcastTakes: number;      // חדר השידור takes
  score: number;               // 0-100 activity score
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
//   Frequency 30 — return visits are the strongest loyalty signal
//   Depth     20 — minutes on site (12) + breadth of pages (8)
//   Recency   20 — activity decays; a hot user is a recent user
//   Usage     20 — real product usage: training viewing, challenge
//                  progress, signal extraction, broadcast room
//   Intent    10 — checkout started (4) + completed purchase (6)
function computeScore(u: {
  visits: number; totalMinutes: number; distinctPages: number;
  lastSeen: string | null; hasCheckout: boolean; hasPurchase: boolean;
  trainingPct: number; challenge: UserActivity['challenge'];
  signalCount: number; broadcastTakes: number;
}): number {
  const frequency = (Math.min(u.visits, 10) / 10) * 30;
  const depth =
    (Math.min(u.totalMinutes, 60) / 60) * 12 +
    (Math.min(u.distinctPages, 8) / 8) * 8;
  let recency = 0;
  if (u.lastSeen) {
    const days = (Date.now() - new Date(u.lastSeen).getTime()) / 86_400_000;
    recency = days <= 7 ? 20 : days <= 14 ? 16 : days <= 30 ? 11 : days <= 60 ? 6 : days <= 90 ? 3 : 0;
  }
  const usage = Math.min(20,
    (u.trainingPct >= 80 ? 5 : u.trainingPct >= 25 ? 3 : u.trainingPct > 0 ? 1 : 0) +
    (u.challenge ? 2 + Math.min(u.challenge.daysCompleted, 5) : 0) +
    (u.signalCount > 0 ? 4 : 0) +
    (u.broadcastTakes > 0 ? 4 : 0)
  );
  const intent = (u.hasCheckout ? 4 : 0) + (u.hasPurchase ? 6 : 0);
  return Math.round(frequency + depth + recency + usage + intent);
}

function tierOf(score: number): UserActivity['tier'] {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'active';
  if (score >= 15) return 'occasional';
  return 'dormant';
}

async function fetchAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, cap = Infinity): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  for (let page = 0; page * 1000 < cap; page++) {
    const { data, error } = await query(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`activity report query: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

export async function getUserActivityReport(daysBack = 180): Promise<ActivityReport> {
  const supabase = createServerClient() as any; // several columns are missing from the hand-written types file
  const cutoff = new Date(Date.now() - daysBack * 86_400_000).toISOString();

  type UserRow = { id: string; email: string; name: string | null; status: string; utm_source: string | null; created_at: string; last_activity_at: string | null };
  const { rows: users } = await fetchAll<UserRow>((from, to) =>
    supabase.from('users')
      .select('id, email, name, status, utm_source, created_at, last_activity_at')
      .not('auth_id', 'is', null)
      .order('created_at', { ascending: true })
      .range(from, to)
  );

  type Ev = { user_id: string; type: string; created_at: string; metadata: Record<string, unknown> | null };
  // Newest first so that hitting the cap drops the oldest events, not the freshest
  const { rows: events, truncated } = await fetchAll<Ev>((from, to) =>
    supabase.from('events')
      .select('user_id, type, created_at, metadata')
      .not('user_id', 'is', null)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .range(from, to),
    MAX_EVENT_ROWS
  );

  // ── product usage sources (all small tables) ──
  type Identity = { anonymous_id: string; user_id: string };
  type VideoEv = { video_id: string; user_email: string | null; anon_id: string | null; percent_watched: number | null };
  type Enrollment = { id: string; user_id: string; current_day: number; completed_at: string | null };
  type DayCompletion = { enrollment_id: string };
  type Extraction = { user_id: string; bucket: string | null };
  type Take = { user_id: string };

  const [identities, videoEvents, enrollments, dayCompletions, extractions, takes] = await Promise.all([
    fetchAll<Identity>((f, t) => supabase.from('identities').select('anonymous_id, user_id').not('user_id', 'is', null).range(f, t)),
    fetchAll<VideoEv>((f, t) => supabase.from('video_events').select('video_id, user_email, anon_id, percent_watched').order('created_at', { ascending: false }).range(f, t), MAX_VIDEO_ROWS),
    fetchAll<Enrollment>((f, t) => supabase.from('challenge_enrollments').select('id, user_id, current_day, completed_at').range(f, t)),
    fetchAll<DayCompletion>((f, t) => supabase.from('challenge_day_completions').select('enrollment_id').range(f, t)),
    fetchAll<Extraction>((f, t) => supabase.from('signal_extractions').select('user_id, bucket').order('created_at', { ascending: false }).range(f, t)),
    fetchAll<Take>((f, t) => supabase.from('broadcast_takes').select('user_id').range(f, t)),
  ]);

  // Lookup maps: attribute video events via email OR anon_id → user
  const userIdByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u.id]));
  const userIdByAnon = new Map(identities.rows.map((i) => [i.anonymous_id, i.user_id]));

  const video = new Map<string, { trainingPct: number; views: number }>();
  for (const v of videoEvents.rows) {
    const uid =
      (v.user_email && userIdByEmail.get(v.user_email.toLowerCase())) ||
      (v.anon_id && userIdByAnon.get(v.anon_id)) || null;
    if (!uid) continue;
    const entry = video.get(uid) ?? { trainingPct: 0, views: 0 };
    entry.views++;
    if (TRAINING_VIDEO_IDS.has(v.video_id)) {
      entry.trainingPct = Math.max(entry.trainingPct, v.percent_watched ?? 0);
    }
    video.set(uid, entry);
  }

  const completionsByEnrollment = new Map<string, number>();
  for (const c of dayCompletions.rows) {
    completionsByEnrollment.set(c.enrollment_id, (completionsByEnrollment.get(c.enrollment_id) ?? 0) + 1);
  }
  const challengeByUser = new Map<string, UserActivity['challenge']>();
  for (const e of enrollments.rows) {
    challengeByUser.set(e.user_id, {
      currentDay: e.current_day,
      daysCompleted: completionsByEnrollment.get(e.id) ?? 0,
      completed: e.completed_at != null,
    });
  }

  const signalByUser = new Map<string, { count: number; bucket: string | null }>();
  for (const s of extractions.rows) {
    const entry = signalByUser.get(s.user_id) ?? { count: 0, bucket: s.bucket ?? null };
    entry.count++;
    signalByUser.set(s.user_id, entry);
  }

  const takesByUser = new Map<string, number>();
  for (const t of takes.rows) {
    takesByUser.set(t.user_id, (takesByUser.get(t.user_id) ?? 0) + 1);
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

    const sessions: { start: number; end: number }[] = [];
    let cur: { start: number; end: number } | null = null;
    const pagesSeen = new Set<string>();
    const refDomains = new Set<string>();
    let pageViews = 0;
    let hasCheckout = false;
    let hasPurchase = false;
    let emailVisits = 0;

    for (const e of evs) {
      const t = new Date(e.created_at).getTime();
      if (!cur || t - cur.end > SESSION_GAP_MS) {
        cur = { start: t, end: t };
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

    const videoUsage = video.get(u.id) ?? { trainingPct: 0, views: 0 };
    const challenge = challengeByUser.get(u.id) ?? null;
    const signal = signalByUser.get(u.id) ?? { count: 0, bucket: null };
    const broadcastTakes = takesByUser.get(u.id) ?? 0;

    const score = computeScore({
      visits: sessions.length,
      totalMinutes,
      distinctPages: pagesSeen.size,
      lastSeen,
      hasCheckout,
      hasPurchase: hasPurchase || u.status === 'buyer' || u.status === 'booked',
      trainingPct: videoUsage.trainingPct,
      challenge,
      signalCount: signal.count,
      broadcastTakes,
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
      trainingPct: videoUsage.trainingPct,
      videoViews: videoUsage.views,
      challenge,
      signalCount: signal.count,
      signalBucket: signal.bucket,
      broadcastTakes,
      score,
      tier: tierOf(score),
      isInternal,
    };
  });

  report.sort((a, b) => b.score - a.score || b.visits - a.visits || b.totalMinutes - a.totalMinutes);

  return { users: report, daysBack, truncated, generatedAt: new Date().toISOString() };
}

// ── Compact aggregate for the AI analysis (no emails sent to the API) ──
export function summarizeForInsights(report: ActivityReport) {
  const ext = report.users.filter((u) => !u.isInternal);
  const active = ext.filter((u) => u.visits > 0);
  const dist = (fn: (u: UserActivity) => string) =>
    Object.entries(ext.reduce<Record<string, number>>((m, u) => { const k = fn(u); m[k] = (m[k] ?? 0) + 1; return m; }, {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 12);

  const totalReturnSessions = ext.reduce((s, u) => s + Math.max(u.visits - 1, 0), 0);
  const emailReturnSessions = ext.reduce((s, u) => s + Math.min(u.emailVisits, Math.max(u.visits - 1, 0)), 0);

  return {
    window_days: report.daysBack,
    registered: ext.length,
    with_activity: active.length,
    returned_2plus: ext.filter((u) => u.visits >= 2).length,
    returned_5plus: ext.filter((u) => u.visits >= 5).length,
    avg_minutes_active: active.length ? Math.round(active.reduce((s, u) => s + u.totalMinutes, 0) / active.length) : 0,
    email_share_of_return_visits_pct: totalReturnSessions ? Math.round((emailReturnSessions / totalReturnSessions) * 100) : 0,
    tiers: dist((u) => u.tier),
    sources: dist((u) => u.source),
    statuses: dist((u) => u.status),
    product_usage: {
      watched_training_any: ext.filter((u) => u.trainingPct > 0).length,
      watched_training_80pct: ext.filter((u) => u.trainingPct >= 80).length,
      challenge_enrolled: ext.filter((u) => u.challenge).length,
      challenge_completed: ext.filter((u) => u.challenge?.completed).length,
      challenge_days_hist: dist((u) => u.challenge ? `day_${Math.min(u.challenge.daysCompleted, 8)}` : 'not_enrolled'),
      signal_extractions_users: ext.filter((u) => u.signalCount > 0).length,
      signal_buckets: dist((u) => u.signalBucket ?? 'none'),
      broadcast_users: ext.filter((u) => u.broadcastTakes > 0).length,
    },
    top_25_users: ext.slice(0, 25).map((u) => ({
      name: (u.name ?? 'ללא שם').split(' ')[0],
      score: u.score, visits: u.visits, minutes: u.totalMinutes,
      email_visits: u.emailVisits, source: u.source, status: u.status,
      training_pct: u.trainingPct,
      challenge_days: u.challenge?.daysCompleted ?? 0,
      signal: u.signalCount, broadcast: u.broadcastTakes,
      pages: u.distinctPages,
    })),
    dormant_with_product_usage: ext.filter((u) =>
      u.tier === 'dormant' && (u.trainingPct > 0 || u.challenge || u.signalCount > 0)
    ).length,
  };
}
