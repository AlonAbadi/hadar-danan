import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getGA4Data } from '@/lib/admin/ga4-server';

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}

function getDateFilter(range?: string | null): string {
  const now = new Date();
  switch (range) {
    case 'today': return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    case '7d':    return new Date(now.getTime() - 7  * 86400000).toISOString();
    case '30d':   return new Date(now.getTime() - 30 * 86400000).toISOString();
    case '90d':   return new Date(now.getTime() - 90 * 86400000).toISOString();
    default:      return '2020-01-01T00:00:00Z';
  }
}

const VIDEO_ID = '1178865564';
const VIMEO_VIDEO_URI = `/videos/${VIDEO_ID}`;

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197: 'אתגר 7 ימים (₪197)',
  workshop_1080: 'סדנה יום אחד (₪1,080)',
  course_1800:   'קורס דיגיטלי (₪1,800)',
  strategy_4000: 'פגישת אסטרטגיה (₪4,000)',
  premium_14000: 'יום צילום פרמיום (₪14,000)',
  hive_starter_160: 'הכוורת Starter',
  test_1:        'מוצר בדיקה',
};

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const dateRange = new URL(req.url).searchParams.get('dateRange') ?? '30d';
  const since = getDateFilter(dateRange);
  const supabase = createServerClient();

  const [signupsRes, videoEventsRes, purchasesRes, ga4, vimeoRes] = await Promise.all([
    // 1. Signups in date range
    supabase
      .from('users')
      .select('id, email, utm_source, utm_medium, utm_campaign, utm_content, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000),

    // 2. All video events for this video (all time for full viewer map, filtered for date-range stats)
    supabase
      .from('video_events')
      .select('anon_id, user_email, event_type, percent_watched, drop_off_second, created_at')
      .eq('video_id', VIDEO_ID)
      .order('created_at', { ascending: false })
      .limit(10000),

    // 3. Completed purchases (all time — we'll cross-ref by viewer email)
    supabase
      .from('purchases')
      .select('user_id, product, amount, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5000),

    // 4. GA4
    getGA4Data(dateRange),

    // 5. Vimeo API
    process.env.VIMEO_ACCESS_TOKEN
      ? fetch(`https://api.vimeo.com/videos/${VIDEO_ID}?fields=stats,duration,name`, {
          headers: { Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}` },
          next: { revalidate: 600 },
        }).then(r => r.json()).catch(() => null)
      : Promise.resolve(null),
  ]);

  // ── Signups ──────────────────────────────────────────
  const signups = signupsRes.data ?? [];
  const signupBySource: Record<string, number> = {};
  const signupByCampaign: Record<string, { source: string; medium: string; campaign: string; count: number }> = {};
  for (const u of signups) {
    const src = u.utm_source || 'direct';
    signupBySource[src] = (signupBySource[src] ?? 0) + 1;
    if (u.utm_campaign || u.utm_medium) {
      const key = `${src}||${u.utm_medium || ''}||${u.utm_campaign || ''}`;
      if (!signupByCampaign[key]) signupByCampaign[key] = { source: src, medium: u.utm_medium || '', campaign: u.utm_campaign || '', count: 0 };
      signupByCampaign[key].count += 1;
    }
  }
  const signupEmailSet = new Set(signups.map(u => u.email));
  const signupIdMap: Record<string, string> = {};
  for (const u of signups) if (u.email) signupIdMap[u.email] = u.id;

  // ── Video Events ─────────────────────────────────────
  const allEvents = videoEventsRes.data ?? [];
  const eventsInRange = allEvents.filter(e => e.created_at >= since);

  const viewerKey = (e: { anon_id: string | null; user_email: string | null }) =>
    e.anon_id ?? e.user_email ?? null;

  // All-time unique viewer emails (for cross-ref with purchases)
  const viewerEmails = new Set<string>();
  for (const e of allEvents) if (e.user_email) viewerEmails.add(e.user_email);

  // Date-range video stats
  const playEvents = eventsInRange.filter(e => e.event_type === 'play');
  const uniqueViewerKeys = new Set(eventsInRange.map(viewerKey).filter(Boolean));

  const viewerMax: Record<string, number> = {};
  for (const e of eventsInRange) {
    const key = viewerKey(e);
    if (!key) continue;
    const pct = e.event_type === 'completed' ? 100 : (e.percent_watched ?? 0);
    if (pct > (viewerMax[key] ?? 0)) viewerMax[key] = pct;
  }
  const maxes = Object.values(viewerMax);

  const watchEvents = eventsInRange.filter(e =>
    (e.event_type === 'watch_progress' || e.event_type === 'timeupdate') && e.percent_watched != null
  );
  const avgWatchPercent = watchEvents.length > 0
    ? Math.round(watchEvents.reduce((s, e) => s + (e.percent_watched ?? 0), 0) / watchEvents.length)
    : 0;

  const completedCount = eventsInRange.filter(e => e.event_type === 'completed').length;

  // Drop-off curve (15-second buckets, in range)
  const buckets: Record<number, Set<string>> = {};
  for (const e of eventsInRange) {
    if (e.event_type !== 'timeupdate' && e.event_type !== 'watch_progress') continue;
    const key = viewerKey(e);
    if (!key) continue;
    const sec = Math.floor((e.drop_off_second ?? 0) / 15) * 15;
    if (!buckets[sec]) buckets[sec] = new Set();
    buckets[sec].add(key);
  }
  const dropOffCurve = Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([sec, viewers]) => ({ second: Number(sec), viewers: viewers.size }));

  // ── Purchase Cross-Reference ──────────────────────────
  // Get user_ids for emails in video_events
  const viewerEmailArr = Array.from(viewerEmails);
  const { data: viewerUsers } = viewerEmailArr.length
    ? await supabase.from('users').select('id, email').in('email', viewerEmailArr.slice(0, 500))
    : { data: [] };
  const viewerUserIds = new Set((viewerUsers ?? []).map(u => u.id));

  const purchases = purchasesRes.data ?? [];
  const viewerPurchases = purchases.filter(p => viewerUserIds.has(p.user_id));
  const purchaseByProduct: Record<string, { count: number; revenue: number; label: string }> = {};
  for (const p of viewerPurchases) {
    const label = PRODUCT_LABELS[p.product] ?? p.product;
    if (!purchaseByProduct[p.product]) purchaseByProduct[p.product] = { count: 0, revenue: 0, label };
    purchaseByProduct[p.product].count += 1;
    purchaseByProduct[p.product].revenue += p.amount ?? 0;
  }

  // ── Vimeo ─────────────────────────────────────────────
  const vimeo = vimeoRes ? {
    configured: true,
    plays:    vimeoRes.stats?.plays    ?? 0,
    finishes: vimeoRes.stats?.finishes ?? 0,
    duration: vimeoRes.duration        ?? 0,
    name:     vimeoRes.name            ?? 'שיעור במתנה',
  } : { configured: false, plays: 0, finishes: 0, duration: 0, name: '' };

  return NextResponse.json({
    dateRange,
    signups: {
      total: signups.length,
      bySource: Object.entries(signupBySource)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
      byCampaign: Object.values(signupByCampaign).sort((a, b) => b.count - a.count).slice(0, 20),
    },
    video: {
      totalPlays:      playEvents.length,
      uniqueViewers:   uniqueViewerKeys.size,
      avgWatchPercent,
      completionRate:  playEvents.length > 0 ? Math.round((completedCount / playEvents.length) * 100) : 0,
      reached25:  maxes.filter(p => p >= 25).length,
      reached50:  maxes.filter(p => p >= 50).length,
      reached75:  maxes.filter(p => p >= 75).length,
      reached100: maxes.filter(p => p >= 100).length,
      dropOffCurve,
    },
    conversions: {
      viewersWhoConverted: viewerPurchases.length,
      uniqueBuyers: new Set(viewerPurchases.map(p => p.user_id)).size,
      byProduct: Object.entries(purchaseByProduct)
        .map(([product, d]) => ({ product, ...d }))
        .sort((a, b) => b.revenue - a.revenue),
      totalRevenue: viewerPurchases.reduce((s, p) => s + (p.amount ?? 0), 0),
    },
    ga4: {
      trainingPageUsers:  ga4.data?.training?.byPageUsers?.['/training']      ?? 0,
      watchPageUsers:     ga4.data?.training?.byPageUsers?.['/training/watch'] ?? 0,
      quizClicks:         ga4.data?.training?.byEvent?.['training_quiz_cta_click'] ?? 0,
      productClicks:      ga4.data?.training?.productClicks ?? {},
      totalProductClicks: Object.values(ga4.data?.training?.productClicks ?? {}).reduce((s: number, v) => s + (v as number), 0),
      ga4Delay: true,
    },
    vimeo,
  });
}
