import { createServerClient } from '@/lib/supabase/server';

// ════════════════════════════════════════════════════════
// SUPABASE QUERIES - Internal Data
// ════════════════════════════════════════════════════════

// ─── Revenue & Orders ─────────────────────────────────
export async function getRevenueStats(dateRange?: string) {
  const supabase = createServerClient();
  const dateFilter = getDateFilter(dateRange);

  // Total revenue from purchases
  const { data: completedPurchases } = await supabase
    .from('purchases')
    .select('amount, product')
    .eq('status', 'completed')
    .gte('created_at', dateFilter);

  // Previous period for comparison
  const prevFilter = getPreviousPeriodFilter(dateRange);
  const { data: prevPurchases } = await supabase
    .from('purchases')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', prevFilter.start)
    .lt('created_at', prevFilter.end);

  const total = completedPurchases?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const prevTotal = prevPurchases?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
  const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  // Group by product
  const byProduct: Record<string, { revenue: number; count: number; name: string }> = {};
  completedPurchases?.forEach((o) => {
    const pid = o.product as string;
    if (!byProduct[pid]) {
      byProduct[pid] = { revenue: 0, count: 0, name: PRODUCT_MAP[pid]?.name || pid };
    }
    byProduct[pid].revenue += o.amount || 0;
    byProduct[pid].count += 1;
  });

  return { total, change, byProduct, orderCount: completedPurchases?.length || 0 };
}

// ─── Funnel Data ──────────────────────────────────────
export async function getFunnelData(dateRange?: string) {
  const supabase = createServerClient();
  const dateFilter = getDateFilter(dateRange);

  const { data: users } = await supabase
    .from('users')
    .select('id, status, created_at')
    .gte('created_at', dateFilter);

  const stages = ['lead', 'engaged', 'high_intent', 'buyer', 'booked'];
  const counts: Record<string, number> = {};
  stages.forEach((s) => { counts[s] = 0; });

  users?.forEach((u) => {
    const stage = u.status || 'lead';
    const idx = stages.indexOf(stage);
    // Count user in their stage AND all prior stages
    for (let i = 0; i <= idx; i++) {
      counts[stages[i]] += 1;
    }
  });

  return stages.map((stage, i) => ({
    stage,
    label: getFunnelLabel(stage),
    count: counts[stage],
    conversionRate: i > 0 && counts[stages[i - 1]] > 0
      ? Math.round((counts[stage] / counts[stages[i - 1]]) * 100)
      : 100,
  }));
}

// ─── Leads & Users ────────────────────────────────────
export async function getLeads(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  source?: string;
  sortBy?: string;
}) {
  const supabase = createServerClient();
  const { page = 1, perPage = 20, search, status, source, sortBy = 'created_at' } = params;
  const offset = (page - 1) * perPage;

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order(sortBy as any, { ascending: false })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status as any);
  }
  if (source) {
    query = query.eq('utm_source', source as any);
  }

  const { data, count } = await query;
  // Map status → funnel_stage for backward compat with client UI
  const leads = (data || []).map((u) => ({
    ...u,
    funnel_stage: u.status,
    source: u.utm_source,
    lead_score: getLeadScore(u.status),
  }));
  return { leads, total: count || 0 };
}

function getLeadScore(status: string): number {
  const scores: Record<string, number> = {
    lead:             20,
    engaged:          40,
    high_intent:      75,
    buyer:            90,
    booked:           100,
    premium_lead:     85,
    partnership_lead: 90,
  };
  return scores[status] ?? 0;
}

// ─── Email Performance ────────────────────────────────
export async function getEmailStats() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('email_logs')
    .select('sequence_id, status');

  const sequences: Record<string, {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  }> = {};

  data?.forEach((log) => {
    const seq = log.sequence_id || 'unknown';
    if (!sequences[seq]) {
      sequences[seq] = { sent: 0, opened: 0, clicked: 0, bounced: 0 };
    }
    sequences[seq].sent += 1;
    if (log.status === 'opened') sequences[seq].opened += 1;
    if (log.status === 'clicked') sequences[seq].clicked += 1;
  });

  return Object.entries(sequences).map(([id, stats]) => ({
    sequenceId: id,
    ...stats,
    openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
    ctr: stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 100) : 0,
  }));
}

// ─── Quiz Results ─────────────────────────────────────
export async function getQuizResults(limit = 50) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('quiz_results')
    .select('id, recommended_product, second_product, match_percent, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    // Table may not exist yet
    return { results: [], distribution: {} as Record<string, number> };
  }

  const results = data ?? [];
  const distribution: Record<string, number> = {};
  for (const row of results) {
    distribution[row.recommended_product] = (distribution[row.recommended_product] ?? 0) + 1;
  }

  return { results, distribution };
}

