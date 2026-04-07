'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar, DateRangePicker } from '@/components/admin/ui';
import { PRODUCT_MAP } from '@/lib/admin/queries';

const COLORS = ['#c9a84c', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6'];
const TT = { contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#111827', fontWeight: 600 } };

export default function ProductsClient({ revenue }: { revenue: any }) {
  const [dateRange, setDateRange] = useState('30d');

  const products = Object.entries(revenue.byProduct)
    .map(([pid, data]: [string, any]) => ({
      id: pid,
      name: PRODUCT_MAP[pid]?.name || data.name,
      nameEn: PRODUCT_MAP[pid]?.nameEn || pid,
      revenue: data.revenue,
      count: data.count,
      price: PRODUCT_MAP[pid]?.price || 0,
      pct: revenue.total > 0 ? Math.round((data.revenue / revenue.total) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProduct = products[0];

  return (
    <div>
      <PageHeader
        title="מוצרים"
        titleEn="Product Performance"
        subtitle="הכנסות, המרות וניתוח ביצועים לפי מוצר"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      <KpiGrid cols={4}>
        <KpiCard label="סה״כ הכנסות" value={`₪${revenue.total.toLocaleString()}`} icon="💰" variant="gold" />
        <KpiCard label="סה״כ רכישות" value={revenue.orderCount} icon="🛒" />
        <KpiCard label="מוצר מוביל" value={topProduct?.name || '-'} icon="🏆" variant="success" />
        <KpiCard
          label="הכנסה ממוצעת לרכישה"
          value={`₪${revenue.orderCount > 0 ? Math.round(revenue.total / revenue.orderCount).toLocaleString() : 0}`}
          icon="📊"
        />
      </KpiGrid>

      <SectionCard title="הכנסות לפי מוצר" titleEn="Revenue by Product">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={products.map(p => ({ name: p.name, הכנסה: p.revenue }))} layout="vertical" margin={{ right: 24, left: 8 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₪${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
            <Tooltip {...TT} formatter={(v: any) => [`₪${Number(v).toLocaleString()}`, 'הכנסה']} />
            <Bar dataKey="הכנסה" radius={[0, 6, 6, 0]}>
              {products.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="ביצועים לפי מוצר" titleEn="Per-Product Breakdown" noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'מוצר', width: '30%' },
            { key: 'revenue', label: 'הכנסה', align: 'center' },
            { key: 'count', label: 'רכישות', align: 'center' },
            { key: 'avg', label: 'ממוצע', align: 'center' },
            { key: 'pct', label: '% מסה״כ', align: 'center' },
            { key: 'bar', label: '', width: '20%' },
          ]}
          rows={products.map((p) => ({
            name: (
              <div>
                <div style={{ fontWeight: 500, color: '#111827' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.nameEn}</div>
              </div>
            ),
            revenue: <span style={{ fontWeight: 600, fontFamily: 'system-ui', color: '#111827' }}>₪{p.revenue.toLocaleString()}</span>,
            count: p.count.toLocaleString(),
            avg: `₪${p.count > 0 ? Math.round(p.revenue / p.count).toLocaleString() : 0}`,
            pct: <Badge variant={p.pct >= 25 ? 'gold' : 'default'}>{p.pct}%</Badge>,
            bar: <PercentBar value={p.pct} color="#c9a84c" />,
          }))}
        />
      </SectionCard>

      {/* Upsell path - credit ladder visualization */}
      <SectionCard title="מסלול שדרוג (Credit Ladder)" titleEn="Upsell Path">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '8px 0' }}>
          {['free_training', 'challenge', 'workshop', 'course', 'strategy', 'premium', 'partnership'].map((pid, i, arr) => {
            const p = PRODUCT_MAP[pid];
            const hasRevenue = revenue.byProduct[pid]?.revenue > 0;
            return (
              <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: hasRevenue ? '#fffbf0' : '#f9fafb',
                  border: `1px solid ${hasRevenue ? '#f3d89a' : '#e5e7eb'}`,
                  textAlign: 'center',
                  minWidth: '100px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: hasRevenue ? '#c9a84c' : '#6b7280' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui', marginTop: '4px' }}>
                    {p.price === 0 ? 'חינם' : `₪${p.price.toLocaleString()}`}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                    {revenue.byProduct[pid]?.count || 0} רכישות
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: '#d1d5db', fontSize: '16px' }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
