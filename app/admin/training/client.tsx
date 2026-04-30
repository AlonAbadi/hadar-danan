'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts';

// ── Palette ───────────────────────────────────────────────────────────────
const C = {
  bg:     '#080C14',
  card:   '#141820',
  soft:   '#1D2430',
  border: '#2C323E',
  gold:   '#C9964A',
  goldL:  '#E8B94A',
  fg:     '#EDE9E1',
  muted:  '#9E9990',
  green:  '#34A853',
  red:    '#EA4335',
  blue:   '#4285F4',
  purple: '#8b5cf6',
  amber:  '#FBBC05',
};

const TT = {
  contentStyle: { background: C.soft, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.fg },
  labelStyle: { color: C.fg, fontWeight: 600 },
  cursor: { fill: 'rgba(201,150,74,0.06)' },
};

const RANGE_OPTS = [
  { v: 'today', l: 'היום' },
  { v: '7d',   l: '7 ימים' },
  { v: '30d',  l: '30 ימים' },
  { v: '90d',  l: '90 ימים' },
  { v: 'all',  l: 'הכל' },
];

const PRODUCT_LABELS: Record<string, string> = {
  challenge: 'אתגר 7 ימים',
  workshop:  'סדנה יום אחד',
  course:    'קורס דיגיטלי',
  strategy:  'פגישת אסטרטגיה',
  premium:   'יום צילום פרמיום',
  partnership: 'שותפות',
  hive:      'הכוורת',
};

const PRODUCT_COLORS: Record<string, string> = {
  challenge: C.blue,
  workshop:  C.purple,
  course:    C.green,
  strategy:  C.gold,
  premium:   C.goldL,
  partnership: C.amber,
  hive:      C.red,
};

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Reusable UI ───────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, badge }: { title: string; sub?: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.fg }}>{title}</span>
        {sub && <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{sub}</span>}
      </div>
      {badge}
    </div>
  );
}

function Kpi({ label, value, color, sub, icon }: { label: string; value: string | number; color?: string; sub?: string; icon?: string }) {
  return (
    <Card>
      <div style={{ padding: '18px 22px' }}>
        {icon && <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>}
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: color ?? C.fg, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: 'system-ui' }}>
          {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
        </div>
        {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{sub}</div>}
      </div>
    </Card>
  );
}

function GA4Badge() {
  return (
    <span style={{ fontSize: 10, color: C.muted, background: C.soft, border: `1px solid ${C.border}`, padding: '2px 8px', borderRadius: 5 }}>
      GA4 · עיכוב 24-48 שעות
    </span>
  );
}

