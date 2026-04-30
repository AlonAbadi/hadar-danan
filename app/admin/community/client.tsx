'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, Badge, PercentBar } from '@/components/admin/ui';

const TT = {
  contentStyle: { background: '#141820', border: '1px solid #2C323E', borderRadius: 8, fontSize: 12, color: '#EDE9E1' },
  labelStyle: { color: '#9E9990', fontWeight: 600 },
};

export default function CommunityClient({ hive }: { hive: any }) {
  const churnRate = hive.total > 0 ? ((hive.cancellations / hive.total) * 100).toFixed(1) : '0';

  return (
    <div style={{ padding: '32px 48px', color: '#EDE9E1' }}>
      <PageHeader
        title="הכוורת 🐝"
        titleEn="Community & Membership"
        subtitle="MRR, שימור חברים, ביטולים וחברים בסיכון"
      />

      <KpiGrid cols={4}>
        <KpiCard label="חברים פעילים"  value={hive.total}                            icon="👥" variant="gold" />
        <KpiCard label="MRR"            value={`₪${hive.mrr.toLocaleString()}`}        icon="💰" variant="gold" />
        <KpiCard label="חדשים החודש"   value={hive.newThisMonth}                      icon="✨" variant="success" />
        <KpiCard label="ביטולים החודש" value={hive.cancellations}                     icon="❌"
          variant={hive.cancellations > 0 ? 'danger' : 'success'} />
      </KpiGrid>

      <SectionCard title="פילוח חברים לפי מסלול" titleEn="Member Tier Distribution">
        {hive.total === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9E9990', fontSize: 13 }}>
            אין חברים פעילים עדיין
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: '₪29 / חודש', value: hive.tier29 },
                    { name: '₪97 / חודש', value: hive.tier97 },
                  ]}
                  cx="50%" cy="50%" outerRadius={80} innerRadius={50}
                  dataKey="value" paddingAngle={4}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill="#C9964A" />
                  <Cell fill="#4285F4" />
                </Pie>
                <Tooltip {...TT} formatter={(v: any) => [`${v} חברים`]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: '₪29 / חודש — Starter', count: hive.tier29, mrr: hive.tier29 * 29, color: '#C9964A' },
                { label: '₪97 / חודש — Pro',     count: hive.tier97, mrr: hive.tier97 * 97, color: '#4285F4' },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#EDE9E1' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>{t.count} חברים · ₪{t.mrr.toLocaleString()} MRR</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <SectionCard title="פילוח לפי מסלול" titleEn="Tier Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'מסלול Starter', sub: '₪29 / חודש', count: hive.tier29, color: '#C9964A' },
              { label: 'מסלול Pro',     sub: '₪97 / חודש', count: hive.tier97, color: '#4285F4' },
            ].map(t => (
              <div key={t.label} style={{
                padding: 18, background: '#1D2430', borderRadius: 10,
                border: `1px solid ${t.color}33`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>{t.sub}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: t.color }}>{t.count}</div>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>₪{(t.count * parseInt(t.sub.replace('₪',''))).toLocaleString()} MRR</div>
                  </div>
                </div>
                <PercentBar value={hive.total > 0 ? (t.count / hive.total) * 100 : 0} color={t.color} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="בריאות ומעקב" titleEn="Health & Alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 16, borderRadius: 10,
              background: Number(churnRate) > 5 ? 'rgba(234,67,53,0.08)' : 'rgba(52,168,83,0.08)',
              border: `1px solid ${Number(churnRate) > 5 ? 'rgba(234,67,53,0.25)' : 'rgba(52,168,83,0.25)'}`,
            }}>
              <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 4 }}>שיעור נטישה חודשי</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: Number(churnRate) > 5 ? '#EA4335' : '#34A853' }}>
                {churnRate}%
              </div>
            </div>

            {hive.atRisk > 0 && (
              <div style={{
                padding: 16, background: 'rgba(251,188,5,0.08)',
                borderRadius: 10, border: '1px solid rgba(251,188,5,0.25)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FBBC05', marginBottom: 4 }}>
                  ⚠️ חברים בחלון החזר (14 יום)
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FBBC05' }}>{hive.atRisk} חברים</div>
                <div style={{ fontSize: 11, color: '#9E9990', marginTop: 4 }}>
                  חברים חדשים בתוך חלון הביטול — דורשים תשומת לב
                </div>
              </div>
            )}

            <div style={{
              padding: 16, background: 'rgba(66,133,244,0.08)',
              borderRadius: 10, border: '1px solid rgba(66,133,244,0.25)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4285F4', marginBottom: 4 }}>
                חיובים קרובים (7 ימים)
              </div>
              <div style={{ fontSize: 11, color: '#9E9990', marginTop: 4 }}>
                מעקב אוטומטי דרך Cardcom
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
