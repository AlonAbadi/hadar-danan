'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar } from '@/components/admin/ui';

const TT = {
  contentStyle: { background: '#141820', border: '1px solid #2C323E', borderRadius: 8, fontSize: 12, color: '#EDE9E1' },
  labelStyle: { color: '#AAB0BD', fontWeight: 600 },
  cursor: { fill: 'rgba(201,150,74,0.06)' },
};

const TEMPLATE_NAMES: Record<string, string> = {
  // Ladder funnel
  welcome:                    'ברוכים הבאים + הדרכה חינמית',
  followup_24h:               'מעקב 24 שעות — אתגר',
  followup_72h:               'מעקב 72 שעות — אתגר',
  challenge_access:           'גישה לאתגר 7 ימים',
  challenge_upsell_workshop:  'אפסייל לסדנה (יום 7)',
  workshop_confirmation:      'אישור הרשמה לסדנה',
  workshop_upsell_strategy:   'אפסייל לאסטרטגיה (שבוע)',
  course_access:              'גישה לקורס הדיגיטלי',
  course_upsell_strategy:     'אפסייל לאסטרטגיה (שבוע)',
  reengagement:               'הפעלה מחדש — 3 ימים',
  purchase_confirmation:      'אישור רכישה',
  post_purchase_48h:          'מעקב 48 שעות אחרי רכישה',
  booking_confirmation:       'אישור פגישת אסטרטגיה',
  premium_lead_confirmation:  'אישור ליד פרמיום',
  partnership_confirmation:   'אישור בקשת שותפות',
  // Hive
  hive_welcome:               'ברוכים הבאים לכוורת',
  hive_day7:                  'שבוע בכוורת — מעקב',
  hive_cancelled:             'אישור ביטול כוורת',
  // Signal funnel (מנוע האות)
  signal_welcome:             'האות — ברוכים הבאים',
  signal_day1:                'האות — יום 1',
  signal_day3:                'האות — יום 3',
  signal_day5:                'האות — יום 5',
  signal_day8:                'האות — יום 8',
  signal_day12:               'האות — יום 12',
  signal_hive_welcome:        'כוורת האות — ברוכים הבאים',
  signal_strategy_fallback:   'האות — ליד רותח (מעקב)',
  kriah_hive_offer:           'הצעת קריאה ₪590 (40 שעות)',
  // Signal funnel — English
  signal_welcome_en:          'האות EN — ברוכים הבאים',
  en_signal_day1:             'האות EN — יום 1',
  en_signal_day3:             'האות EN — יום 3',
  en_signal_day5:             'האות EN — יום 5',
  en_signal_day8:             'האות EN — יום 8',
  en_signal_day12:            'האות EN — יום 12',
  signal_hive_welcome_en:     'כוורת האות EN — ברוכים הבאים',
  signal_strategy_fallback_en:'האות EN — ליד רותח (מעקב)',
  kriah_hive_offer_en:        'הצעת קריאה EN (40 שעות)',
  // Direct (non-sequence) sends
  direct_send:                'שליחה ישירה — קריאת האות במייל',
};

const TRIGGER_NAMES: Record<string, string> = {
  DIRECT: 'כפתור "שלח לי למייל" / שער קריאה',
};

type SeqStat = {
  sequenceId: string;
  templateKey: string;
  trigger: string;
  delayHours: number;
  sent: number;
  clicked: number;
  clickRate: number;
};

