'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { PageHeader, KpiCard, KpiGrid, SectionCard, DateRangePicker, Badge, DataTable, PercentBar } from '@/components/admin/ui';
import { PRODUCT_MAP } from '@/lib/admin/queries';

const GOLD = '#c9a84c';
const CHART_COLORS = ['#c9a84c', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#6b7280'];

const TooltipStyle = {
  contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#111827', fontWeight: 600 },
  itemStyle: { color: '#374151' },
};

export default function OverviewClient({
  revenue,
  funnel,
  hive,
  timeToConversion,
  sources,
}: {
  revenue: any;
  funnel: any;
  hive: any;
  timeToConversion: any;
  sources: any;
}) {
  const [dateRange, setDateRange] = useState('30d');

  const ltv = revenue.orderCount > 0
    ? Math.round(revenue.total / revenue.orderCount)
    : 0;

  // Funnel chart data
  const funnelData = funnel.map((f: any) => ({
    name: f.label,
    ערך: f.count,
  }));

  // Product pie data
  const productPieData = Object.entries(revenue.byProduct)
    .sort(([, a]: any, [, b]: any) => b.revenue - a.revenue)
    .map(([pid, data]: [string, any]) => ({
      name: PRODUCT_MAP[pid]?.name || (data as any).name,
      value: (data as any).revenue,
    }));

  return (
    <div>
      <PageHeader
        title="סקירה כללית"
        titleEn="Executive Overview"
        subtitle="מבט על ביצועים, הכנסות ומצב הפאנל"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      {/* KPI Row */}
      <KpiGrid cols={5}>
        <KpiCard
          label="סה״כ הכנסות"
          value={`₪${revenue.total.toLocaleString()}`}
          change={revenue.change}
          changeLabel="מהתקופה הקודמת"
          icon="💰"
          variant="gold"
        />
        <KpiCard label="מספר רכישות" value={revenue.orderCount.toLocaleString()} icon="🛒" />
        <KpiCard label="LTV ממוצע" value={`₪${ltv.toLocaleString()}`} icon="📈" />
        <KpiCard label="MRR (הכוורת)" value={`₪${hive.mrr.toLocaleString()}`} icon="🐝" variant="gold" />
        <KpiCard label="זמן ממוצע להמרה" value={`${timeToConversion.avgDays} ימים`} icon="⏱️" variant="info" />
      </KpiGrid>

      {/* Funnel + Product pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Funnel bar chart */}
        <SectionCard title="פאנל מכירות" titleEn="Sales Funnel">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} layout="vertical" margin={{ right: 16, left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip {...TooltipStyle} />
              <Bar dataKey="ערך" fill={GOLD} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Revenue by product pie */}
        <SectionCard title="הכנסות לפי מוצר" titleEn="Revenue by Product">
          {productPieData.length === 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              אין נתוני הכנסות עדיין
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={productPieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={50}
                  dataKey="value"
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {productPieData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => `₪${Number(v).toLocaleString()}`}
                  {...TooltipStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Sources + Hive */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        <SectionCard title="מקורות תנועה" titleEn="Traffic Sources" noPadding>
          <DataTable
            columns={[
              { key: 'source', label: 'מקור', width: '25%' },
              { key: 'leads', label: 'לידים', align: 'center' },
              { key: 'buyers', label: 'רוכשים', align: 'center' },
              { key: 'conversionRate', label: 'המרה', align: 'center' },
              { key: 'revenue', label: 'הכנסה', align: 'left' },
            ]}
            rows={sources
              .sort((a: any, b: any) => b.revenue - a.revenue)
              .slice(0, 8)
              .map((s: any) => ({
                source: <span style={{ fontWeight: 500, color: '#111827' }}>{s.source}</span>,
                leads: s.leads.toLocaleString(),
                buyers: s.buyers.toLocaleString(),
                conversionRate: (
                  <Badge variant={s.conversionRate >= 5 ? 'success' : s.conversionRate >= 2 ? 'warning' : 'danger'}>
                    {s.conversionRate}%
                  </Badge>
                ),
                revenue: `₪${s.revenue.toLocaleString()}`,
              }))}
          />
        </SectionCard>

        <SectionCard title="הכוורת" titleEn="Community">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <KpiCard label="חברים פעילים" value={hive.total} icon="👥" />
            <KpiCard label="חדשים החודש" value={hive.newThisMonth} icon="✨" variant="success" />
            <KpiCard label="₪29 / חודש" value={hive.tier29} />
            <KpiCard label="₪97 / חודש" value={hive.tier97} variant="gold" />
          </div>
          {hive.atRisk > 0 && (
            <div style={{
              marginTop: '16px', padding: '12px', background: '#fef2f2',
              borderRadius: '8px', border: '1px solid #fecaca', fontSize: '12px', color: '#dc2626',
            }}>
              ⚠️ {hive.atRisk} חברים בחלון החזר (14 יום) - {hive.cancellations} ביטולים החודש
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
