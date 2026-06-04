'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import type {
  MetaCampaignRow,
  MetaAdRow,
  MetaDailyPoint,
  MetaDemoRow,
  MetaPlacementRow,
  QuizFunnelByProduct,
  QuizFunnelBySource,
  CampaignKind,
} from '@/lib/admin/meta-queries';

const C = {
  bg:     '#080C14',
  card:   '#141820',
  soft:   '#1D2430',
  border: '#2C323E',
  gold:   '#C9964A',
  goldL:  '#E8B94A',
  goldD:  '#9E7C3A',
  fg:     '#EDE9E1',
  muted:  '#9E9990',
  green:  '#22c55e',
  red:    '#ef4444',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
};

const TT = {
  contentStyle: { background: C.soft, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.fg },
  labelStyle: { color: C.fg, fontWeight: 600 },
  itemStyle: { color: C.muted },
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.fg }}>{title}</span>
        {sub && <span style={{ fontSize: 11, color: C.muted, fontFamily: 'system-ui', fontWeight: 400 }}>{sub}</span>}
      </div>
      {action}
    </div>
  );
}

function Kpi({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <Card>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: accent || C.fg, letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</div>}
      </div>
    </Card>
  );
}

function NotConfigured({ msg }: { msg?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: C.muted, marginBottom: 6 }}>Meta Ads לא מחובר</div>
      <div style={{ fontSize: 13, color: `${C.muted}88` }}>{msg ?? 'הוסף META_ADS_ACCESS_TOKEN ו-META_AD_ACCOUNT_ID ל-env'}</div>
    </div>
  );
}

function ErrorBox({ error, dateRange }: { error: string; dateRange?: { since: string; until: string } }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: '#e05555', marginBottom: 8 }}>שגיאה מ-Meta API</div>
      <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace', maxWidth: 600, margin: '0 auto', wordBreak: 'break-word' }}>{error}</div>
      {dateRange && (
        <div style={{ fontSize: 11, color: `${C.muted}88`, marginTop: 12 }}>
          טווח: {dateRange.since} → {dateRange.until}
        </div>
      )}
    </div>
  );
}

function EmptyBox({ msg }: { msg: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
      <div style={{ fontSize: 14, color: C.muted }}>{msg}</div>
    </div>
  );
}

const RANGE_OPTS = [
  { v: 'today', l: 'היום' },
  { v: '7d',   l: '7 ימים' },
  { v: '30d',  l: '30 ימים' },
  { v: '90d',  l: '90 ימים' },
];

const GENDER_LABEL: Record<string, string> = {
  male: 'גברים',
  female: 'נשים',
  unknown: 'לא ידוע',
};

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  audience_network: 'Audience Network',
  messenger: 'Messenger',
};

const POSITION_LABEL: Record<string, string> = {
  feed: 'Feed',
  story: 'Stories',
  reels: 'Reels',
  instream_video: 'In-stream',
  marketplace: 'Marketplace',
  facebook_reels: 'Reels',
  instagram_reels: 'Reels',
  instagram_stories: 'Stories',
  facebook_stories: 'Stories',
};

function fmtMoney(n: number) {
  return `₪${Math.round(n).toLocaleString()}`;
}

function fmtNum(n: number) {
  return n.toLocaleString();
}

function dropoffColorFor(pct: number) {
  return pct >= 70 ? C.red : pct >= 40 ? C.gold : C.green;
}

const KIND_BADGE: Record<CampaignKind, { label: string; color: string }> = {
  lead:  { label: 'לידים',  color: '#3b82f6' },
  sale:  { label: 'מכירות', color: '#C9964A' },
  other: { label: 'אחר',    color: '#9E9990' },
};

const PRODUCT_LABELS: Record<string, string> = {
  challenge:    'אתגר 7 ימים',
  workshop:     'סדנה יום אחד',
  course:       'קורס דיגיטלי',
  strategy:     'פגישת אסטרטגיה',
  premium:      'יום צילום פרמיום',
  partnership:  'שותפות אסטרטגית',
  hive:         'הכוורת',
};