// ─── A/B Tests ────────────────────────────────────────
export async function getABTests() {
  const supabase = createServerClient();

  const { data: experiments } = await supabase
    .from('experiments')
    .select('*')
    .order('id', { ascending: false });

  // Map experiments schema to the shape the client expects
  return (experiments || []).map((e) => ({
    id: e.id,
    name: e.name,
    description: null as string | null,
    status: e.status,
    variant_a: e.variant_a_label,
    variant_b: e.variant_b_label,
    metric: 'conversion',
    visitors_a: e.visitors_a,
    visitors_b: e.visitors_b,
    conversions_a: e.conversions_a,
    conversions_b: e.conversions_b,
    winner: e.winner ? e.winner.toLowerCase() : null,
    confidence: 0,
  }));
}

// ─── Bookings ─────────────────────────────────────────
export async function getBookings(dateRange?: string) {
  const supabase = createServerClient();
  const dateFilter = getDateFilter(dateRange);

  const { data } = await supabase
    .from('bookings')
    .select('*')
    .gte('created_at', dateFilter)
    .order('slot_date', { ascending: true });

  // Map bookings to shape expected by BookingsClient
  return (data || []).map((b) => ({
    ...b,
    scheduled_at: `${b.slot_date}T${b.slot_time}:00`,
    type: 'strategy',
  }));
}

// ─── Hive Members (הכוורת) ────────────────────────────
export async function getHiveStats() {
  const supabase = createServerClient();

  const { data: members } = await supabase
    .from('users')
    .select('hive_tier, hive_status, hive_started_at, hive_cancelled_at, created_at')
    .eq('hive_status', 'active' as any);

  const tier29 = members?.filter((m) => m.hive_tier === 'discounted_29').length || 0;
  const tier97 = members?.filter((m) => m.hive_tier === 'basic_97').length || 0;
  const mrr = tier29 * 29 + tier97 * 97;

  // New this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const newThisMonth = members?.filter(
    (m) => m.hive_started_at && new Date(m.hive_started_at) >= monthStart
  ).length || 0;

  // Cancellations this month
  const { data: cancelledUsers } = await supabase
    .from('users')
    .select('hive_cancelled_at')
    .eq('hive_status', 'cancelled' as any)
    .gte('hive_cancelled_at', monthStart.toISOString() as any);

  // At-risk (started within 14 days - refund window)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const atRisk = members?.filter(
    (m) => m.hive_started_at && new Date(m.hive_started_at) >= fourteenDaysAgo
  ).length || 0;

  return {
    total: members?.length || 0,
    tier29,
    tier97,
    mrr,
    newThisMonth,
    cancellations: cancelledUsers?.length || 0,
    atRisk,
  };
}

// ─── Error Logs ───────────────────────────────────────
export async function getErrorLogs(limit = 50) {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Map error_logs schema: { context, error, payload, created_at } → client expects { level, message, context }
  return (data || []).map((e) => ({
    ...e,
    level: 'error',
    message: e.error,
  }));
}

