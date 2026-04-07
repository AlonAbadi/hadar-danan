'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar, EmptyState } from '@/components/admin/ui';

const TT = {
  contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#111827', fontWeight: 600 },
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
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

const EVENT_LABELS: Record<string, string> = {
  play: 'התחיל צפייה',
  watch_progress: 'התקדמות',
  timeupdate: 'עדכון זמן',
  drop_off: 'עצר',
  completed: 'סיים',
};

export default function VideoClient({
  vimeo,
  eventStats,
}: {
  vimeo: any;
  eventStats: EventStats;
}) {
  const hasTrackingData = eventStats.totalPlays > 0 || eventStats.uniqueViewers > 0;

  // Milestone drop-off bar chart data
  const milestoneData = [
    { label: 'התחיל', pct: '0%', count: eventStats.uniqueViewers, color: '#3b82f6' },
    { label: '25%', pct: '25%', count: eventStats.dropOff[25] ?? 0, color: '#c9a84c' },
    { label: '50%', pct: '50%', count: eventStats.dropOff[50] ?? 0, color: '#c9a84c' },
    { label: '75%', pct: '75%', count: eventStats.dropOff[75] ?? 0, color: '#c9a84c' },
    { label: 'סיים', pct: '100%', count: eventStats.dropOff[100] ?? 0, color: '#16a34a' },
  ];

  // Retention % at each milestone relative to total viewers
  const retention = (count: number) =>
    eventStats.uniqueViewers > 0 ? Math.round((count / eventStats.uniqueViewers) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="סרטונים"
        titleEn="Video Analytics"
        subtitle="נתוני צפייה ממשיים - מעקב מ-Vimeo Player SDK"
      />

      {/* KPIs from Supabase tracking */}
      <KpiGrid cols={4}>
        <KpiCard
          label="צופים ייחודיים"
          value={eventStats.uniqueViewers.toLocaleString()}
          icon="👁"
          variant="gold"
        />
        <KpiCard
          label="סה״כ הפעלות"
          value={eventStats.totalPlays.toLocaleString()}
          icon="▶️"
        />
        <KpiCard
          label="ממוצע צפייה"
          value={`${eventStats.avgWatchPercent}%`}
          icon="📊"
          variant={eventStats.avgWatchPercent >= 50 ? 'success' : eventStats.avgWatchPercent >= 30 ? 'gold' : 'danger'}
        />
        <KpiCard
          label="שיעור השלמה"
          value={`${eventStats.completionRate}%`}
          icon="✅"
          variant={eventStats.completionRate >= 40 ? 'success' : eventStats.completionRate >= 20 ? 'gold' : 'danger'}
        />
      </KpiGrid>

      {/* Drop-off funnel chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SectionCard title="נשירת צופים לפי עומק צפייה" titleEn="Viewer Drop-off by Milestone">
          {!hasTrackingData ? (
            <EmptyState
              icon="📊"
              title="אין נתוני צפייה עדיין"
              description="נתונים יצטברו כשצופים יצפו בסרטון. הטראקינג פעיל."
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={milestoneData} margin={{ right: 8, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TT} formatter={(v: any) => [`${v} צופים`, 'הגיעו לנקודה זו']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {milestoneData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Retention % row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {milestoneData.map((d) => (
                  <div key={d.label} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{d.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>
                      {retention(d.count)}%
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        {/* Drop-off curve over time */}
        <SectionCard title="עקומת נשירה לאורך הסרטון" titleEn="Watch Retention Curve">
          {eventStats.dropOffCurve.length === 0 ? (
            <EmptyState
              icon="📈"
              title="אין נתוני נשירה עדיין"
              description="הנתונים יצטברו כשצופים יצפו בסרטון"
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={eventStats.dropOffCurve.map((d) => ({
                  name: formatSeconds(d.second),
                  צופים: d.viewers,
                }))}
                margin={{ right: 8, left: 0 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} formatter={(v: any) => [`${v} צופים`, '']} />
                <Bar dataKey="צופים" fill="#c9a84c" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Milestone breakdown table */}
      <SectionCard title="פירוט שלבי צפייה" titleEn="Milestone Breakdown" noPadding>
        <DataTable
          columns={[
            { key: 'milestone', label: 'נקודת ציון', width: '25%' },
            { key: 'viewers', label: 'צופים הגיעו', align: 'center' },
            { key: 'retention', label: 'שימור', align: 'center' },
            { key: 'dropped', label: 'נשרו בשלב זה', align: 'center' },
            { key: 'bar', label: '', width: '20%' },
          ]}
          rows={milestoneData.map((d, i) => {
            const prevCount = i === 0 ? eventStats.uniqueViewers : milestoneData[i - 1].count;
            const dropped = Math.max(0, prevCount - d.count);
            const ret = retention(d.count);
            return {
              milestone: <span style={{ fontWeight: 500, color: '#111827' }}>{d.label} ({d.pct})</span>,
              viewers: <span style={{ fontFamily: 'system-ui', fontWeight: 600 }}>{d.count.toLocaleString()}</span>,
              retention: <Badge variant={ret >= 60 ? 'success' : ret >= 30 ? 'gold' : 'danger'}>{ret}%</Badge>,
              dropped: <span style={{ color: dropped > 0 ? '#dc2626' : '#9ca3af', fontFamily: 'system-ui' }}>
                {i === 0 ? '-' : `-${dropped.toLocaleString()}`}
              </span>,
              bar: <PercentBar value={ret} color={d.color} />,
            };
          })}
        />
      </SectionCard>

      {/* Video-to-conversion correlation */}
      <SectionCard title="מתאם צפייה - רכישה" titleEn="Watch Depth vs Purchase Rate">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'צפו פחות מ-25%', count: eventStats.uniqueViewers - (eventStats.dropOff[25] ?? 0), bg: '#fef2f2', color: '#dc2626' },
            { label: 'צפו 25-75%', count: (eventStats.dropOff[25] ?? 0) - (eventStats.dropOff[75] ?? 0), bg: '#fefce8', color: '#ca8a04' },
            { label: 'צפו מעל 75%', count: eventStats.dropOff[75] ?? 0, bg: '#f0fdf4', color: '#16a34a' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '16px', background: item.bg, borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>{item.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: item.color, fontFamily: 'system-ui' }}>
                {Math.max(0, item.count).toLocaleString()}
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>צופים</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '12px', textAlign: 'center' }}>
          חבר לטבלת purchases כדי לראות שיעור רכישה לפי עומק צפייה
        </div>
      </SectionCard>

      {/* Vimeo API data (secondary) */}
      {vimeo.configured && vimeo.data && vimeo.data.length > 0 && (
        <SectionCard title="נתוני Vimeo API" titleEn="Vimeo API (Total Plays)">
          <DataTable
            columns={[
              { key: 'name', label: 'סרטון', width: '35%' },
              { key: 'plays', label: 'צפיות (Vimeo)', align: 'center' },
              { key: 'finishes', label: 'סיימו (Vimeo)', align: 'center' },
              { key: 'duration', label: 'אורך', align: 'center' },
            ]}
            rows={vimeo.data.map((v: any) => ({
              name: <span style={{ fontWeight: 500, color: '#111827' }}>{v.name}</span>,
              plays: v.plays.toLocaleString(),
              finishes: v.finishes.toLocaleString(),
              duration: formatDuration(v.duration),
            }))}
          />
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
            נתוני Vimeo API: צפיות כוללות (כולל מחדש). נתוני SDK למעלה מדויקים יותר לניתוח נשירה.
          </div>
        </SectionCard>
      )}

      {!vimeo.configured && (
        <div style={{
          padding: '12px 16px', background: '#fefce8', border: '1px solid #fef08a',
          borderRadius: '8px', fontSize: '12px', color: '#ca8a04', marginTop: '4px',
        }}>
          VIMEO_ACCESS_TOKEN לא מוגדר - נתוני Vimeo API לא זמינים. נתוני SDK פעילים.
        </div>
      )}
    </div>
  );
}