export default function MetaClient({
  campaigns,
  ads,
  daily,
  demo,
  placements,
  quizFunnel,
  kpis,
  dateRange,
}: {
  campaigns: { configured: boolean; error?: string; dateRange?: { since: string; until: string }; rows?: MetaCampaignRow[] };
  ads: { configured: boolean; error?: string; rows?: MetaAdRow[] };
  daily: { configured: boolean; error?: string; points?: MetaDailyPoint[] };
  demo: { configured: boolean; error?: string; rows?: MetaDemoRow[] };
  placements: { configured: boolean; error?: string; rows?: MetaPlacementRow[] };
  quizFunnel: {
    completions: number; leads: number; dropoff: number; dropoffPct: number;
    byProduct: QuizFunnelByProduct[];
    byMetaCampaign: QuizFunnelBySource[];
    metaTotal: { completions: number; leads: number; dropoff: number; dropoffPct: number };
    dateRange: { since: string; until: string };
  };
  kpis: ReturnType<typeof import('@/lib/admin/meta-queries').aggregateKpis> | null;
  dateRange: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const setRange = (v: string) => router.push(`${pathname}?range=${v}`);
  const [extrasTab, setExtrasTab] = useState<'demo' | 'placements'>('demo');
  const [kindTab, setKindTab] = useState<'all' | CampaignKind>('all');

  // If Meta isn't configured at all — show prompt and exit early
  if (!campaigns.configured) {
    return (
      <div style={{ padding: '36px 48px', direction: 'rtl', fontFamily: "'Assistant', sans-serif", color: C.fg }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>ניתוח קמפיינים — Meta</h1>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>אנליטיקה מלאה של ביצועי Meta Ads מול נתוני CRM אמיתיים</p>
        <Card><NotConfigured /></Card>
      </div>
    );
  }

  // If campaign call errored — show error and exit (don't burn more permission errors)
  if (campaigns.error) {
    return (
      <div style={{ padding: '36px 48px', direction: 'rtl', fontFamily: "'Assistant', sans-serif", color: C.fg }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>ניתוח קמפיינים — Meta</h1>
        <Card><ErrorBox error={campaigns.error} dateRange={campaigns.dateRange} /></Card>
      </div>
    );
  }

  const allRows = campaigns.rows ?? [];
  const allAdRows = ads.rows ?? [];
  const dailyPoints = daily.points ?? [];

  // Filter rows by selected kind tab
  const rows = kindTab === 'all' ? allRows : allRows.filter(r => r.kind === kindTab);

  // Filter ads to those whose campaign matches the kindTab
  const campaignKindMap: Record<string, CampaignKind> = {};
  allRows.forEach(r => { campaignKindMap[r.name] = r.kind; });
  const adRows = kindTab === 'all'
    ? allAdRows
    : allAdRows.filter(a => campaignKindMap[a.campaign] === kindTab);

  // Recompute KPIs based on filtered rows
  const tabKpis = rows.length > 0 ? {
    totalSpend:        rows.reduce((s, r) => s + r.spend, 0),
    totalImpressions:  rows.reduce((s, r) => s + r.impressions, 0),
    totalClicks:       rows.reduce((s, r) => s + r.clicks, 0),
    totalMetaLeads:    rows.reduce((s, r) => s + r.metaLeads, 0),
    totalMetaPurchases:rows.reduce((s, r) => s + r.metaPurchases, 0),
    totalMetaRevenue:  rows.reduce((s, r) => s + r.metaRevenue, 0),
    totalCrmLeads:     rows.reduce((s, r) => s + r.crmLeads, 0),
    totalCrmBuyers:    rows.reduce((s, r) => s + r.crmBuyers, 0),
    totalCrmRevenue:   rows.reduce((s, r) => s + r.crmRevenue, 0),
  } : null;

  const kindCounts = {
    all:   allRows.length,
    lead:  allRows.filter(r => r.kind === 'lead').length,
    sale:  allRows.filter(r => r.kind === 'sale').length,
    other: allRows.filter(r => r.kind === 'other').length,
  };

  const KIND_TABS: { key: 'all' | CampaignKind; label: string; sub: string; color: string }[] = [
    { key: 'all',   label: 'כל הקמפיינים', sub: 'All',                color: C.muted },
    { key: 'lead',  label: 'לידים',         sub: 'Lead Generation (כולל קוויז)', color: C.blue },
    { key: 'sale',  label: 'מכירות',        sub: 'Sales / Purchases',  color: C.gold },
    { key: 'other', label: 'אחר',           sub: 'Other',              color: C.muted },
  ];

  // Quiz campaigns (sub-category of leads — flagged by isQuiz on each row)
  const quizCampaignRows = allRows.filter(r => r.isQuiz);
  const quizMetaCompleteTotal = quizCampaignRows.reduce((s, r) => s + r.metaQuizComplete, 0);
  const quizMetaDetailsTotal  = quizCampaignRows.reduce((s, r) => s + r.metaQuizDetails,  0);
  const quizSpendTotal        = quizCampaignRows.reduce((s, r) => s + r.spend, 0);

  // Demographics aggregation by age + gender
  const demoByAge: Record<string, { spend: number; leads: number; impressions: number }> = {};
  const demoByGender: Record<string, { spend: number; leads: number; impressions: number }> = {};
  (demo.rows ?? []).forEach(r => {
    if (!demoByAge[r.age]) demoByAge[r.age] = { spend: 0, leads: 0, impressions: 0 };
    demoByAge[r.age].spend += r.spend;
    demoByAge[r.age].leads += r.metaLeads;
    demoByAge[r.age].impressions += r.impressions;
    if (!demoByGender[r.gender]) demoByGender[r.gender] = { spend: 0, leads: 0, impressions: 0 };
    demoByGender[r.gender].spend += r.spend;
    demoByGender[r.gender].leads += r.metaLeads;
    demoByGender[r.gender].impressions += r.impressions;
  });

  return (
    <div style={{ padding: '32px 48px 60px', background: C.bg, minHeight: '100vh', fontFamily: "'Assistant', sans-serif", direction: 'rtl', color: C.fg }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.fg, margin: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            ניתוח קמפיינים — Meta
            <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, fontFamily: 'system-ui' }}>Meta Campaign Analysis</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>
            ביצועי קמפיינים מצולבים עם נתוני CRM אמיתיים — ROAS, CPL, CPA לפי לידים שהומרו בפועל
          </p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: C.soft, borderRadius: 8, padding: 3 }}>
          {RANGE_OPTS.map(opt => (
            <button
              key={opt.v}
              onClick={() => setRange(opt.v)}
              style={{
                background: dateRange === opt.v ? C.card : 'transparent',
                border: `1px solid ${dateRange === opt.v ? C.border : 'transparent'}`,
                color: dateRange === opt.v ? C.gold : C.muted,
                fontSize: 12,
                fontWeight: dateRange === opt.v ? 600 : 400,
                padding: '5px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: "'Assistant', sans-serif",
              }}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Kind tabs — separates leads from sales */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {KIND_TABS.filter(t => t.key === 'all' || kindCounts[t.key] > 0).map(t => (
          <button
            key={t.key}
            onClick={() => setKindTab(t.key)}
            style={{
              background: kindTab === t.key ? C.card : 'transparent',
              border: `1px solid ${kindTab === t.key ? t.color : C.border}`,
              color: kindTab === t.key ? t.color : C.muted,
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              fontFamily: "'Assistant', sans-serif", fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontWeight: 600 }}>{t.label}</span>
            <span style={{ fontSize: 10, color: C.muted, fontFamily: 'system-ui' }}>{t.sub}</span>
            <span style={{
              background: kindTab === t.key ? `${t.color}22` : C.soft,
              color: kindTab === t.key ? t.color : C.muted,
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
              fontFamily: 'system-ui',
            }}>
              {kindCounts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* KPIs — tab-aware (lead-centric, sale-centric, quiz-centric, or full) */}
      {tabKpis && (
        kindTab === 'sale' ? (
          // SALES TAB: ROAS-first
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <Kpi label="הוצאה" value={fmtMoney(tabKpis.totalSpend)} accent={C.gold} sub={`${rows.length} קמפיינים`} />
            <Kpi label="רכישות (Meta)" value={fmtNum(tabKpis.totalMetaPurchases)} accent={C.blue} />
            <Kpi label="רכישות (CRM)" value={fmtNum(tabKpis.totalCrmBuyers)} accent={C.gold} />
            <Kpi label="הכנסה (CRM)" value={fmtMoney(tabKpis.totalCrmRevenue)} accent={C.green} />
            <Kpi
              label="True ROAS"
              value={`${tabKpis.totalSpend > 0 ? (tabKpis.totalCrmRevenue / tabKpis.totalSpend).toFixed(2) : '0.00'}x`}
              accent={tabKpis.totalSpend > 0 && tabKpis.totalCrmRevenue / tabKpis.totalSpend >= 2 ? C.green : tabKpis.totalCrmRevenue / tabKpis.totalSpend >= 1 ? C.gold : C.red}
              sub="הכנסה CRM / הוצאה"
            />
            <Kpi label="CPA (CRM)" value={tabKpis.totalCrmBuyers > 0 ? fmtMoney(tabKpis.totalSpend / tabKpis.totalCrmBuyers) : '—'} accent={C.purple} sub="עלות לרכישה" />
            <Kpi label="ערך הזמנה ממוצע" value={tabKpis.totalCrmBuyers > 0 ? fmtMoney(tabKpis.totalCrmRevenue / tabKpis.totalCrmBuyers) : '—'} sub="AOV" />
            <Kpi label="CTR" value={`${tabKpis.totalImpressions > 0 ? ((tabKpis.totalClicks / tabKpis.totalImpressions) * 100).toFixed(2) : '0.00'}%`} sub={`${fmtNum(tabKpis.totalClicks)} קליקים`} />
          </div>
        ) : kindTab === 'lead' ? (
          // LEADS TAB: CPL-first
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
            <Kpi label="הוצאה" value={fmtMoney(tabKpis.totalSpend)} accent={C.gold} sub={`${rows.length} קמפיינים`} />
            <Kpi label="לידים (Meta)" value={fmtNum(tabKpis.totalMetaLeads)} accent={C.blue} />
            <Kpi label="לידים (CRM)" value={fmtNum(tabKpis.totalCrmLeads)} accent={C.green} sub={tabKpis.totalMetaLeads > tabKpis.totalCrmLeads ? `📉 פער ${(((tabKpis.totalMetaLeads - tabKpis.totalCrmLeads) / tabKpis.totalMetaLeads) * 100).toFixed(0)}%` : ''} />
            <Kpi label="CPL (CRM)" value={tabKpis.totalCrmLeads > 0 ? fmtMoney(tabKpis.totalSpend / tabKpis.totalCrmLeads) : '—'} accent={C.purple} sub="עלות לליד אמיתי" />
            <Kpi label="CPL (Meta)" value={tabKpis.totalMetaLeads > 0 ? fmtMoney(tabKpis.totalSpend / tabKpis.totalMetaLeads) : '—'} sub="עלות לליד מדווח" />
            <Kpi label="המרה לליד" value={`${tabKpis.totalClicks > 0 ? ((tabKpis.totalCrmLeads / tabKpis.totalClicks) * 100).toFixed(1) : '0.0'}%`} sub="לידים / קליקים" />
            <Kpi label="רוכשים מהלידים" value={fmtNum(tabKpis.totalCrmBuyers)} accent={C.gold} sub={tabKpis.totalCrmLeads > 0 ? `${((tabKpis.totalCrmBuyers / tabKpis.totalCrmLeads) * 100).toFixed(0)}% lead-to-buyer` : ''} />
            <Kpi label="הכנסה (CRM)" value={fmtMoney(tabKpis.totalCrmRevenue)} accent={C.green} />
          </div>
        ) : (
          // ALL / OTHER — original combined view
          kpis && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                <Kpi label="הוצאה" value={fmtMoney(kpis.totalSpend)} accent={C.gold} sub={`${rows.length} קמפיינים`} />
                <Kpi
                  label="לידים — Meta vs CRM"
                  value={`${fmtNum(kpis.totalMetaLeads)} / ${fmtNum(kpis.totalCrmLeads)}`}
                  accent={C.blue}
                  sub={kpis.leakage > 0 ? `📉 פער ${kpis.leakage.toFixed(0)}% מטא→CRM` : kpis.leakage < 0 ? `📈 CRM גבוה מ-Meta` : ''}
                />
                <Kpi label="רוכשים (CRM)" value={fmtNum(kpis.totalCrmBuyers)} accent={C.gold} />
                <Kpi label="הכנסה (CRM)" value={fmtMoney(kpis.totalCrmRevenue)} accent={C.green} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
                <Kpi label="True ROAS" value={`${kpis.trueRoas.toFixed(2)}x`} accent={kpis.trueRoas >= 2 ? C.green : kpis.trueRoas >= 1 ? C.gold : C.red} sub="הכנסה CRM / הוצאה" />
                <Kpi label="CPL (CRM)" value={fmtMoney(kpis.cplCrm)} accent={C.purple} sub="עלות לליד אמיתי" />
                <Kpi label="CPA (CRM)" value={fmtMoney(kpis.cpaCrm)} accent={C.purple} sub="עלות לרכישה" />
                <Kpi label="תדירות ממוצעת" value={kpis.avgFrequency.toFixed(2)} sub={`CTR ${kpis.overallCtr.toFixed(2)}%`} />
              </div>
            </>
          )
        )
      )}

      {/* Daily trend chart */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="מגמת יומיים — הוצאה מול לידים" sub="Daily — Spend vs Leads (Meta + CRM)" />
        {daily.error ? (
          <ErrorBox error={daily.error} />
        ) : dailyPoints.length === 0 ? (
          <EmptyBox msg="אין נתוני יום-יום בטווח זה" />
        ) : (
          <div style={{ padding: '16px 8px 16px 0', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyPoints} margin={{ right: 20, left: -10, top: 5, bottom: 5 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" opacity={0.4} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false}
                  tickFormatter={(d: string) => d.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v: any, name: any) => name === 'הוצאה' ? `₪${Number(v).toLocaleString()}` : v} />
                <Legend wrapperStyle={{ fontSize: 12, color: C.muted, paddingTop: 8 }} />
                <Line yAxisId="left" type="monotone" dataKey="spend" name="הוצאה" stroke={C.gold} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="metaLeads" name="לידים (Meta)" stroke={C.blue} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="crmLeads" name="לידים (CRM)" stroke={C.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Quiz funnel — Meta-reported "reached form" vs "entered details" vs CRM */}
      {(kindTab === 'all' || kindTab === 'lead') && (
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title="פאנל קוויז — הגיעו לטופס מול הכניסו פרטים"
          sub="Quiz: Reached Form vs Entered Details (Meta pixels + CRM)"
          action={
            <span style={{ fontSize: 10, color: C.muted, background: C.soft, padding: '3px 8px', borderRadius: 5 }}>
              קמפיין לידים — תת-קטגוריה
            </span>
          }
        />
        <div style={{ padding: '24px 28px' }}>
          {quizMetaCompleteTotal === 0 && quizFunnel.completions === 0 ? (
            <EmptyBox msg="אין פעילות קוויז בטווח (לא ב-Meta ולא ב-CRM)" />
          ) : (
            <>
              {/* 4-way comparison: Meta QuizComplete vs Meta QuizRecommended vs CRM Completions vs CRM Leads */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                <div style={{ background: C.soft, borderRadius: 10, padding: '18px 20px', borderRight: `3px solid ${C.blue}` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>הגיעו לטופס</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.blue, fontFamily: 'system-ui', letterSpacing: '-0.02em', lineHeight: 1 }}>{quizMetaCompleteTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>QuizComplete pixel (Meta)</div>
                </div>
                <div style={{ background: C.soft, borderRadius: 10, padding: '18px 20px', borderRight: `3px solid ${C.purple}` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>הכניסו פרטים (Meta)</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.purple, fontFamily: 'system-ui', letterSpacing: '-0.02em', lineHeight: 1 }}>{quizMetaDetailsTotal.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>QuizRecommended pixel</div>
                </div>
                <div style={{ background: C.soft, borderRadius: 10, padding: '18px 20px', borderRight: `3px solid ${C.green}` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>הכניסו פרטים (CRM)</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.green, fontFamily: 'system-ui', letterSpacing: '-0.02em', lineHeight: 1 }}>{(quizFunnel.metaTotal.leads || quizFunnel.leads).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>quiz_results עם user_id</div>
                </div>
                <div style={{ background: C.soft, borderRadius: 10, padding: '18px 20px', borderRight: `3px solid ${C.red}` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>נטשו (טופס → פרטים)</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.red, fontFamily: 'system-ui', letterSpacing: '-0.02em', lineHeight: 1 }}>{Math.max(quizMetaCompleteTotal - quizMetaDetailsTotal, 0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>
                    {quizMetaCompleteTotal > 0 ? `${(((quizMetaCompleteTotal - quizMetaDetailsTotal) / quizMetaCompleteTotal) * 100).toFixed(0)}% מהגיעו לטופס` : ''}
                  </div>
                </div>
              </div>

              {/* Drift between Meta-pixel and CRM (should be ~0 if dedup works) */}
              {quizMetaDetailsTotal > 0 && quizFunnel.metaTotal.leads > 0 && (
                <div style={{ marginBottom: 24, padding: '10px 16px', background: 'rgba(139,92,246,0.06)', borderRight: `3px solid ${C.purple}`, borderRadius: 6, fontSize: 12, color: C.muted }}>
                  📊 <strong style={{ color: C.fg }}>פער Meta vs CRM:</strong> {Math.abs(quizMetaDetailsTotal - quizFunnel.metaTotal.leads).toLocaleString()} ({Math.abs(((quizMetaDetailsTotal - quizFunnel.metaTotal.leads) / Math.max(quizMetaDetailsTotal, 1)) * 100).toFixed(0)}%) — אמורים להיות זהים בזכות eventID deduplication. סטייה גדולה מ-15% = בעיה ב-CAPI או UTM tracking
                </div>
              )}

              {/* Visualization bar: form-reach → details-entered → bailed */}
              {quizMetaCompleteTotal > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 36, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(quizMetaDetailsTotal / quizMetaCompleteTotal) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${C.green}aa, ${C.green})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                      paddingLeft: 12, minWidth: quizMetaDetailsTotal > 0 ? 60 : 0,
                      color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'system-ui',
                    }}>
                      {quizMetaDetailsTotal > 0 && `${quizMetaDetailsTotal} → ליד`}
                    </div>
                    <div style={{
                      width: `${((quizMetaCompleteTotal - quizMetaDetailsTotal) / quizMetaCompleteTotal) * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${C.red}aa, ${C.red})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                      paddingRight: 12, minWidth: quizMetaCompleteTotal - quizMetaDetailsTotal > 0 ? 60 : 0,
                      color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'system-ui',
                    }}>
                      {quizMetaCompleteTotal - quizMetaDetailsTotal > 0 && `${quizMetaCompleteTotal - quizMetaDetailsTotal} ← נטישה`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 8, textAlign: 'center' }}>
                    סך הגעות לטופס מקמפיינים של קוויז: {quizMetaCompleteTotal.toLocaleString()} (הוצאה: {fmtMoney(quizSpendTotal)})
                  </div>
                </div>
              )}

              {/* Per-campaign Meta cost breakdown */}
              {quizCampaignRows.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    פילוח לפי קמפיין קוויז ב-Meta
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: C.soft }}>
                          {['קמפיין', 'הוצאה', 'הגיעו לטופס', 'הכניסו פרטים', '% נטישה', 'עלות לטופס', 'עלות לליד'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {quizCampaignRows.map((c) => {
                          const drop = Math.max(c.metaQuizComplete - c.metaQuizDetails, 0);
                          const dropPct = c.metaQuizComplete > 0 ? (drop / c.metaQuizComplete) * 100 : 0;
                          const costPerForm = c.metaQuizComplete > 0 ? c.spend / c.metaQuizComplete : 0;
                          const costPerLead = c.metaQuizDetails > 0 ? c.spend / c.metaQuizDetails : 0;
                          return (
                            <tr key={c.campaignId} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: C.fg, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                              <td style={{ padding: '10px 14px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{fmtMoney(c.spend)}</td>
                              <td style={{ padding: '10px 14px', color: C.blue, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{c.metaQuizComplete}</td>
                              <td style={{ padding: '10px 14px', color: C.green, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{c.metaQuizDetails}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: dropoffColorFor(dropPct), fontFamily: 'system-ui' }}>{dropPct.toFixed(0)}%</td>
                              <td style={{ padding: '10px 14px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{costPerForm > 0 ? fmtMoney(costPerForm) : '—'}</td>
                              <td style={{ padding: '10px 14px', color: C.purple, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{costPerLead > 0 ? fmtMoney(costPerLead) : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* By recommended product (CRM-wide, all sources) */}
              {quizFunnel.byProduct.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    פילוח לפי מוצר מומלץ
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: C.soft }}>
                          {['מוצר מומלץ', 'השלימו קוויז', 'הכניסו פרטים', 'נטישה', '% נטישה', 'המרה'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {quizFunnel.byProduct.map(p => {
                          const convPct = p.completions > 0 ? (p.leads / p.completions) * 100 : 0;
                          const dropColor = p.dropoffPct >= 70 ? C.red : p.dropoffPct >= 40 ? C.gold : C.green;
                          return (
                            <tr key={p.product} style={{ borderBottom: `1px solid ${C.border}` }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: C.fg }}>{PRODUCT_LABELS[p.product] ?? p.product}</td>
                              <td style={{ padding: '10px 14px', color: C.blue, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{p.completions}</td>
                              <td style={{ padding: '10px 14px', color: C.green, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{p.leads}</td>
                              <td style={{ padding: '10px 14px', color: C.red, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{p.dropoff}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: dropColor, fontFamily: 'system-ui' }}>{p.dropoffPct.toFixed(0)}%</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                  <div style={{ width: 60, background: C.soft, borderRadius: 3, overflow: 'hidden', height: 5 }}>
                                    <div style={{ width: `${convPct}%`, height: '100%', background: C.green, opacity: 0.85 }} />
                                  </div>
                                  <span style={{ fontSize: 11, color: C.muted, fontFamily: 'system-ui', minWidth: 36 }}>{convPct.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Per Meta campaign breakdown */}
              {quizFunnel.byMetaCampaign.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    פילוח לפי קמפיין Meta
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: C.soft }}>
                          {['מקור', 'קמפיין', 'השלימו', 'הכניסו פרטים', 'נטישה', '% נטישה'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {quizFunnel.byMetaCampaign.map((c, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: '10px 14px', color: C.gold, fontWeight: 600 }}>{c.source}</td>
                            <td style={{ padding: '10px 14px', color: C.fg, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaign}</td>
                            <td style={{ padding: '10px 14px', color: C.blue, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{c.completions}</td>
                            <td style={{ padding: '10px 14px', color: C.green, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{c.leads}</td>
                            <td style={{ padding: '10px 14px', color: C.red, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{c.dropoff}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: dropoffColorFor(c.dropoffPct), fontFamily: 'system-ui' }}>{c.dropoffPct.toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: 10, color: `${C.muted}88`, marginTop: 8, fontStyle: 'italic' }}>
                    * דורש שה-quiz_results יכיל UTM (מ-migration 035 ואילך). השלמות לפני המעבר יופיעו ללא קמפיין.
                  </div>
                </div>
              )}

              {/* Helper note */}
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(201,150,74,0.06)', borderRight: `3px solid ${C.gold}`, borderRadius: 6, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                💡 הקונברזין של Meta לקמפיין הקוויז הוא <strong style={{ color: C.blue }}>QuizComplete</strong> (הגיע לטופס). הליד האמיתי הוא <strong style={{ color: C.green }}>QuizRecommended</strong> (הכניס פרטים) — וזה אמור להיות שווה ל-CRM. הפער <strong style={{ color: dropoffColorFor(quizMetaCompleteTotal > 0 ? ((quizMetaCompleteTotal - quizMetaDetailsTotal) / quizMetaCompleteTotal) * 100 : 0) }}>{Math.max(quizMetaCompleteTotal - quizMetaDetailsTotal, 0).toLocaleString()}</strong> זה אנשים שהגיעו לטופס ולא מילאו אותו — האופטימיזציה של מטא לא יודעת על זה. שווה לבדוק את עמוד הטופס.
              </div>
            </>
          )}
        </div>
      </Card>
      )}

      {/* Campaign performance table */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader
          title="ביצועי קמפיינים"
          sub="Campaign Performance — מטא × CRM"
          action={
            <span style={{ fontSize: 10, color: C.muted, background: C.soft, padding: '3px 8px', borderRadius: 5 }}>
              cached 5 דק׳
            </span>
          }
        />
        {rows.length === 0 ? (
          <EmptyBox msg="אין קמפיינים פעילים בטווח" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {[
                    'קמפיין', 'סוג', 'הוצאה', 'חשיפות', 'CTR', 'CPC',
                    'Meta Leads', 'CRM Leads', 'CRM Buyers', 'CRM הכנסה',
                    'CPL', 'CPA', 'True ROAS',
                  ].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c, i) => {
                  const badge = KIND_BADGE[c.kind];
                  return (
                  <tr key={c.campaignId ?? i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: C.fg, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: `${badge.color}22`, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap' }}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{fmtMoney(c.spend)}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtNum(c.impressions)}</td>
                    <td style={{ padding: '10px 12px', color: C.fg, textAlign: 'right' }}>{c.ctr.toFixed(2)}%</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtMoney(c.cpc)}</td>
                    <td style={{ padding: '10px 12px', color: C.blue, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtNum(c.metaLeads)}</td>
                    <td style={{ padding: '10px 12px', color: c.crmLeads > 0 ? C.green : C.muted, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{fmtNum(c.crmLeads)}</td>
                    <td style={{ padding: '10px 12px', color: c.crmBuyers > 0 ? C.gold : C.muted, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{fmtNum(c.crmBuyers)}</td>
                    <td style={{ padding: '10px 12px', color: c.crmRevenue > 0 ? C.green : C.muted, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{c.crmRevenue > 0 ? fmtMoney(c.crmRevenue) : '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{c.cpl > 0 ? fmtMoney(c.cpl) : '—'}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{c.cpa > 0 ? fmtMoney(c.cpa) : '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'system-ui', fontWeight: 700, color: c.trueRoas >= 2 ? C.green : c.trueRoas >= 1 ? C.gold : c.trueRoas > 0 ? C.red : C.muted }}>
                      {c.trueRoas > 0 ? `${c.trueRoas.toFixed(2)}x` : '—'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top ads */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="קריאייטיבים מובילים" sub={`Top Ads — לפי הוצאה (top ${adRows.length})`} />
        {ads.error ? (
          <ErrorBox error={ads.error} />
        ) : adRows.length === 0 ? (
          <EmptyBox msg="אין קריאייטיבים בטווח" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {['קריאייטיב', 'קמפיין', 'הוצאה', 'חשיפות', 'CTR', 'CPC', 'לידים', 'CPL'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adRows.map((a, i) => (
                  <tr key={a.adId ?? i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: C.goldL, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.campaign}</td>
                    <td style={{ padding: '10px 12px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{fmtMoney(a.spend)}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtNum(a.impressions)}</td>
                    <td style={{ padding: '10px 12px', color: C.fg, textAlign: 'right' }}>{a.ctr.toFixed(2)}%</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtMoney(a.cpc)}</td>
                    <td style={{ padding: '10px 12px', color: C.blue, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtNum(a.metaLeads)}</td>
                    <td style={{ padding: '10px 12px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{a.cplMeta > 0 ? fmtMoney(a.cplMeta) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Extras — Demographics + Placements with tabs */}
      <Card>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          {([
            { key: 'demo', label: 'דמוגרפיה', sub: 'גיל × מגדר' },
            { key: 'placements', label: 'מיקומים', sub: 'Feed / Stories / Reels' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setExtrasTab(t.key)}
              style={{
                flex: 1,
                background: extrasTab === t.key ? C.card : C.soft,
                border: 'none',
                borderBottom: extrasTab === t.key ? `2px solid ${C.gold}` : '2px solid transparent',
                color: extrasTab === t.key ? C.gold : C.muted,
                padding: '14px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Assistant', sans-serif",
                display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8,
              }}
            >
              <span>{t.label}</span>
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 400, fontFamily: 'system-ui' }}>{t.sub}</span>
            </button>
          ))}
        </div>

        {extrasTab === 'demo' ? (
          demo.error ? <ErrorBox error={demo.error} /> :
          (demo.rows ?? []).length === 0 ? <EmptyBox msg="אין נתוני דמוגרפיה" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.border }}>
              {/* By Age */}
              <div style={{ background: C.card, padding: '18px 22px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>לפי גיל</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(demoByAge).sort(([, a], [, b]) => b.spend - a.spend).map(([age, d]) => {
                    const max = Math.max(...Object.values(demoByAge).map(v => v.spend), 1);
                    const pct = (d.spend / max) * 100;
                    return (
                      <div key={age}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: C.fg, fontWeight: 600 }}>{age}</span>
                          <span style={{ color: C.muted, fontFamily: 'system-ui' }}>{fmtMoney(d.spend)} · {d.leads} lead</span>
                        </div>
                        <div style={{ height: 6, background: C.soft, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: C.gold, borderRadius: 3, opacity: 0.85 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* By Gender */}
              <div style={{ background: C.card, padding: '18px 22px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>לפי מגדר</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(demoByGender).sort(([, a], [, b]) => b.spend - a.spend).map(([g, d]) => {
                    const max = Math.max(...Object.values(demoByGender).map(v => v.spend), 1);
                    const pct = (d.spend / max) * 100;
                    const color = g === 'female' ? '#ec4899' : g === 'male' ? C.blue : C.muted;
                    return (
                      <div key={g}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: C.fg, fontWeight: 600 }}>{GENDER_LABEL[g] ?? g}</span>
                          <span style={{ color: C.muted, fontFamily: 'system-ui' }}>{fmtMoney(d.spend)} · {d.leads} lead</span>
                        </div>
                        <div style={{ height: 6, background: C.soft, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, opacity: 0.85 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        ) : (
          placements.error ? <ErrorBox error={placements.error} /> :
          (placements.rows ?? []).length === 0 ? <EmptyBox msg="אין נתוני מיקומים" /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.soft }}>
                    {['פלטפורמה', 'מיקום', 'הוצאה', 'חשיפות', 'CTR', 'לידים', 'CPL'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(placements.rows ?? []).map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: C.fg }}>{PLATFORM_LABEL[p.platform] ?? p.platform}</td>
                      <td style={{ padding: '10px 16px', color: C.muted }}>{POSITION_LABEL[p.position] ?? p.position}</td>
                      <td style={{ padding: '10px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>{fmtMoney(p.spend)}</td>
                      <td style={{ padding: '10px 16px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtNum(p.impressions)}</td>
                      <td style={{ padding: '10px 16px', color: C.fg, textAlign: 'right' }}>{p.ctr.toFixed(2)}%</td>
                      <td style={{ padding: '10px 16px', color: C.blue, textAlign: 'right', fontFamily: 'system-ui' }}>{fmtNum(p.metaLeads)}</td>
                      <td style={{ padding: '10px 16px', color: C.muted, textAlign: 'right', fontFamily: 'system-ui' }}>{p.cplMeta > 0 ? fmtMoney(p.cplMeta) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

    </div>
  );
}