function FunnelStep({
  label, sub, value, maxVal, color, prev, isGA4 = false,
}: {
  label: string; sub?: string; value: number; maxVal: number; color: string; prev?: number; isGA4?: boolean;
}) {
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
  const convPct = prev != null && prev > 0 ? ((value / prev) * 100).toFixed(0) : null;
  return (
    <div>
      {convPct && (
        <div style={{ textAlign: 'center', fontSize: 10, color: C.muted, padding: '4px 0 8px' }}>
          ↓ {convPct}% המרה
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: isGA4 ? `${C.muted}99` : C.gold, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: value > 0 ? color : C.muted, fontFamily: 'system-ui', letterSpacing: '-0.02em' }}>
          {value.toLocaleString()}
        </div>
      </div>
      <div style={{ height: 6, background: C.soft, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, opacity: 0.85, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TrainingClient() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/training?dateRange=${r}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const selectRange = (v: string) => { setRange(v); };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: C.muted, fontSize: 14 }}>
        {loading ? 'טוען נתוני הדרכה...' : 'שגיאה בטעינה'}
      </div>
    );
  }

  const { signups, video, conversions, ga4, vimeo } = data;

  // Derived
  const signupToViewerRate = signups.total > 0 ? Math.round((video.uniqueViewers / signups.total) * 100) : 0;
  const viewerToCompleteRate = video.uniqueViewers > 0 ? Math.round((video.reached100 / video.uniqueViewers) * 100) : 0;
  const viewerToBuyerRate = video.uniqueViewers > 0 ? Math.round((conversions.uniqueBuyers / video.uniqueViewers) * 100) : 0;

  const ga4TrainingUsers   = ga4.trainingPageUsers;
  const ga4WatchUsers      = ga4.watchPageUsers;
  const quizClicks         = ga4.quizClicks;
  const totalProductClicks = ga4.totalProductClicks;

  const funnelMax = Math.max(ga4TrainingUsers || signups.total, 1);

  const milestones = [
    { label: '0% (פתיחה)', value: video.totalPlays,  color: C.blue   },
    { label: '25%',        value: video.reached25,   color: C.purple },
    { label: '50%',        value: video.reached50,   color: C.gold   },
    { label: '75%',        value: video.reached75,   color: C.goldL  },
    { label: '100% (סיום)', value: video.reached100, color: C.green  },
  ];

  const productClickData = Object.entries(ga4.productClicks as Record<string, number>)
    .map(([key, val]) => ({ name: PRODUCT_LABELS[key] ?? key, value: val, color: PRODUCT_COLORS[key] ?? C.muted }))
    .sort((a, b) => b.value - a.value);

  return (
    <div style={{ fontFamily: "'Assistant', sans-serif", direction: 'rtl', padding: '32px 48px', color: C.fg }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.fg, margin: 0 }}>
            שיעור במתנה
            <span style={{ fontSize: 13, fontWeight: 400, color: C.muted, marginRight: 10, fontFamily: 'system-ui' }}>Free Training Analytics</span>
          </h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0' }}>
            מעקב מלא אחרי הפאנל — נרשמים → צפייה → השלמה → המרה למוצרים
          </p>
        </div>
        <div style={{ display: 'flex', gap: 2, background: C.soft, borderRadius: 8, padding: 3 }}>
          {RANGE_OPTS.map(opt => (
            <button key={opt.v} onClick={() => selectRange(opt.v)} style={{
              background: range === opt.v ? C.card : 'transparent',
              border: `1px solid ${range === opt.v ? C.border : 'transparent'}`,
              color: range === opt.v ? C.gold : C.muted,
              fontSize: 12, fontWeight: range === opt.v ? 600 : 400,
              padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
              fontFamily: "'Assistant', sans-serif", transition: 'all 0.15s',
            }}>{opt.l}</button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <Kpi label="נרשמו להדרכה"   value={signups.total}              color={C.blue}   icon="✍️" sub="Supabase — real-time" />
        <Kpi label="צופים ייחודיים" value={video.uniqueViewers}         color={C.purple} icon="👁" sub={`${signupToViewerRate}% מהנרשמים הגיעו לצפייה`} />
        <Kpi label="ממוצע צפייה"    value={`${video.avgWatchPercent}%`} color={video.avgWatchPercent >= 50 ? C.green : video.avgWatchPercent >= 30 ? C.gold : C.red} icon="📊" />
        <Kpi label="השלימו את הסרטון" value={video.reached100}         color={C.green}  icon="✅" sub={`${viewerToCompleteRate}% מהצופים`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <Kpi label="הפעלות סרטון"    value={video.totalPlays}            color={C.gold}   icon="▶️" sub="Supabase — כולל צפיות חוזרות" />
        <Kpi label="לחצו על קוויז"  value={quizClicks}                  color={C.amber}  icon="🧠" sub="GA4 · עיכוב 24-48 שעות" />
        <Kpi label="לחצו על מוצר"   value={totalProductClicks}           color={C.purple} icon="🛒" sub="GA4 · סה״כ קליקים על מוצרים" />
        <Kpi label="רכשו מוצר"       value={conversions.uniqueBuyers}    color={conversions.uniqueBuyers > 0 ? C.green : C.muted} icon="💰" sub={`₪${conversions.totalRevenue.toLocaleString()} הכנסה סה״כ`} />
      </div>

      {/* ── The Big Funnel ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <Card>
          <CardHead title="פאנל הדרכה מלא" sub="Full Training Funnel" badge={<GA4Badge />} />
          <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ga4TrainingUsers > 0 && (
              <FunnelStep label="נכנסו לעמוד ההדרכה" sub="/training — GA4 users" value={ga4TrainingUsers} maxVal={funnelMax} color={C.blue} isGA4 />
            )}
            <FunnelStep
              label="נרשמו לצפייה"
              sub="Supabase — real-time"
              value={signups.total}
              maxVal={funnelMax}
              color={C.purple}
              prev={ga4TrainingUsers || undefined}
            />
            {ga4WatchUsers > 0 && (
              <FunnelStep label="הגיעו לדף הצפייה" sub="/training/watch — GA4 users" value={ga4WatchUsers} maxVal={funnelMax} color={C.gold} prev={signups.total} isGA4 />
            )}
            <FunnelStep
              label="צפו בסרטון (unique)"
              sub="Supabase video_events — real-time"
              value={video.uniqueViewers}
              maxVal={funnelMax}
              color={C.goldL}
              prev={ga4WatchUsers || signups.total}
            />
            <FunnelStep label="השלימו 50%+" sub="Supabase — הגיעו לאמצע" value={video.reached50} maxVal={funnelMax} color={C.amber} prev={video.uniqueViewers} />
            <FunnelStep label="השלימו 100%" sub="Supabase — סיימו לצפות" value={video.reached100} maxVal={funnelMax} color={C.green} prev={video.reached50} />
            {quizClicks > 0 && (
              <FunnelStep label="לחצו על קוויז" sub="GA4 — training_quiz_cta_click" value={quizClicks} maxVal={funnelMax} color={C.purple} prev={video.reached100} isGA4 />
            )}
            {totalProductClicks > 0 && (
              <FunnelStep label="לחצו על מוצר" sub="GA4 — training_click_*" value={totalProductClicks} maxVal={funnelMax} color={C.blue} prev={quizClicks || video.reached100} isGA4 />
            )}
            {conversions.uniqueBuyers > 0 && (
              <FunnelStep label="רכשו מוצר" sub="Supabase purchases" value={conversions.uniqueBuyers} maxVal={funnelMax} color={C.green} prev={totalProductClicks || video.uniqueViewers} />
            )}
          </div>
        </Card>

        {/* Milestone breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <CardHead title="עומק צפייה בסרטון" sub="Video Milestone Breakdown — Supabase" />
            <div style={{ padding: '20px 24px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={milestones} margin={{ right: 8, left: -20 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v: any) => [`${v} צופים`, 'הגיעו לנקודה']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {milestones.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12 }}>
                {milestones.map(m => {
                  const ret = video.uniqueViewers > 0 ? Math.round((m.value / video.uniqueViewers) * 100) : 0;
                  return (
                    <div key={m.label} style={{ textAlign: 'center', background: C.soft, borderRadius: 8, padding: '8px 4px' }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{m.label.replace(' (פתיחה)', '').replace(' (סיום)', '')}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: m.value > 0 ? m.color : C.muted, fontFamily: 'system-ui' }}>{m.value}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>{ret}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Vimeo stats */}
          {vimeo.configured && (
            <Card>
              <CardHead title="נתוני Vimeo" sub="Vimeo API — all-time" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.border }}>
                {[
                  { label: 'צפיות סה״כ', value: vimeo.plays.toLocaleString(),    color: C.blue  },
                  { label: 'השלמות',      value: vimeo.finishes.toLocaleString(), color: C.green },
                  { label: 'אורך הסרטון', value: formatDuration(vimeo.duration), color: C.muted },
                ].map(item => (
                  <div key={item.label} style={{ background: C.card, padding: '16px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontFamily: 'system-ui' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {vimeo.plays > 0 && (
                <div style={{ padding: '10px 18px', fontSize: 11, color: C.muted }}>
                  שיעור השלמה: {Math.round((vimeo.finishes / vimeo.plays) * 100)}% (Vimeo all-time)
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ── Drop-off Curve ───────────────────────────────────────────── */}
      {video.dropOffCurve.length > 0 && (
        <Card style={{ marginBottom: 24 }}>
          <CardHead title="עקומת נשירה לאורך הסרטון" sub="Viewer Retention Curve — Supabase real-time" />
          <div style={{ padding: '16px 16px 8px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={video.dropOffCurve.map((d: any) => ({ name: formatDuration(d.second), צופים: d.viewers }))} margin={{ right: 16, left: -16 }}>
                <defs>
                  <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.gold} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={C.gold} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v: any) => [`${v} צופים`, '']} />
                <Area dataKey="צופים" stroke={C.gold} strokeWidth={2} fill="url(#dropGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Product Interest + Conversions ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Product clicks from GA4 */}
        <Card>
          <CardHead title="קליקים על מוצרים" sub="Post-Training Product Clicks" badge={<GA4Badge />} />
          <div style={{ padding: '20px 24px' }}>
            {productClickData.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>אין נתוני GA4 לטווח זה</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {productClickData.map((item, i) => {
                  const pct = totalProductClicks > 0 ? (item.value / totalProductClicks) * 100 : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                          <span style={{ fontSize: 13, color: C.fg }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: C.muted }}>{pct.toFixed(0)}%</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: 'system-ui', minWidth: 28, textAlign: 'right' }}>{item.value}</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: C.soft, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 3, opacity: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Actual purchases by video viewers */}
        <Card>
          <CardHead title="רכישות בפועל של צופים" sub="Purchases by Training Viewers — Supabase" />
          <div style={{ padding: '20px 24px' }}>
            {conversions.byProduct.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '32px 0' }}>אין רכישות לצופים בטווח זה</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {conversions.byProduct.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: C.soft, borderRadius: 10, border: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.fg }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.count} רכישות</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: C.green, fontFamily: 'system-ui' }}>₪{item.revenue.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>הכנסה</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', background: `${C.green}11`, border: `1px solid ${C.green}33`, borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.green }}>סה״כ הכנסה מצופים</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.green, fontFamily: 'system-ui' }}>₪{conversions.totalRevenue.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── Acquisition Sources ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Source breakdown */}
        <Card>
          <CardHead title="מקורות תנועה" sub="UTM Source Breakdown — Supabase" />
          <div style={{ padding: '16px 20px' }}>
            {signups.bySource.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '24px 0' }}>אין נתוני מקור</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {signups.bySource.map((s: any, i: number) => {
                  const pct = signups.total > 0 ? (s.count / signups.total) * 100 : 0;
                  const color = [C.gold, C.blue, C.purple, C.green, C.amber, C.red][i % 6];
                  return (
                    <div key={s.source}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: C.fg, fontWeight: 500 }}>{s.source}</span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 11, color: C.muted }}>{pct.toFixed(0)}%</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'system-ui', minWidth: 28, textAlign: 'right' }}>{s.count}</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: C.soft, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, opacity: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Campaign breakdown */}
        <Card>
          <CardHead title="פירוט קמפיינים" sub="UTM Campaign Breakdown — Supabase" />
          {signups.byCampaign.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.muted, fontSize: 13, padding: '40px 0' }}>אין נתוני קמפיין עדיין</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: C.soft }}>
                    {['מקור', 'מדיום', 'קמפיין', 'לידים'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: '0.04em', borderBottom: `1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signups.byCampaign.map((c: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '9px 14px', color: C.gold, fontWeight: 600 }}>{c.source}</td>
                      <td style={{ padding: '9px 14px', color: C.muted }}>{c.medium || '—'}</td>
                      <td style={{ padding: '9px 14px', color: C.fg }}>{c.campaign || '—'}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 700, color: C.fg, textAlign: 'right', fontFamily: 'system-ui' }}>{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Conversion Summary ───────────────────────────────────────── */}
      <Card>
        <CardHead title="סיכום המרות" sub="Conversion Summary" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: C.border }}>
          {[
            { label: 'נרשמו → צפו', value: `${signupToViewerRate}%`, sub: `${video.uniqueViewers} מתוך ${signups.total}`, color: C.blue },
            { label: 'צפו → השלימו', value: `${viewerToCompleteRate}%`, sub: `${video.reached100} מתוך ${video.uniqueViewers}`, color: C.green },
            { label: 'צפו → רכשו', value: `${viewerToBuyerRate}%`, sub: `${conversions.uniqueBuyers} מתוך ${video.uniqueViewers}`, color: C.gold },
            {
              label: 'ממוצע הכנסה לצופה',
              value: video.uniqueViewers > 0 ? `₪${Math.round(conversions.totalRevenue / video.uniqueViewers).toLocaleString()}` : '₪0',
              sub: `סה״כ ₪${conversions.totalRevenue.toLocaleString()}`,
              color: C.green,
            },
          ].map(item => (
            <div key={item.label} style={{ background: C.card, padding: '20px 22px' }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: item.color, fontFamily: 'system-ui', letterSpacing: '-0.02em' }}>{item.value}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
