'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PageHeader, KpiCard, KpiGrid, SectionCard, DateRangePicker, Badge } from '@/components/admin/ui';

const STAGE_COLORS = ['#C9964A', '#E8B94A', '#4285F4', '#34A853', '#9C27B0'];

const TT = {
  contentStyle: { background: '#141820', border: '1px solid #2C323E', borderRadius: 8, fontSize: 12, color: '#EDE9E1' },
  labelStyle: { color: '#9E9990', fontWeight: 600 },
  cursor: { fill: 'rgba(201,150,74,0.06)' },
};

interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  conversionRate: number;
}

interface TimeToConversion {
  avgDays: number;
  medianDays: number;
  count: number;
}

export default function FunnelClient() {
  const [range, setRange]   = useState('30d');
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [ttc, setTtc]       = useState<TimeToConversion>({ avgDays: 0, medianDays: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/funnel?dateRange=${range}`)
      .then(r => r.json())
      .then(d => { setFunnel(d.funnel ?? []); setTtc(d.timeToConversion ?? {}); })
      .finally(() => setLoading(false));
  }, [range]);

  const totalLeads  = funnel[0]?.count ?? 0;
  const totalBuyers = funnel.find(f => f.stage === 'buyer')?.count ?? 0;
  const overallConv = totalLeads > 0 ? ((totalBuyers / totalLeads) * 100).toFixed(1) : '0';

  let biggestDrop = { from: '', to: '', dropPct: 0 };
  for (let i = 1; i < funnel.length; i++) {
    const drop = 100 - funnel[i].conversionRate;
    if (drop > biggestDrop.dropPct) {
      biggestDrop = { from: funnel[i - 1].label, to: funnel[i].label, dropPct: Math.round(drop) };
    }
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-assistant), Assistant, sans-serif', color: '#EDE9E1', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <PageHeader
        title="פאנל מכירות"
        titleEn="Sales Funnel"
        subtitle="ניתוח מלא של הפאנל — מנרשם ועד רוכש"
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      <KpiGrid cols={4}>
        <KpiCard label="סה״כ נרשמים" value={loading ? '...' : totalLeads.toLocaleString('he-IL')} icon="👤" />
        <KpiCard label="רוכשים"       value={loading ? '...' : totalBuyers.toLocaleString('he-IL')} icon="🛒" variant="success" />
        <KpiCard label="המרה כוללת"   value={loading ? '...' : `${overallConv}%`} icon="📈" variant="gold" />
        <KpiCard label="זמן ממוצע להמרה" value={loading ? '...' : `${ttc.avgDays} ימים`} icon="⏱️" variant="info" />
      </KpiGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
        {/* Funnel chart */}
        <SectionCard title="ויזואליזציית פאנל" titleEn="Funnel Visualization">
          {loading
            ? <div style={{ color: '#9E9990', fontSize: 13 }}>טוען...</div>
            : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={funnel.map(f => ({ name: f.label, ערך: f.count }))}
                  layout="vertical"
                  margin={{ right: 24, left: 8 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9E9990' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#9E9990' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip {...TT} />
                  <Bar dataKey="ערך" radius={[0, 6, 6, 0]}>
                    {funnel.map((_f, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </SectionCard>

        {/* Drop-off analysis */}
        <SectionCard title="ניתוח נשירה" titleEn="Drop-off Analysis">
          {loading
            ? <div style={{ color: '#9E9990', fontSize: 13 }}>טוען...</div>
            : (
              <>
                {biggestDrop.dropPct > 0 && (
                  <div style={{
                    padding: '14px 16px',
                    background: 'rgba(234,67,53,0.08)',
                    border: '1px solid rgba(234,67,53,0.25)',
                    borderRadius: 10, marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 4 }}>נקודת הנשירה הגדולה</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#EA4335' }}>
                      {biggestDrop.dropPct}% נשירה
                    </div>
                    <div style={{ fontSize: 12, color: '#9E9990', marginTop: 4 }}>
                      בין {biggestDrop.from} → {biggestDrop.to}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {funnel.slice(1).map((f, i) => {
                    const drop = 100 - f.conversionRate;
                    return (
                      <div key={f.stage} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '9px 12px', background: '#1D2430',
                        borderRadius: 8, border: '1px solid #2C323E',
                      }}>
                        <span style={{ fontSize: 12, color: '#9E9990' }}>
                          {funnel[i].label} → {f.label}
                        </span>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Badge variant="success">{f.conversionRate}% המרה</Badge>
                          <Badge variant="danger">{drop}% נשירה</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          }
        </SectionCard>
      </div>

      {/* Velocity */}
      <SectionCard title="מדדי מהירות פאנל" titleEn="Funnel Velocity">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'ממוצע', value: ttc.avgDays, unit: 'ימים' },
            { label: 'חציון', value: ttc.medianDays, unit: 'ימים' },
            { label: 'מדגם', value: ttc.count, unit: 'המרות' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '16px', background: '#1D2430',
              borderRadius: 10, border: '1px solid #2C323E', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#E8B94A' }}>
                {loading ? '...' : item.value}
              </div>
              <div style={{ fontSize: 11, color: '#9E9990', marginTop: 4 }}>{item.unit}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