// ─── Events Feed ──────────────────────────────────────
export async function getEvents(limit = 30) {
  const supabase = createServerClient();

  const { data } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

// ─── UTM / Source Analytics ───────────────────────────
export async function getSourceAnalytics(dateRange?: string) {
  const supabase = createServerClient();
  const dateFilter = getDateFilter(dateRange);

  const { data: users } = await supabase
    .from('users')
    .select('utm_source, utm_campaign, created_at, status')
    .gte('created_at', dateFilter);

  const { data: purchases } = await supabase
    .from('purchases')
    .select('user_id, amount')
    .eq('status', 'completed')
    .gte('created_at', dateFilter);

  // Get UTM sources for buyers
  const buyerIds = new Set(purchases?.map((p) => p.user_id) || []);
  const { data: buyerUsers } = await supabase
    .from('users')
    .select('id, utm_source')
    .in('id', Array.from(buyerIds).slice(0, 400));

  const buyerSourceMap: Record<string, string> = {};
  buyerUsers?.forEach((u) => {
    buyerSourceMap[u.id] = u.utm_source || 'direct';
  });

  // Group by source
  const sources: Record<string, {
    leads: number;
    buyers: number;
    revenue: number;
  }> = {};

  users?.forEach((u) => {
    const src = u.utm_source || 'direct';
    if (!sources[src]) sources[src] = { leads: 0, buyers: 0, revenue: 0 };
    sources[src].leads += 1;
    if (u.status === 'buyer' || u.status === 'booked') {
      sources[src].buyers += 1;
    }
  });

  purchases?.forEach((p) => {
    const src = buyerSourceMap[p.user_id] || 'direct';
    if (sources[src]) {
      sources[src].revenue += p.amount || 0;
    }
  });

  return Object.entries(sources).map(([source, stats]) => ({
    source,
    ...stats,
    conversionRate: stats.leads > 0 ? Math.round((stats.buyers / stats.leads) * 100) : 0,
  }));
}

// ─── Time-to-Conversion ───────────────────────────────
export async function getTimeToConversion() {
  const supabase = createServerClient();

  const { data: purchases } = await supabase
    .from('purchases')
    .select('user_id, created_at')
    .eq('status', 'completed');

  if (!purchases?.length) {
    return { avgDays: 0, medianDays: 0, count: 0 };
  }

  const userIds = [...new Set(purchases.map((p) => p.user_id))];
  const { data: users } = await supabase
    .from('users')
    .select('id, created_at')
    .in('id', userIds.slice(0, 400));

  const userCreatedMap: Record<string, string> = {};
  users?.forEach((u) => { userCreatedMap[u.id] = u.created_at; });

  const times: number[] = [];
  purchases.forEach((p) => {
    const userCreated = userCreatedMap[p.user_id];
    if (userCreated) {
      const diff = new Date(p.created_at).getTime() - new Date(userCreated).getTime();
      times.push(diff / (1000 * 60 * 60 * 24)); // days
    }
  });

  times.sort((a, b) => a - b);
  const avg = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0;
  const median = times.length > 0 ? times[Math.floor(times.length / 2)] : 0;

  return { avgDays: Math.round(avg * 10) / 10, medianDays: Math.round(median * 10) / 10, count: times.length };
}


// ════════════════════════════════════════════════════════
// 3RD PARTY API INTEGRATIONS
// ════════════════════════════════════════════════════════

// ─── Meta Ads API ─────────────────────────────────────
export async function getMetaAdsData(dateRange?: string) {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !adAccountId) {
    return { configured: false, data: null };
  }

  try {
    const { since, until } = getApiDateRange(dateRange);
    const fields = 'campaign_name,impressions,clicks,spend,actions,cost_per_action_type,ctr,cpc';
    const url = `https://graph.facebook.com/v19.0/act_${adAccountId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=campaign&limit=50&access_token=${token}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    const json = await res.json();

    return {
      configured: true,
      data: json.data?.map((campaign: any) => ({
        name: campaign.campaign_name,
        impressions: parseInt(campaign.impressions || '0'),
        clicks: parseInt(campaign.clicks || '0'),
        spend: parseFloat(campaign.spend || '0'),
        ctr: parseFloat(campaign.ctr || '0'),
        cpc: parseFloat(campaign.cpc || '0'),
        conversions: campaign.actions?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
        costPerConversion: campaign.cost_per_action_type?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || 0,
      })) || [],
    };
  } catch (error) {
    console.error('Meta Ads API error:', error);
    return { configured: true, data: null, error: String(error) };
  }
}

// ─── Google Ads API ───────────────────────────────────
export async function getGoogleAdsData(dateRange?: string) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

  if (!customerId || !developerToken) {
    return { configured: false, data: null };
  }

  try {
    const { since, until } = getApiDateRange(dateRange);
    // Placeholder - replace with actual Google Ads API call
    void since; void until;
    return {
      configured: true,
      data: [],
      note: 'Requires google-ads-api package integration',
    };
  } catch (error) {
    return { configured: true, data: null, error: String(error) };
  }
}

// ─── GA4 Data API ─────────────────────────────────────
export async function getGA4Data(dateRange?: string) {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) {
    return { configured: false, data: null };
  }

  try {
    const { since, until } = getApiDateRange(dateRange);
    void since; void until;
    return {
      configured: true,
      data: [],
      note: 'Requires @google-analytics/data package',
    };
  } catch (error) {
    return { configured: true, data: null, error: String(error) };
  }
}

// ─── Calendly API ─────────────────────────────────────
export async function getCalendlyData() {
  const token = process.env.CALENDLY_API_TOKEN;

  if (!token) {
    return { configured: false, data: null };
  }

  try {
    const userRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();
    const userUri = userData.resource?.uri;

    if (!userUri) throw new Error('Could not get Calendly user URI');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const eventsRes = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&min_start_time=${thirtyDaysAgo.toISOString()}&max_start_time=${now.toISOString()}&count=100&status=active`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      }
    );
    const eventsData = await eventsRes.json();

    return {
      configured: true,
      data: eventsData.collection?.map((event: any) => ({
        id: event.uri,
        name: event.name,
        startTime: event.start_time,
        endTime: event.end_time,
        status: event.status,
        meetingUrl: event.location?.join_url,
      })) || [],
    };
  } catch (error) {
    return { configured: true, data: null, error: String(error) };
  }
}