export default function EmailClient({ stats }: { stats: SeqStat[] }) {
  const totalSent    = stats.reduce((s, x) => s + x.sent, 0);
  const totalClicked = stats.reduce((s, x) => s + x.clicked, 0);
  const avgClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const sorted       = [...stats].sort((a, b) => b.sent - a.sent);

  // Click-based engagement thresholds — a click on a text-only Hebrew email
  // is a strong signal, and our list runs well above the ~2.3% industry CTR.
  const health = (r: number): 'success' | 'warning' | 'danger' =>
    r >= 15 ? 'success' : r >= 7 ? 'warning' : 'danger';

  return (
    <div style={{ padding: '32px 48px', color: '#EDE9E1' }}>
      <PageHeader
        title="אימיילים"
        titleEn="Email Sequences"
        subtitle={`${stats.length} רצפים פעילים — שליחות, קליקים ובריאות מערכת`}
      />

      <KpiGrid cols={4}>
        <KpiCard label="סה״כ נשלחו"       value={totalSent.toLocaleString()} icon="📤" />
        <KpiCard label="הקליקו על קישור"  value={totalClicked.toLocaleString()} icon="🖱️" />
        <KpiCard label="Click Rate ממוצע" value={`${avgClickRate}%`} icon="📊"
          variant={avgClickRate >= 15 ? 'success' : avgClickRate >= 7 ? 'gold' : 'danger'} />
        <KpiCard label="מול ממוצע בתעשייה" value={`${avgClickRate}% / 2.3%`} icon="🏆"
          variant={avgClickRate > 2.3 ? 'success' : 'danger'} />
      </KpiGrid>

      <div style={{
        padding: '12px 16px', marginBottom: 24,
        background: 'rgba(201,150,74,0.06)', border: '1px solid rgba(201,150,74,0.25)',
        borderRadius: 10, fontSize: 12, color: '#AAB0BD', lineHeight: 1.7,
      }}>
        ℹ️ המדידה מבוססת קליקים בלבד: האימיילים הם טקסט נקי ללא פיקסל מעקב
        (Apple Mail מזייף פתיחות), כך שאין נתוני "פתיחה" אמיתיים.
        קליק על קישור = המדד החזק והאמין ביותר למעורבות.
      </div>

      <SectionCard title="Click Rate לפי רצף" titleEn="Click Rate by Sequence">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={sorted.slice(0, 8).map(s => ({
              name: (TEMPLATE_NAMES[s.templateKey] ?? s.templateKey).slice(0, 12),
              'Click Rate': s.clickRate,
            }))}
            margin={{ right: 8, left: 0 }}
          >
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#AAB0BD' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#AAB0BD' }} axisLine={false} tickLine={false} unit="%" />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`]} />
            <Bar dataKey="Click Rate" fill="#C9964A" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="ביצועים לפי רצף" titleEn="Per-Sequence Performance" noPadding>
        <DataTable
          columns={[
            { key: 'name',      label: 'רצף',       width: '28%' },
            { key: 'sent',      label: 'נשלחו',     align: 'center' },
            { key: 'clicked',   label: 'הקליקו',    align: 'center' },
            { key: 'clickRate', label: 'Click Rate', align: 'center' },
            { key: 'health',    label: 'בריאות',    align: 'center' },
            { key: 'bar',       label: '',           width: '12%' },
          ]}
          rows={sorted.map((s) => {
            const h = health(s.clickRate);
            const color = h === 'success' ? '#34A853' : h === 'warning' ? '#FBBC05' : '#EA4335';
            return {
              name: (
                <div>
                  <div style={{ fontWeight: 600, color: '#EDE9E1' }}>
                    {TEMPLATE_NAMES[s.templateKey] ?? s.templateKey}
                  </div>
                  <div style={{ fontSize: 10, color: '#AAB0BD' }}>
                    {TRIGGER_NAMES[s.trigger] ?? s.trigger}{s.delayHours > 0 ? ` · +${s.delayHours}ש׳` : ''}
                  </div>
                </div>
              ),
              sent:      s.sent.toLocaleString(),
              clicked:   s.clicked.toLocaleString(),
              clickRate: <span style={{ fontWeight: 700, color }}>{s.clickRate}%</span>,
              health:    <Badge variant={h}>{h === 'success' ? 'תקין' : h === 'warning' ? 'בינוני' : 'חלש'}</Badge>,
              bar:       <PercentBar value={s.clickRate} color={color} />,
            };
          })}
        />
      </SectionCard>
    </div>
  );
}
