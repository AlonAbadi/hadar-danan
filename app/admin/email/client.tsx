'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar } from '@/components/admin/ui';

const TT = { contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#111827', fontWeight: 600 } };

const SEQUENCE_NAMES: Record<string, string> = {
  welcome: 'ברוכים הבאים',
  free_training_followup: 'מעקב שיעור במתנה',
  challenge_nurture: 'נרטורינג אתגר',
  challenge_upsell: 'אפסייל מאתגר',
  workshop_invite: 'הזמנה לסדנה',
  workshop_reminder: 'תזכורת סדנה',
  course_onboard: 'הצטרפות לקורס',
  course_completion: 'סיום קורס',
  strategy_booking: 'הזמנת פגישת אסטרטגיה',
  strategy_followup: 'מעקב אסטרטגיה',
  premium_intro: 'היכרות פרמיום',
  partnership_outreach: 'פנייה לשותפות',
  hive_welcome: 'ברוכים הבאים לכוורת',
  hive_engagement: 'מעורבות כוורת',
  reengagement: 'הפעלה מחדש',
  cart_abandonment: 'נטישת עגלה',
};

export default function EmailClient({ stats }: { stats: any[] }) {
  const totalSent = stats.reduce((s, x) => s + x.sent, 0);
  const totalOpened = stats.reduce((s, x) => s + x.opened, 0);
  const totalClicked = stats.reduce((s, x) => s + x.clicked, 0);
  const totalBounced = stats.reduce((s, x) => s + x.bounced, 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgCtr = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0';

  return (
    <div>
      <PageHeader
        title="אימיילים"
        titleEn="Email Sequences"
        subtitle="16 רצפי אימייל - פתיחות, קליקים ובריאות מערכת"
      />

      <KpiGrid cols={5}>
        <KpiCard label="סה״כ נשלחו" value={totalSent.toLocaleString()} icon="📤" />
        <KpiCard label="נפתחו" value={totalOpened.toLocaleString()} icon="📬" />
        <KpiCard
          label="Open Rate ממוצע"
          value={`${avgOpenRate}%`}
          icon="📊"
          variant={avgOpenRate >= 25 ? 'success' : avgOpenRate >= 18 ? 'gold' : 'danger'}
        />
        <KpiCard
          label="CTR ממוצע"
          value={`${avgCtr}%`}
          icon="🖱️"
          variant={avgCtr >= 3 ? 'success' : avgCtr >= 1.5 ? 'gold' : 'danger'}
        />
        <KpiCard
          label="Bounce Rate"
          value={`${bounceRate}%`}
          icon="⚠️"
          variant={Number(bounceRate) < 2 ? 'success' : Number(bounceRate) < 5 ? 'gold' : 'danger'}
        />
      </KpiGrid>

      {Number(bounceRate) >= 3 && (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#dc2626',
        }}>
          ⚠️ Bounce rate גבוה ({bounceRate}%) - בדוק את רשימת הנמענים ונקה כתובות לא תקינות
        </div>
      )}

      <SectionCard title="Open Rate ו-CTR לפי רצף" titleEn="Open Rate & CTR by Sequence">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={stats.sort((a, b) => b.sent - a.sent).slice(0, 8).map(s => ({
              name: SEQUENCE_NAMES[s.sequenceId]?.slice(0, 8) || s.sequenceId.slice(0, 8),
              'Open Rate': s.openRate,
              'CTR': s.ctr,
            }))}
            margin={{ right: 8, left: 0 }}
          >
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip {...TT} formatter={(v: any) => [`${v}%`]} />
            <Bar dataKey="Open Rate" fill="#c9a84c" radius={[4, 4, 0, 0]} />
            <Bar dataKey="CTR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="ביצועים לפי רצף" titleEn="Per-Sequence Performance" noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'רצף', width: '22%' },
            { key: 'sent', label: 'נשלחו', align: 'center' },
            { key: 'opened', label: 'נפתחו', align: 'center' },
            { key: 'clicked', label: 'קליקים', align: 'center' },
            { key: 'openRate', label: 'Open Rate', align: 'center' },
            { key: 'ctr', label: 'CTR', align: 'center' },
            { key: 'health', label: 'בריאות', align: 'center' },
            { key: 'bar', label: '', width: '12%' },
          ]}
          rows={stats
            .sort((a, b) => b.sent - a.sent)
            .map((s) => {
              const health = s.openRate >= 25 && s.ctr >= 2 ? 'success' :
                             s.openRate >= 18 || s.ctr >= 1 ? 'warning' : 'danger';
              return {
                name: (
                  <div>
                    <div style={{ fontWeight: 500, color: '#111827' }}>
                      {SEQUENCE_NAMES[s.sequenceId] || s.sequenceId}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {s.sequenceId}
                    </div>
                  </div>
                ),
                sent: s.sent.toLocaleString(),
                opened: s.opened.toLocaleString(),
                clicked: s.clicked.toLocaleString(),
                openRate: (
                  <span style={{
                    fontWeight: 500,
                    color: s.openRate >= 25 ? '#16a34a' : s.openRate >= 18 ? '#ca8a04' : '#dc2626',
                    fontFamily: 'system-ui',
                  }}>
                    {s.openRate}%
                  </span>
                ),
                ctr: (
                  <span style={{
                    fontWeight: 500,
                    color: s.ctr >= 3 ? '#16a34a' : s.ctr >= 1.5 ? '#ca8a04' : '#dc2626',
                    fontFamily: 'system-ui',
                  }}>
                    {s.ctr}%
                  </span>
                ),
                health: (
                  <Badge variant={health}>
                    {health === 'success' ? 'תקין' : health === 'warning' ? 'בינוני' : 'חלש'}
                  </Badge>
                ),
                bar: <PercentBar value={s.openRate} color={health === 'success' ? '#16a34a' : health === 'warning' ? '#eab308' : '#dc2626'} />,
              };
            })}
        />
      </SectionCard>

      {/* Benchmarks */}
      <SectionCard title="השוואה לממוצע בתעשייה" titleEn="Industry Benchmarks">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Open Rate', yours: avgOpenRate, benchmark: 21, unit: '%' },
            { label: 'CTR', yours: avgCtr, benchmark: 2.3, unit: '%' },
            { label: 'Bounce Rate', yours: Number(bounceRate), benchmark: 2.0, unit: '%', inverse: true },
          ].map((b) => {
            const better = b.inverse ? b.yours < b.benchmark : b.yours > b.benchmark;
            return (
              <div key={b.label} style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>{b.label}</div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{
                    fontSize: '20px', fontWeight: 600, fontFamily: 'system-ui',
                    color: better ? '#16a34a' : '#dc2626',
                  }}>
                    {b.yours}{b.unit}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    / {b.benchmark}{b.unit} ממוצע
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: better ? '#16a34a' : '#dc2626', marginTop: '4px' }}>
                  {better ? '↑ מעל הממוצע' : '↓ מתחת לממוצע'}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
