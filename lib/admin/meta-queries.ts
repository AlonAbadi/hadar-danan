import { createServerClient } from '@/lib/supabase/server';

// ════════════════════════════════════════════════════════
// META MARKETING API + CRM cross-reference
// ════════════════════════════════════════════════════════
// All Meta calls are read-only (GET /insights), cached for 5 min via
// Next.js fetch revalidate, and never retry on permission errors.
// Rate limit: 200 calls/hour/user-app pair — 5 calls × 12/hour = 60. Safe.

const META_SOURCES = new Set([
  'facebook', 'fb', 'meta', 'ig', 'instagram',
  'Facebook', 'FB', 'Meta', 'IG', 'Instagram',
]);

const API_VERSION = 'v19.0';
const REVALIDATE_SEC = 300;

type ActionEntry = { action_type: string; value: string };

function pickAction(actions: ActionEntry[] | undefined, types: string[]): number {
  if (!actions) return 0;
  for (const t of types) {
    const found = actions.find(a => a.action_type === t);
    if (found) return parseFloat(found.value) || 0;
  }
  return 0;
}

function getRange(range?: string) {
  const now = new Date();
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 30;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    since: since.toISOString().split('T')[0],
    until: now.toISOString().split('T')[0],
    days,
  };
}

function metaCreds() {
  const token = process.env.META_ADS_ACCESS_TOKEN ?? process.env.META_CAPI_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;
  return { token, accountId };
}

