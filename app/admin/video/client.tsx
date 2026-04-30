'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar, EmptyState } from '@/components/admin/ui';

const TT = {
  contentStyle: { background: '#141820', border: '1px solid #2C323E', borderRadius: 8, fontSize: 12, color: '#EDE9E1' },
  labelStyle: { color: '#9E9990', fontWeight: 600 },
  cursor: { fill: 'rgba(201,150,74,0.06)' },
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type EventStats = {
  totalPlays: number;
  uniqueViewers: number;
  avgWatchPercent: number;
  completionRate: number;
  dropOff: Record<number, number>;
  dropOffCurve: { second: number; viewers: number }[];
  recentEvents: { time: string; type: string; percent: number }[];
};

export default function VideoClient({ vimeo, eventStats }: { vimeo: any; eventStats: EventStats }) {
  const hasTrackingData = eventStats.totalPlays > 0 || eventStats.uniqueViewers > 0;

  const milestoneData = [
    { label: 'התחיל', pct: '0%',   count: eventStats.uniqueViewers,    color: '#4285F4' },
    { label: '25%',   pct: '25%',  count: eventStats.dropOff[25] ?? 0, color: '#C9964A' },
    { label: '50%',   pct: '50%',  count: eventStats.dropOff[50] ?? 0, color: '#C9964A' },
    { label: '75%',   pct: '75%',  count: eventStats.dropOff[75] ?? 0, color: '#C9964A' },
    { label: 'סיים',  pct: '100%', count: eventStats.dropOff[100] ?? 0, color: '#34A853' },
  ];

  const retention = (count: number) =>
    eventStats.uniqueViewers > 0 ? Math.round((count / eventStats.uniqueViewers) * 100) : 0;

  const watchGroups = [
    { label: 'צפו פחות מ-25%', count: eventStats.uniqueViewers - (eventStats.dropOff[25] ?? 0), color: '#EA4335', border: 'rgba(234,67,53,0.25)', bg: 'rgba(234,67,53,0.08)' },
    { label: 'צפו 25–75%',    count: Math.max(0, (eventStats.dropOff[25] ?? 0) - (eventStats.dropOff[75] ?? 0)), color: '#FBBC05', border: 'rgba(251,188,5,0.25)', bg: 'rgba(251,188,5,0.08)' },
    { label: 'צפו מעל 75%',   count: eventStats.dropOff[75] ?? 0, color: '#34A853', border: 'rgba(52,168,83,0.25)', bg: 'rgba(52,168,83,0.08)' },
  ];

  return (
    <div style={{ padding: '32px 48px', color: '#EDE9E1' }}>
      <PageHeader
        title="סרטונים"
        titleEn="Video Analytics"
        subtitle="נתוני צפייה ממשיים — מעקב מ-Vimeo Player SDK"
      />

      <KpiGrid cols={4}>
        <KpiCard label="צופים ייחודיים"  value={eventStats.uniqueViewers.toLocaleString()} icon="👁" variant="gold" />
        <KpiCard label="סה״כ הפעלות"     value={eventStats.totalPlays.toLocaleString()} icon="▶️" />
        <KpiCard label="ממוצע צפייה"     value={`${eventStats.avgWatchPercent}%`} icon="📊"
          variant={eventStats.avgWatchPercent >= 50 ? 'success' : eventStats.avgWatchPercent >= 30 ? 'gold' : 'danger'} />
        <KpiCard label="שיעור השלמה"     value={`${eventStats.completionRate}%`} icon="✅"
          variant={eventStats.completionRate >= 40 ? 'success' : eventStats.completionRate >= 20 ? 'gold' : 'danger'} />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <SectionCard title="נשירת צופים לפי עומק צפייה" titleEn="Viewer Drop-off by Milestone">
          {!hasTrackingData ? (
            <EmptyState icon="📊" title="אין נתוני צפייה עדיין" description="נתונים יצטברו כשצופים יצפו בסרטון. הטראקינג פעיל." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={milestoneData} margin={{ right: 8, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9E9990' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9E9990' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v: any) => [`${v} צופים`, 'הגיעו לנקודה זו']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {milestoneData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {milestoneData.map((d) => (
                  <div key={d.label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>{d.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: d.color }}>{retention(d.count)}%</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="עקומת נשירה לאורך הסרטון" titleEn="Watch Retention Curve">
          {eventStats.dropOffCurve.length === 0 ? (
            <EmptyState icon="📈" title="אין נתוני נשירה עדיין" description="הנתונים יצטברו כשצופים יצפו בסרטון" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={eventStats.dropOffCurve.map((d) => ({
                  name: formatDuration(d.second),
                  צופים: d.viewers,
                }))}
                margin={{ right: 8, left: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9E9990' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: '#9E9990' }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v: any) => [`${v} צופים`, '']} />
                <Bar dataKey="צופים" fill="#C9964A" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <SectionCard title="פירוט שלבי צפייה" titleEn="Milestone Breakdown" noPadding>
        <DataTable
          columns={[
            { key: 'milestone', label: 'נקודת ציון', width: '25%' },
            { key: 'viewers',   label: 'צופים הגיעו', align: 'center' },
            { key: 'retention', label: 'שימור',       align: 'center' },
            { key: 'dropped',   label: 'נשרו',        align: 'center' },
            { key: 'bar',       label: '',            width: '20%' },
          ]}
          rows={milestoneData.map((d, i) => {
            const prevCount = i === 0 ? eventStats.uniqueViewers : milestoneData[i - 1].count;
            const dropped = Math.max(0, prevCount - d.count);
            const ret = retention(d.count);
            return {
              milestone: <span style={{ fontWeight: 700 }}>{d.label} ({d.pct})</span>,
              viewers:   <span style={{ fontWeight: 700 }}>{d.count.toLocaleString()}</span>,
              retention: <Badge variant={ret >= 60 ? 'success' : ret >= 30 ? 'gold' : 'danger'}>{ret}%</Badge>,
              dropped:   <span style={{ color: dropped > 0 ? '#EA4335' : '#9E9990' }}>{i === 0 ? '—' : `-${dropped.toLocaleString()}`}</span>,
              bar:       <PercentBar value={ret} color={d.color} />,
            };
          })}
        />
      </SectionCard>

      <SectionCard title="עומק צפייה" titleEn="Watch Depth Distribution">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {watchGroups.map((item) => (
            <div key={item.label} style={{
              padding: 16, background: item.bg, borderRadius: 10,
              border: `1px solid ${item.border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>
                {Math.max(0, item.count).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#9E9990', marginTop: 4 }}>צופים</div>
            </div>
          ))}
        </div>
      </SectionCard>

      {vimeo.configured && vimeo.data && vimeo.data.length > 0 && (
        <SectionCard title="נתוני Vimeo API" titleEn="Vimeo API (Total Plays)" noPadding>
          <DataTable
            columns={[
              { key: 'name',      label: 'סרטון',          width: '40%' },
              { key: 'plays',     label: 'צפיות (Vimeo)',  align: 'center' },
              { key: 'finishes',  label: 'סיימו (Vimeo)',  align: 'center' },
              { key: 'duration',  label: 'אורך',           align: 'center' },
            ]}
            rows={vimeo.data.map((v: any) => ({
              name:     <span style={{ fontWeight: 600 }}>{v.name}</span>,
              plays:    v.plays.toLocaleString(),
              finishes: v.finishes.toLocaleString(),
              duration: formatDuration(v.duration),
            }))}
          />
        </SectionCard>
      )}

      {!vimeo.configured && (
        <div style={{
          padding: '12px 16px', background: 'rgba(251,188,5,0.08)',
          border: '1px solid rgba(251,188,5,0.25)', borderRadius: 10,
          fontSize: 12, color: '#FBBC05', marginTop: 4,
        }}>
          VIMEO_ACCESS_TOKEN לא מוגדר — נתוני Vimeo API לא זמינים. נתוני SDK פעילים.
        </div>
      )}
    </div>
  );
}