// ─── Video Event Stats (Supabase) ─────────────────────
export async function getVideoEventStats() {
  const supabase = createServerClient();
  const VIDEO_ID = '1178865564';

  const { data: events, error } = await supabase
    .from('video_events')
    .select('anon_id, user_email, event_type, percent_watched, drop_off_second, created_at')
    .eq('video_id', VIDEO_ID)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error || !events || events.length === 0) {
    return {
      totalPlays: 0,
      uniqueViewers: 0,
      avgWatchPercent: 0,
      completionRate: 0,
      dropOff: { 25: 0, 50: 0, 75: 0, 100: 0 },
      dropOffCurve: [] as { second: number; viewers: number }[],
      recentEvents: [] as { time: string; type: string; percent: number }[],
    };
  }

  // Viewer key: prefer anon_id, fall back to user_email
  const viewerKey = (e: { anon_id: string | null; user_email: string | null }) =>
    e.anon_id ?? e.user_email ?? 'unknown';

  // Total plays
  const playEvents = events.filter((e) => e.event_type === 'play');
  const totalPlays = playEvents.length;

  // Unique viewers (anyone who triggered any event)
  const allViewers = new Set(events.map(viewerKey).filter((k) => k !== 'unknown'));
  const uniqueViewers = allViewers.size;

  // Average watch percent from watch_progress and timeupdate events
  const watchEvents = events.filter(
    (e) => (e.event_type === 'watch_progress' || e.event_type === 'timeupdate') && e.percent_watched != null
  );
  const avgWatchPercent = watchEvents.length > 0
    ? Math.round(watchEvents.reduce((s, e) => s + (e.percent_watched ?? 0), 0) / watchEvents.length)
    : 0;

  // Completion rate: completed events / play events
  const completedCount = events.filter((e) => e.event_type === 'completed').length;
  const completionRate = totalPlays > 0 ? Math.round((completedCount / totalPlays) * 100) : 0;

  // Drop-off milestones: how many unique viewers reached each threshold
  // A viewer "reached X%" if they have a watch_progress event >= X or a completed event
  const viewerMaxPercent: Record<string, number> = {};
  for (const e of events) {
    const key = viewerKey(e);
    if (key === 'unknown') continue;
    const pct = e.event_type === 'completed' ? 100 : (e.percent_watched ?? 0);
    if (pct > (viewerMaxPercent[key] ?? 0)) viewerMaxPercent[key] = pct;
  }
  const viewerMaxes = Object.values(viewerMaxPercent);
  const dropOff = {
    25: viewerMaxes.filter((p) => p >= 25).length,
    50: viewerMaxes.filter((p) => p >= 50).length,
    75: viewerMaxes.filter((p) => p >= 75).length,
    100: viewerMaxes.filter((p) => p >= 100).length,
  };

  // Drop-off curve: for each 15-second bucket, count viewers still watching
  const buckets: Record<number, Set<string>> = {};
  for (const e of events) {
    if (e.event_type !== 'timeupdate' && e.event_type !== 'watch_progress') continue;
    const key = viewerKey(e);
    if (key === 'unknown') continue;
    const sec = Math.floor((e.drop_off_second ?? 0) / 15) * 15;
    if (!buckets[sec]) buckets[sec] = new Set();
    buckets[sec].add(key);
  }
  const dropOffCurve = Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([sec, viewers]) => ({ second: Number(sec), viewers: viewers.size }));

  // Recent events (last 20)
  const recentEvents = events.slice(0, 20).map((e) => ({
    time: e.created_at,
    type: e.event_type,
    percent: e.percent_watched ?? 0,
  }));

  return { totalPlays, uniqueViewers, avgWatchPercent, completionRate, dropOff, dropOffCurve, recentEvents };
}

