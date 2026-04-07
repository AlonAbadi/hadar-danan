'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, KpiCard, KpiGrid, SectionCard, DateRangePicker, Badge } from '@/components/admin/ui';

const STAGE_COLORS = ['#c9a84c', '#d4a54c', '#3b82f6', '#22c55e', '#8b5cf6'];
const TT = { contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#111827', fontWeight: 600 } };

export default function FunnelClient({ funnel, timeToConversion }: { funnel: any; timeToConversion: any }) {
  const [dateRange, setDateRange] = useState('30d');

  const totalLeads = funnel[0]?.count || 0;
  const totalBuyers = funnel.find((f: any) => f.stage === 'buyer')?.count || 0;
  const overallConversion = totalLeads > 0 ? ((totalBuyers / totalLeads) * 100).toFixed(1) : '0';

  // Find biggest drop-off
  let biggestDrop = { from: '', to: '', dropPct: 0 };
  for (let i = 1; i < funnel.length; i++) {
    const drop = 100 - funnel[i].conversionRate;
    if (drop > biggestDrop.dropPct) {
      biggestDrop = { from: funnel[i - 1].label, to: funnel[i].label, dropPct: Math.round(drop) };
    }
  }

  return (
    <div>
      <PageHeader
        title="פאנל מכירות"
        titleEn="Sales Funnel"
        subtitle="ניתוח מלא של הפאנל - מנרשם ועד רוכש"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      <KpiGrid cols={4}>
        <KpiCard label="סה״כ נרשמים" value={totalLeads.toLocaleString()} icon="👤" />
        <KpiCard label="רוכשים" value={totalBuyers.toLocaleString()} icon="🛒" variant="success" />
        <KpiCard label="המרה כוללת" value={`${overallConversion}%`} icon="📈" variant="gold" />
        <KpiCard label="זמן ממוצע להמרה" value={`${timeToConversion.avgDays} ימים`} icon="⏱️" variant="info" />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <SectionCard title="ויזואליזציית פאנל" titleEn="Funnel Visualization">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={funnel.map((f: any) => ({ name: f.label, ערך: f.count }))}
              layout="vertical"
              margin={{ right: 24, left: 8 }}
            >
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip {...TT} />
              <Bar dataKey="ערך" radius={[0, 6, 6, 0]}>
                {funnel.map((_: any, i: number) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="ניתוח נשירה" titleEn="Drop-off Analysis">
          {biggestDrop.dropPct > 0 && (
            <div style={{
              padding: '16px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                נקודת הנשירה הגדולה
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#dc2626', fontFamily: 'system-ui' }}>
                {biggestDrop.dropPct}% נשירה
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                בין {biggestDrop.from} → {biggestDrop.to}
              </div>
            </div>
          )}

          {/* Stage-by-stage breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {funnel.slice(1).map((f: any, i: number) => {
              const drop = 100 - f.conversionRate;
              return (
                <div key={f.stage} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>
                    {funnel[i].label} → {f.label}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Badge variant="success">{f.conversionRate}% המרה</Badge>
                    <Badge variant="danger">{drop}% נשירה</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="מדדי מהירות פאנל" titleEn="Funnel Velocity">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>ממוצע</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>
              {timeToConversion.avgDays}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>ימים</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>חציון</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>
              {timeToConversion.medianDays}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>ימים</div>
          </div>
          <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>מדגם</div>
            <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>
              {timeToConversion.count}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>המרות</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
