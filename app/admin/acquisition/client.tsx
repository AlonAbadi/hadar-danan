'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

// ── Palette ───────────────────────────────────────────────────────────────
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

const CHART_COLORS = [C.gold, C.blue, C.green, C.purple, C.red, C.muted];

const TT = {
  contentStyle: { background: C.soft, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.fg },
  labelStyle: { color: C.fg, fontWeight: 600 },
  itemStyle: { color: C.muted },
  cursor: { fill: 'rgba(201,150,74,0.06)' },
};

// ── Helpers ────────────────────────────────────────────────────────────────
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
        <div style={{ fontSize: 28, fontWeight: 700, color: accent || C.fg, letterSpacing: '-0.02em', fontFamily: 'system-ui, sans-serif', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</div>}
      </div>
    </Card>
  );
}

function HBar({ data, valueKey, labelKey }: { data: any[]; valueKey: string; labelKey: string }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 130, textAlign: 'right', fontSize: 12, color: C.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d[labelKey]}</div>
          <div style={{ flex: 1, background: C.soft, borderRadius: 4, overflow: 'hidden', height: 22 }}>
            <div style={{
              width: `${(d[valueKey] / max) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
              borderRadius: 4,
              opacity: 0.85,
            }} />
          </div>
          <div style={{ width: 48, textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.fg, fontFamily: 'system-ui' }}>
            {d[valueKey].toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number; color?: string }[] }) {
  const max = steps[0]?.value || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((step, i) => {
        const prev = steps[i - 1];
        const pct = (step.value / max) * 100;
        const convPct = prev && prev.value > 0 ? ((step.value / prev.value) * 100).toFixed(1) : null;
        const color = step.color || C.gold;
        return (
          <div key={step.label}>
            {convPct && (
              <div style={{ textAlign: 'center', fontSize: 11, color: C.muted, padding: '3px 0 8px' }}>
                ↓ {convPct}% מ{prev.label}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 110, textAlign: 'right', fontSize: 13, color: C.fg, fontWeight: 500, flexShrink: 0 }}>{step.label}</div>
              <div style={{ flex: 1, background: C.soft, borderRadius: 6, overflow: 'hidden', height: 34 }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingLeft: 10,
                  paddingRight: 10,
                  minWidth: 40,
                  transition: 'width 0.6s ease',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>
                    {step.value.toLocaleString()}
                  </span>
                </div>
              </div>
              <div style={{ width: 44, textAlign: 'left', fontSize: 12, color: C.muted, fontFamily: 'system-ui', flexShrink: 0 }}>
                {pct.toFixed(0)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CrBadge({ value }: { value: number }) {
  const color = value >= 5 ? C.green : value >= 2 ? C.gold : C.red;
  return (
    <span style={{ background: `${color}22`, color, padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {value}%
    </span>
  );
}

const PRODUCT_LABELS: Record<string, { label: string; color: string }> = {
  challenge: { label: 'אתגר 7 ימים',      color: C.blue },
  workshop:  { label: 'סדנה יום אחד',     color: C.purple },
  course:    { label: 'קורס דיגיטלי',      color: C.green },
  strategy:  { label: 'פגישת אסטרטגיה',   color: C.gold },
  premium:   { label: 'יום צילום פרמיום', color: C.goldL },
};

// ── Main component ─────────────────────────────────────────────────────────
export default function AcquisitionClient({
  sources,
  metaAds,
  googleAds,
  ga4,
  quiz,
  dateRange,
}: {
  sources: any[];
  metaAds: any;
  googleAds: any;
  ga4: any;
  quiz: { total: number; leads: number; byProduct: Record<string, number> };
  dateRange: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const setRange = (v: string) => router.push(`${pathname}?range=${v}`);

  // ── Derived ────────────────────────────────────────────────────────────
  const totalLeads   = sources.reduce((s, x) => s + x.leads, 0);
  const totalRevenue = sources.reduce((s, x) => s + x.revenue, 0);
  const totalBuyers  = sources.reduce((s, x) => s + x.buyers, 0);
  const overallCR    = totalLeads > 0 ? ((totalBuyers / totalLeads) * 100).toFixed(1) : '0';

  const ov        = ga4.data?.overview;
  const channels  = (ga4.data?.channels ?? []).slice(0, 8);
  const events    = ga4.data?.events ?? [];

  const eventCount = (name: string) => events.find((e: any) => e.name === name)?.count ?? 0;

  const funnelSteps = ga4.configured && ov ? [
    { label: 'סשנים',          value: ov.sessions ?? 0,        color: C.blue },
    { label: 'משתמשים',        value: ov.users ?? 0,           color: C.purple },
    { label: 'begin_checkout', value: eventCount('begin_checkout'), color: C.gold },
    { label: 'generate_lead',  value: eventCount('generate_lead'),  color: C.green },
    { label: 'purchase',       value: eventCount('purchase'),        color: C.goldL },
  ].filter(s => s.value > 0) : [];

  const sourceRevChart = sources
    .filter(s => s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map(s => ({ name: s.source, value: s.revenue }));

  const leadsBarData = sources
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6)
    .map(s => ({ name: s.source, לידים: s.leads, רוכשים: s.buyers }));

  const RANGE_OPTS = [
    { v: 'today', l: 'היום' },
    { v: '7d',   l: '7 ימים' },
    { v: '30d',  l: '30 ימים' },
    { v: '90d',  l: '90 ימים' },
  ];

  return (
    <div style={{ fontFamily: "'Assistant', sans-serif", direction: 'rtl' }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.fg, margin: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            רכישת לקוחות
            <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, fontFamily: 'system-ui' }}>Acquisition & Attribution</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>מקורות תנועה, ביצועי קמפיינים וייחוס הכנסות</p>
        </div>

        {/* Date range picker */}
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
                transition: 'all 0.15s',
              }}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── API banners ──────────────────────────────────────────────── */}
      {!metaAds.configured && (
        <div style={{ padding: '10px 16px', background: 'rgba(201,150,74,0.08)', border: '1px solid rgba(201,150,74,0.2)', borderRadius: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: C.gold }}>⚠ Meta Ads לא מחובר</span>
          <span style={{ color: C.muted }}>META_ADS_ACCESS_TOKEN, META_AD_ACCOUNT_ID</span>
        </div>
      )}
      {!googleAds.configured && (
        <div style={{ padding: '10px 16px', background: 'rgba(201,150,74,0.08)', border: '1px solid rgba(201,150,74,0.2)', borderRadius: 8, marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: C.gold }}>⚠ Google Ads לא מחובר</span>
          <span style={{ color: C.muted }}>GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_DEVELOPER_TOKEN</span>
        </div>
      )}

      {/* ── GA4 Overview KPIs ───────────────────────────────────────── */}
      {ga4.configured && ov && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <Kpi label="סשנים (GA4)" value={(ov.sessions ?? 0).toLocaleString()} accent={C.blue} />
          <Kpi label="משתמשים (GA4)" value={(ov.users ?? 0).toLocaleString()} accent={C.purple} />
          <Kpi label="Bounce Rate" value={`${((ov.bounceRate ?? 0) * 100).toFixed(1)}%`} accent={C.muted} />
          <Kpi label="זמן סשן ממוצע" value={`${Math.round((ov.avgSessionDuration ?? 0) / 60)}m`} />
        </div>
      )}

      {/* ── Business KPIs ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <Kpi label="לידים" value={totalLeads.toLocaleString()} />
        <Kpi label="רוכשים" value={totalBuyers.toLocaleString()} accent={C.gold} />
        <Kpi label="המרה כוללת" value={`${overallCR}%`} accent={C.gold} />
        <Kpi label="הכנסה" value={`₪${totalRevenue.toLocaleString()}`} accent={C.green} />
      </div>

      {/* ── Conversion Funnel ────────────────────────────────────────── */}
      {funnelSteps.length >= 2 && (
        <Card style={{ marginBottom: 24 }}>
          <CardHeader title="פאנל המרה" sub="Conversion Funnel" />
          <div style={{ padding: 24 }}>
            <Funnel steps={funnelSteps} />
          </div>
        </Card>
      )}

      {/* ── Quiz Section ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Quiz funnel */}
        <Card>
          <CardHeader title="פאנל הקוויז" sub="Quiz Funnel" />
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {(() => {
              const quizViews = ga4.data?.quizUsers ?? 0;
              const quizCompleted = quiz.total;
              const quizLeads = quiz.leads;
              const completionPct = quizViews > 0 ? ((quizCompleted / quizViews) * 100).toFixed(0) : '—';
              const leadPct = quizCompleted > 0 ? ((quizLeads / quizCompleted) * 100).toFixed(0) : '—';

              const steps = [
                { label: 'ביקרו בקוויז',   value: quizViews,     sub: 'GA4 — משתמשים ייחודיים', color: C.blue },
                { label: 'סיימו את הקוויז', value: quizCompleted, sub: `${completionPct}% מהמבקרים`, color: C.purple },
                { label: 'השאירו ליד',      value: quizLeads,     sub: `${leadPct}% מהמסיימים`,   color: C.gold },
              ];

              return steps.map((step, i) => {
                const maxVal = steps[0].value || 1;
                const barPct = (step.value / maxVal) * 100;
                return (
                  <div key={step.label} style={{ paddingBottom: 16, borderBottom: i < steps.length - 1 ? `1px solid ${C.border}` : 'none', marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.fg, marginBottom: 2 }}>{step.label}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{step.sub}</div>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: step.color, fontFamily: 'system-ui', letterSpacing: '-0.02em' }}>
                        {step.value.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ height: 6, background: C.soft, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${barPct}%`, height: '100%', background: step.color, borderRadius: 3, opacity: 0.8, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>

        {/* Recommendation distribution */}
        <Card>
          <CardHeader title="התפלגות המלצות" sub="Quiz Recommendations" />
          <div style={{ padding: '20px 24px' }}>
            {quiz.total === 0 ? (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>אין נתונים בטווח זה</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(quiz.byProduct)
                  .sort(([, a], [, b]) => b - a)
                  .map(([product, count]) => {
                    const meta = PRODUCT_LABELS[product] ?? { label: product, color: C.muted };
                    const pct = quiz.total > 0 ? (count / quiz.total) * 100 : 0;
                    return (
                      <div key={product}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: C.fg }}>{meta.label}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, color: C.muted }}>{pct.toFixed(0)}%</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: meta.color, fontFamily: 'system-ui', minWidth: 28, textAlign: 'right' }}>{count}</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: C.soft, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 3, opacity: 0.75, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.muted }}>
                  <span>סה״כ ניסיונות קוויז</span>
                  <span style={{ fontWeight: 600, color: C.fg }}>{quiz.total.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Charts row ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Traffic channels */}
        <Card>
          <CardHeader title="ערוצי תנועה" sub="Traffic Channels (GA4)" />
          <div style={{ padding: 20 }}>
            {channels.length > 0 ? (
              <HBar data={channels} valueKey="sessions" labelKey="channel" />
            ) : (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>אין נתונים</div>
            )}
          </div>
        </Card>

        {/* Leads vs Buyers bar chart */}
        <Card>
          <CardHeader title="לידים מול רוכשים" sub="Leads vs Buyers by Source" />
          <div style={{ padding: '12px 8px 12px 0' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadsBarData} margin={{ right: 8, left: -12 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} />
                <Bar dataKey="לידים" fill={C.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="רוכשים" fill={C.gold} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Key Events + Revenue donut row ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Key Events tiles */}
        {events.length > 0 && (
          <Card>
            <CardHeader title="אירועי מפתח" sub="Key Events (GA4)" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.border }}>
              {events.map((e: any) => {
                const eventColors: Record<string, string> = {
                  purchase: C.gold,
                  generate_lead: C.green,
                  begin_checkout: C.purple,
                  sign_up: C.blue,
                };
                const accent = eventColors[e.name] || C.muted;
                return (
                  <div key={e.name} style={{ background: C.card, padding: '20px 22px' }}>
                    <div style={{ fontSize: 11, color: C.muted, fontFamily: 'system-ui', marginBottom: 8 }}>{e.name}</div>
                    <div style={{ fontSize: 30, fontWeight: 700, color: accent, fontFamily: 'system-ui', letterSpacing: '-0.02em' }}>
                      {e.count.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Revenue donut */}
        <Card>
          <CardHeader title="הכנסות לפי מקור" sub="Revenue by Source" />
          <div style={{ padding: 12 }}>
            {sourceRevChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sourceRevChart}
                    cx="50%" cy="45%"
                    outerRadius={80} innerRadius={48}
                    dataKey="value" paddingAngle={3}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ stroke: C.border }}
                  >
                    {sourceRevChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TT} formatter={(v: any) => [`₪${Number(v).toLocaleString()}`, 'הכנסה']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '60px 0' }}>אין הכנסות להצגה</div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Source Performance Table ─────────────────────────────────── */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="ביצועים לפי מקור" sub="Performance by Source" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.soft }}>
                {[
                  { l: 'מקור', w: '22%' },
                  { l: 'לידים' }, { l: 'רוכשים' }, { l: 'המרה' },
                  { l: 'הכנסה' }, { l: 'ROAS' }, { l: '', w: '12%' },
                ].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}`, width: h.w }}>
                    {h.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sources.sort((a, b) => b.revenue - a.revenue).map((s, i) => {
                const barPct = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0;
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: C.fg }}>{s.source}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{s.leads.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{s.buyers.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <CrBadge value={parseFloat(String(s.conversionRate))} />
                    </td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui', fontWeight: 600 }}>
                      {s.revenue > 0 ? `₪${s.revenue.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: C.muted, textAlign: 'right' }}>—</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ height: 4, background: C.soft, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${barPct}%`, height: '100%', background: `linear-gradient(90deg, ${C.goldL}, ${C.gold})`, borderRadius: 2 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Meta Ads ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="קמפיינים — Meta Ads"
          sub="Meta Campaigns"
          action={!metaAds.configured ? (
            <span style={{ fontSize: 11, color: C.gold, background: 'rgba(201,150,74,0.12)', padding: '3px 10px', borderRadius: 6 }}>לא מחובר</span>
          ) : undefined}
        />
        {metaAds.configured && metaAds.data ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.soft }}>
                  {['קמפיין', 'חשיפות', 'קליקים', 'CTR', 'הוצאה', 'המרות', 'CPA'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metaAds.data.map((camp: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: C.fg }}>{camp.name}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{camp.impressions.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{camp.clicks.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right' }}>{camp.ctr.toFixed(2)}%</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>₪{Math.round(camp.spend).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{camp.conversions}</td>
                    <td style={{ padding: '12px 16px', color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{camp.costPerConversion > 0 ? `₪${Math.round(camp.costPerConversion)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📢</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: C.muted, marginBottom: 6 }}>Meta Ads לא מחובר</div>
            <div style={{ fontSize: 13, color: `${C.muted}88` }}>הוסף META_ADS_ACCESS_TOKEN ו-META_AD_ACCOUNT_ID לקובץ .env</div>
          </div>
        )}
      </Card>

    </div>
  );
}