// ─── Vimeo Analytics API ──────────────────────────────
export async function getVimeoAnalytics() {
  const token = process.env.VIMEO_ACCESS_TOKEN;

  if (!token) {
    return { configured: false, data: null };
  }

  const TARGET_ID = '/videos/1178865564';

  try {
    const res = await fetch('https://api.vimeo.com/me/videos?per_page=100&sort=date&direction=desc&fields=uri,name,stats,duration', {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 600 },
    });
    const json = await res.json();

    const all = (json.data ?? []).map((video: any) => {
      const plays    = video.stats?.plays    ?? 0;
      const finishes = video.stats?.finishes ?? 0;
      return {
        id: video.uri,
        name: video.name,
        plays,
        finishes,
        duration: video.duration ?? 0,
        completionRate: plays > 0 ? Math.round((finishes / plays) * 100) : 0,
      };
    });

    const data = all.filter((v: any) => v.id === TARGET_ID);

    return { configured: true, data };
  } catch (error) {
    return { configured: true, data: null, error: String(error) };
  }
}


// ════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════

function getDateFilter(range?: string): string {
  const now = new Date();
  switch (range) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0)).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return '2020-01-01T00:00:00Z';
  }
}

function getPreviousPeriodFilter(range?: string) {
  const now = new Date();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  return {
    start: new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function getApiDateRange(range?: string) {
  const now = new Date();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    since: since.toISOString().split('T')[0],
    until: now.toISOString().split('T')[0],
  };
}

function getFunnelLabel(stage: string): string {
  const labels: Record<string, string> = {
    lead: 'נרשם',
    engaged: 'מעורב',
    high_intent: 'כוונה גבוהה',
    buyer: 'רוכש',
    booked: 'פגישה נקבעה',
  };
  return labels[stage] || stage;
}

// ─── A/B Proposals ────────────────────────────────────
export async function getABProposals() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('ab_proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Table may not exist yet (migration not run)
    console.error('getABProposals error:', error.message);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id as string,
    category: p.category as 'copy' | 'ux' | 'funnel',
    title: p.title as string,
    hypothesis: p.hypothesis as string,
    variant_a: p.variant_a as string,
    variant_b: p.variant_b as string,
    metric: p.metric as string,
    page_or_element: p.page_or_element as string,
    estimated_traffic: (p.estimated_traffic as number) || 0,
    days_to_significance: (p.days_to_significance as number) || 14,
    priority: (p.priority as 'high' | 'medium' | 'low') || 'medium',
    reasoning: (p.reasoning as string) || '',
    status: (p.status as 'proposed' | 'approved' | 'running' | 'paused' | 'completed') || 'proposed',
    visitors_a: (p.visitors_a as number) || 0,
    visitors_b: (p.visitors_b as number) || 0,
    conversions_a: (p.conversions_a as number) || 0,
    conversions_b: (p.conversions_b as number) || 0,
    confidence: (p.confidence as number) || 0,
    winner: p.winner as 'a' | 'b' | 'none' | null,
    approved_at: p.approved_at as string | null,
    started_at: p.started_at as string | null,
    completed_at: p.completed_at as string | null,
    created_at: p.created_at as string,
  }));
}

// ─── Product Map ──────────────────────────────────────
export const PRODUCT_MAP: Record<string, { name: string; nameEn: string; price: number }> = {
  free_training: { name: 'שיעור במתנה', nameEn: 'Free Training', price: 0 },
  challenge: { name: 'אתגר 7 ימים', nameEn: '7-Day Challenge', price: 197 },
  challenge_197: { name: 'אתגר 7 ימים', nameEn: '7-Day Challenge', price: 197 },
  workshop: { name: 'סדנת יום', nameEn: 'One-Day Workshop', price: 1080 },
  workshop_1080: { name: 'סדנת יום', nameEn: 'One-Day Workshop', price: 1080 },
  course: { name: 'קורס דיגיטלי', nameEn: 'Digital Course', price: 1800 },
  course_1800: { name: 'קורס דיגיטלי', nameEn: 'Digital Course', price: 1800 },
  strategy: { name: 'פגישת אסטרטגיה', nameEn: 'Strategy Session', price: 4000 },
  strategy_4000: { name: 'פגישת אסטרטגיה', nameEn: 'Strategy Session', price: 4000 },
  premium: { name: 'יום צילום פרמיום', nameEn: 'Premium Filming Day', price: 14000 },
  premium_14000: { name: 'יום צילום פרמיום', nameEn: 'Premium Filming Day', price: 14000 },
  partnership: { name: 'שותפות אסטרטגית', nameEn: 'Strategic Partnership', price: 10000 },
  hive: { name: 'הכוורת', nameEn: 'The Hive', price: 29 },
};
