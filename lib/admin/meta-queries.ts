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
// Only TWO categories of intent: lead-gen (which includes quiz campaigns)
// and sales (challenge purchase). Quiz campaigns are lead campaigns whose
// optimisation event is "reached the lead form" (QuizComplete pixel),
// not "made a purchase".
export type CampaignKind = 'lead' | 'sale' | 'other';

export type MetaCampaignRow = {
  campaignId: string;
  name: string;
  status: string;
  objective: string;
  kind: CampaignKind;
  isQuiz: boolean;
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
  // Quiz-specific pixel counts (only meaningful for isQuiz campaigns)
  metaQuizComplete: number;  // QuizComplete pixel = reached lead form
  metaQuizDetails: number;   // QuizRecommended/QuizResult pixel = entered details
  crmLeads: number;
  crmBuyers: number;
  crmRevenue: number;
  cpl: number;
  cpa: number;
  trueRoas: number;
};

// Quiz keywords — matched against campaign name via string.includes()
// (avoid regex literals with Hebrew chars — bundler/transpiler edge cases).
// Includes alternative spellings: "קוויז" (5 letters) and "קויז" (4 letters).
const QUIZ_KEYWORDS = ['quiz', 'קוויז', 'קויז', 'שאלון', 'אבחון'];

// Challenge keyword — only the challenge campaign is sales.
const CHALLENGE_KEYWORDS = ['אתגר', 'challenge'];

function classifyCampaign(name: string, objective: string): { kind: CampaignKind; isQuiz: boolean } {
  const lower = (name || '').toLowerCase().trim();
  const isQuiz = QUIZ_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
  if (isQuiz) return { kind: 'lead', isQuiz: true };

  // Challenge campaign — sales (only)
  const isChallenge = CHALLENGE_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
  if (isChallenge) return { kind: 'sale', isQuiz: false };

  // Fall back to Meta's stated objective
  const o = (objective || '').toUpperCase();
  if (o.includes('LEAD')) return { kind: 'lead', isQuiz: false };
  if (o === 'OUTCOME_SALES' || o === 'CONVERSIONS' || o === 'PRODUCT_CATALOG_SALES') return { kind: 'sale', isQuiz: false };
  return { kind: 'other', isQuiz: false };
}

// Sum action values whose action_type contains any of the provided substrings.
// Used for custom Pixel events which Meta returns with prefixes like
// `offsite_conversion.fb_pixel_custom.QuizComplete` — partial match catches them.
function sumActionsContaining(actions: ActionEntry[] | undefined, patterns: string[]): number {
  if (!actions || !actions.length) return 0;
  let total = 0;
  for (const a of actions) {
    const t = (a.action_type || '').toLowerCase();
    if (patterns.some(p => t.includes(p.toLowerCase()))) {
      total += parseFloat(a.value) || 0;
    }
  }
  return total;
}