async function metaFetch(path: string): Promise<{ ok: true; json: any } | { ok: false; error: string }> {
  try {
    const res = await fetch(path, { next: { revalidate: REVALIDATE_SEC } });
    const json = await res.json();
    if (json.error) {
      const msg = `${json.error.message ?? 'Unknown'} (code: ${json.error.code ?? '?'}, type: ${json.error.type ?? '?'})`;
      // Permission errors — never retry. Caller decides next action.
      return { ok: false, error: msg };
    }
    return { ok: true, json };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Campaign-level insights + CRM cross-reference ────
export type MetaCampaignRow = {
  campaignId: string;
  name: string;
  status: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  frequency: number;
  metaLeads: number;
  metaPurchases: number;
  metaRevenue: number;
  crmLeads: number;
  crmBuyers: number;
  crmRevenue: number;
  cpl: number;
  cpa: number;
  trueRoas: number;
};

export async function getMetaCampaigns(dateRange?: string): Promise<{
  configured: boolean;
  error?: string;
  dateRange?: { since: string; until: string };
  rows?: MetaCampaignRow[];
}> {
  const { token, accountId } = metaCreds();
  if (!token || !accountId) return { configured: false };

  const { since, until } = getRange(dateRange);
  const fields = 'campaign_id,campaign_name,impressions,reach,clicks,spend,ctr,cpc,frequency,actions,action_values';
  const url = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=campaign&limit=100&access_token=${token}`;

  const result = await metaFetch(url);
  if (!result.ok) return { configured: true, error: result.error, dateRange: { since, until } };

  const campaigns = (result.json.data ?? []) as any[];

  // Cross-reference CRM data by utm_campaign matching campaign_name
  const supabase = createServerClient();
  const dateFilterIso = new Date(`${since}T00:00:00Z`).toISOString();

  const { data: users } = await supabase
    .from('users')
    .select('id, utm_source, utm_campaign')
    .gte('created_at', dateFilterIso);

  const { data: purchases } = await supabase
    .from('purchases')
    .select('user_id, amount')
    .eq('status', 'completed')
    .gte('created_at', dateFilterIso);

  const buyerIds = new Set((purchases ?? []).map(p => p.user_id).filter(Boolean));
  const { data: buyerUsers } = buyerIds.size > 0
    ? await supabase.from('users').select('id, utm_source, utm_campaign').in('id', Array.from(buyerIds))
    : { data: [] };

  const buyerMap: Record<string, { source: string; campaign: string }> = {};
  (buyerUsers ?? []).forEach(u => {
    buyerMap[u.id] = { source: u.utm_source || '', campaign: u.utm_campaign || '' };
  });

  const metaUsersByCampaign: Record<string, number> = {};
  (users ?? []).forEach(u => {
    if (!u.utm_source || !META_SOURCES.has(u.utm_source)) return;
    const key = (u.utm_campaign || '').toLowerCase().trim();
    metaUsersByCampaign[key] = (metaUsersByCampaign[key] ?? 0) + 1;
  });

  const buyersByCampaign: Record<string, { count: number; revenue: number }> = {};
  (purchases ?? []).forEach(p => {
    const u = buyerMap[p.user_id];
    if (!u || !u.source || !META_SOURCES.has(u.source)) return;
    const key = (u.campaign || '').toLowerCase().trim();
    if (!buyersByCampaign[key]) buyersByCampaign[key] = { count: 0, revenue: 0 };
    buyersByCampaign[key].revenue += p.amount || 0;
  });

  // Count unique buyers
  const buyerSetByCampaign: Record<string, Set<string>> = {};
  (purchases ?? []).forEach(p => {
    const u = buyerMap[p.user_id];
    if (!u || !u.source || !META_SOURCES.has(u.source)) return;
    const key = (u.campaign || '').toLowerCase().trim();
    if (!buyerSetByCampaign[key]) buyerSetByCampaign[key] = new Set();
    buyerSetByCampaign[key].add(p.user_id);
  });
  Object.entries(buyerSetByCampaign).forEach(([k, s]) => {
    if (buyersByCampaign[k]) buyersByCampaign[k].count = s.size;
  });

  const rows: MetaCampaignRow[] = campaigns.map(c => {
    const spend = parseFloat(c.spend || '0');
    const key = (c.campaign_name || '').toLowerCase().trim();
    const crmLeads = metaUsersByCampaign[key] ?? 0;
    const crm = buyersByCampaign[key] ?? { count: 0, revenue: 0 };

    const metaLeads = pickAction(c.actions, ['lead', 'offsite_conversion.fb_pixel_lead']);
    const metaPurchases = pickAction(c.actions, ['purchase', 'offsite_conversion.fb_pixel_purchase']);
    const metaRevenue = pickAction(c.action_values, ['purchase', 'offsite_conversion.fb_pixel_purchase']);

    return {
      campaignId: c.campaign_id,
      name: c.campaign_name,
      status: c.status ?? '',
      impressions: parseInt(c.impressions || '0'),
      reach: parseInt(c.reach || '0'),
      clicks: parseInt(c.clicks || '0'),
      spend,
      ctr: parseFloat(c.ctr || '0'),
      cpc: parseFloat(c.cpc || '0'),
      frequency: parseFloat(c.frequency || '0'),
      metaLeads,
      metaPurchases,
      metaRevenue,
      crmLeads,
      crmBuyers: crm.count,
      crmRevenue: crm.revenue,
      cpl: crmLeads > 0 ? spend / crmLeads : 0,
      cpa: crm.count > 0 ? spend / crm.count : 0,
      trueRoas: spend > 0 ? crm.revenue / spend : 0,
    };
  });

  rows.sort((a, b) => b.spend - a.spend);
  return { configured: true, dateRange: { since, until }, rows };
}

// ─── Ad-level top performers ──────────────────────────
export type MetaAdRow = {
  adId: string;
  name: string;
  campaign: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  metaLeads: number;
  cplMeta: number;
};

export async function getMetaTopAds(dateRange?: string, limit = 15): Promise<{
  configured: boolean;
  error?: string;
  rows?: MetaAdRow[];
}> {
  const { token, accountId } = metaCreds();
  if (!token || !accountId) return { configured: false };

  const { since, until } = getRange(dateRange);
  const fields = 'ad_id,ad_name,campaign_name,impressions,clicks,spend,ctr,cpc,actions';
  const url = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=ad&limit=50&access_token=${token}`;

  const result = await metaFetch(url);
  if (!result.ok) return { configured: true, error: result.error };

  const ads = (result.json.data ?? []) as any[];
  const rows: MetaAdRow[] = ads.map(a => {
    const spend = parseFloat(a.spend || '0');
    const leads = pickAction(a.actions, ['lead', 'offsite_conversion.fb_pixel_lead']);
    return {
      adId: a.ad_id,
      name: a.ad_name,
      campaign: a.campaign_name,
      impressions: parseInt(a.impressions || '0'),
      clicks: parseInt(a.clicks || '0'),
      spend,
      ctr: parseFloat(a.ctr || '0'),
      cpc: parseFloat(a.cpc || '0'),
      metaLeads: leads,
      cplMeta: leads > 0 ? spend / leads : 0,
    };
  });

  rows.sort((a, b) => b.spend - a.spend);
  return { configured: true, rows: rows.slice(0, limit) };
}

// ─── Daily trend (spend + leads per day) ──────────────
export type MetaDailyPoint = {
  date: string;
  spend: number;
  metaLeads: number;
  crmLeads: number;
};

export async function getMetaDailyTrend(dateRange?: string): Promise<{
  configured: boolean;
  error?: string;
  points?: MetaDailyPoint[];
}> {
  const { token, accountId } = metaCreds();
  if (!token || !accountId) return { configured: false };

  const { since, until } = getRange(dateRange);
  const fields = 'spend,actions,date_start';
  const url = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=account&time_increment=1&access_token=${token}`;

  const result = await metaFetch(url);
  if (!result.ok) return { configured: true, error: result.error };

  const days = (result.json.data ?? []) as any[];

  // CRM leads per day (only meta-sourced)
  const supabase = createServerClient();
  const dateFilterIso = new Date(`${since}T00:00:00Z`).toISOString();
  const { data: users } = await supabase
    .from('users')
    .select('utm_source, created_at')
    .gte('created_at', dateFilterIso);

  const crmByDay: Record<string, number> = {};
  (users ?? []).forEach(u => {
    if (!u.utm_source || !META_SOURCES.has(u.utm_source)) return;
    const d = u.created_at.split('T')[0];
    crmByDay[d] = (crmByDay[d] ?? 0) + 1;
  });

  const points: MetaDailyPoint[] = days.map(d => ({
    date: d.date_start,
    spend: parseFloat(d.spend || '0'),
    metaLeads: pickAction(d.actions, ['lead', 'offsite_conversion.fb_pixel_lead']),
    crmLeads: crmByDay[d.date_start] ?? 0,
  }));

  points.sort((a, b) => a.date.localeCompare(b.date));
  return { configured: true, points };
}

// ─── Demographics breakdown (age × gender) ────────────
export type MetaDemoRow = {
  age: string;
  gender: string;
  impressions: number;
  spend: number;
  metaLeads: number;
  ctr: number;
};

export async function getMetaDemographics(dateRange?: string): Promise<{
  configured: boolean;
  error?: string;
  rows?: MetaDemoRow[];
}> {
  const { token, accountId } = metaCreds();
  if (!token || !accountId) return { configured: false };

  const { since, until } = getRange(dateRange);
  const fields = 'impressions,spend,actions,ctr';
  const url = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=account&breakdowns=age,gender&access_token=${token}`;

  const result = await metaFetch(url);
  if (!result.ok) return { configured: true, error: result.error };

  const rows: MetaDemoRow[] = (result.json.data ?? []).map((r: any) => ({
    age: r.age || '—',
    gender: r.gender || '—',
    impressions: parseInt(r.impressions || '0'),
    spend: parseFloat(r.spend || '0'),
    metaLeads: pickAction(r.actions, ['lead', 'offsite_conversion.fb_pixel_lead']),
    ctr: parseFloat(r.ctr || '0'),
  }));

  rows.sort((a, b) => b.spend - a.spend);
  return { configured: true, rows };
}

// ─── Placements breakdown ─────────────────────────────
export type MetaPlacementRow = {
  platform: string;
  position: string;
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  metaLeads: number;
  cplMeta: number;
};

export async function getMetaPlacements(dateRange?: string): Promise<{
  configured: boolean;
  error?: string;
  rows?: MetaPlacementRow[];
}> {
  const { token, accountId } = metaCreds();
  if (!token || !accountId) return { configured: false };

  const { since, until } = getRange(dateRange);
  const fields = 'impressions,clicks,spend,ctr,actions';
  const url = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=account&breakdowns=publisher_platform,platform_position&access_token=${token}`;

  const result = await metaFetch(url);
  if (!result.ok) return { configured: true, error: result.error };

  const rows: MetaPlacementRow[] = (result.json.data ?? []).map((r: any) => {
    const spend = parseFloat(r.spend || '0');
    const leads = pickAction(r.actions, ['lead', 'offsite_conversion.fb_pixel_lead']);
    return {
      platform: r.publisher_platform || '—',
      position: r.platform_position || '—',
      impressions: parseInt(r.impressions || '0'),
      clicks: parseInt(r.clicks || '0'),
      spend,
      ctr: parseFloat(r.ctr || '0'),
      metaLeads: leads,
      cplMeta: leads > 0 ? spend / leads : 0,
    };
  });

  rows.sort((a, b) => b.spend - a.spend);
  return { configured: true, rows };
}

// ─── Aggregate KPIs (computed from campaigns) ─────────
export function aggregateKpis(rows: MetaCampaignRow[]) {
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalMetaLeads = rows.reduce((s, r) => s + r.metaLeads, 0);
  const totalCrmLeads = rows.reduce((s, r) => s + r.crmLeads, 0);
  const totalCrmBuyers = rows.reduce((s, r) => s + r.crmBuyers, 0);
  const totalCrmRevenue = rows.reduce((s, r) => s + r.crmRevenue, 0);
  const avgFreq = rows.length > 0
    ? rows.reduce((s, r) => s + r.frequency * r.impressions, 0) / Math.max(totalImpressions, 1)
    : 0;

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalMetaLeads,
    totalCrmLeads,
    totalCrmBuyers,
    totalCrmRevenue,
    overallCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    cplCrm: totalCrmLeads > 0 ? totalSpend / totalCrmLeads : 0,
    cpaCrm: totalCrmBuyers > 0 ? totalSpend / totalCrmBuyers : 0,
    trueRoas: totalSpend > 0 ? totalCrmRevenue / totalSpend : 0,
    avgFrequency: avgFreq,
    leakage: totalMetaLeads > 0 ? ((totalMetaLeads - totalCrmLeads) / totalMetaLeads) * 100 : 0,
  };
}