// Fetch campaign metadata (objective, status) — separate from insights
async function fetchCampaignMeta(token: string, accountId: string): Promise<Record<string, { objective: string; status: string }>> {
  const url = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/campaigns?fields=id,name,objective,status&limit=200&access_token=${token}`;
  const result = await metaFetch(url);
  if (!result.ok) return {};
  const map: Record<string, { objective: string; status: string }> = {};
  ((result.json.data ?? []) as any[]).forEach(c => {
    map[c.id] = { objective: c.objective ?? '', status: c.status ?? '' };
  });
  return map;
}

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

  const [result, campaignMeta] = await Promise.all([
    metaFetch(url),
    fetchCampaignMeta(token, accountId),
  ]);
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

  // Build set of Meta campaign names (lowercased) so we can match users by
  // utm_campaign WITHOUT relying on utm_source — Meta auto-tag sometimes
  // sets utm_source to inconsistent values (fb, facebook, facebook_ads, ig,
  // instagram, etc.) and filtering by an exact-set check drops many legit
  // leads. Match by utm_campaign === campaign_name instead.
  const metaCampaignNames = new Set(
    campaigns.map(c => (c.campaign_name || '').toLowerCase().trim()).filter(Boolean)
  );

  const metaUsersByCampaign: Record<string, number> = {};
  (users ?? []).forEach(u => {
    const key = (u.utm_campaign || '').toLowerCase().trim();
    if (!key || !metaCampaignNames.has(key)) return;
    metaUsersByCampaign[key] = (metaUsersByCampaign[key] ?? 0) + 1;
  });

  const buyersByCampaign: Record<string, { count: number; revenue: number }> = {};
  const buyerSetByCampaign: Record<string, Set<string>> = {};
  (purchases ?? []).forEach(p => {
    const u = buyerMap[p.user_id];
    if (!u) return;
    const key = (u.campaign || '').toLowerCase().trim();
    if (!key || !metaCampaignNames.has(key)) return;
    if (!buyersByCampaign[key]) buyersByCampaign[key] = { count: 0, revenue: 0 };
    buyersByCampaign[key].revenue += p.amount || 0;
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

    const meta = campaignMeta[c.campaign_id] ?? { objective: '', status: '' };
    const { kind, isQuiz } = classifyCampaign(c.campaign_name || '', meta.objective);

    // Quiz pixel counts — only meaningful when isQuiz, but compute for all
    const metaQuizComplete = sumActionsContaining(c.actions, ['QuizComplete']);
    const metaQuizDetails  = sumActionsContaining(c.actions, ['QuizRecommended', 'QuizResult']);

    return {
      campaignId: c.campaign_id,
      name: c.campaign_name,
      status: meta.status,
      objective: meta.objective,
      kind,
      isQuiz,
      metaQuizComplete,
      metaQuizDetails,
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

// ─── Quiz funnel — completed quiz vs entered details ─
// Cold gap: how many completed all 6 questions but bailed before
// submitting the lead form. Detection: quiz_results.user_id IS NULL.
//
// LIMITATION: quiz_results has no utm columns, so this is an
// OVERALL gap across all sources. Per-campaign breakdown would
// need a migration adding utm_source/utm_campaign to quiz_results.
export type QuizFunnelByProduct = {
  product: string;
  completions: number;
  leads: number;
  dropoff: number;
  dropoffPct: number;
};

export type QuizFunnelBySource = {
  source: string;
  campaign: string;
  completions: number;
  leads: number;
  dropoff: number;
  dropoffPct: number;
};

export async function getQuizFunnel(dateRange?: string): Promise<{
  completions: number;
  leads: number;
  dropoff: number;
  dropoffPct: number;
  byProduct: QuizFunnelByProduct[];
  byMetaCampaign: QuizFunnelBySource[];
  metaTotal: { completions: number; leads: number; dropoff: number; dropoffPct: number };
  dateRange: { since: string; until: string };
}> {
  const { since, until } = getRange(dateRange);
  const sinceIso = new Date(`${since}T00:00:00Z`).toISOString();

  const supabase = createServerClient();
  const { data: rows } = await supabase
    .from('quiz_results')
    .select('user_id, recommended_product, utm_source, utm_campaign')
    .gte('created_at', sinceIso);

  const all = rows ?? [];
  const completions = all.length;
  const leads = all.filter(r => r.user_id != null).length;
  const dropoff = completions - leads;
  const dropoffPct = completions > 0 ? (dropoff / completions) * 100 : 0;

  // Filter to meta-only and group by campaign
  const metaRows = all.filter(r => r.utm_source && META_SOURCES.has(r.utm_source));
  const metaCampaignMap: Record<string, { source: string; campaign: string; completions: number; leads: number }> = {};
  metaRows.forEach(r => {
    const campaign = r.utm_campaign || '(ללא קמפיין)';
    const key = `${r.utm_source}||${campaign}`;
    if (!metaCampaignMap[key]) metaCampaignMap[key] = { source: r.utm_source!, campaign, completions: 0, leads: 0 };
    metaCampaignMap[key].completions += 1;
    if (r.user_id != null) metaCampaignMap[key].leads += 1;
  });

  const byMetaCampaign: QuizFunnelBySource[] = Object.values(metaCampaignMap)
    .map(d => ({
      ...d,
      dropoff: d.completions - d.leads,
      dropoffPct: d.completions > 0 ? ((d.completions - d.leads) / d.completions) * 100 : 0,
    }))
    .sort((a, b) => b.completions - a.completions);

  const metaCompletions = metaRows.length;
  const metaLeads = metaRows.filter(r => r.user_id != null).length;
  const metaDropoff = metaCompletions - metaLeads;
  const metaTotal = {
    completions: metaCompletions,
    leads: metaLeads,
    dropoff: metaDropoff,
    dropoffPct: metaCompletions > 0 ? (metaDropoff / metaCompletions) * 100 : 0,
  };

  const productMap: Record<string, { completions: number; leads: number }> = {};
  all.forEach(r => {
    const p = r.recommended_product || 'unknown';
    if (!productMap[p]) productMap[p] = { completions: 0, leads: 0 };
    productMap[p].completions += 1;
    if (r.user_id != null) productMap[p].leads += 1;
  });

  const byProduct: QuizFunnelByProduct[] = Object.entries(productMap)
    .map(([product, d]) => ({
      product,
      completions: d.completions,
      leads: d.leads,
      dropoff: d.completions - d.leads,
      dropoffPct: d.completions > 0 ? ((d.completions - d.leads) / d.completions) * 100 : 0,
    }))
    .sort((a, b) => b.completions - a.completions);

  return { completions, leads, dropoff, dropoffPct, byProduct, byMetaCampaign, metaTotal, dateRange: { since, until } };
}

// ─── Aggregate KPIs (computed from campaigns) ─────────
export function aggregateKpis(rows: MetaCampaignRow[]) {
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalMetaLeads = rows.reduce((s, r) => s + r.metaLeads, 0);
  const totalMetaPurchases = rows.reduce((s, r) => s + r.metaPurchases, 0);
  const totalMetaRevenue = rows.reduce((s, r) => s + r.metaRevenue, 0);
  const totalMetaQuizComplete = rows.reduce((s, r) => s + r.metaQuizComplete, 0);
  const totalMetaQuizDetails  = rows.reduce((s, r) => s + r.metaQuizDetails,  0);
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
    totalMetaPurchases,
    totalMetaRevenue,
    totalMetaQuizComplete,
    totalMetaQuizDetails,
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
