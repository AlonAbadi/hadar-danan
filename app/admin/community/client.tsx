'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, Badge } from '@/components/admin/ui';

const TT = { contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#111827', fontWeight: 600 } };

export default function CommunityClient({ hive }: { hive: any }) {
  const churnRate = hive.total > 0 ? ((hive.cancellations / hive.total) * 100).toFixed(1) : '0';

  return (
    <div>
      <PageHeader
        title="הכוורת 🐝"
        titleEn="Community & Membership"
        subtitle="MRR, שימור חברים, ביטולים וחברים בסיכון"
      />

      <KpiGrid cols={4}>
        <KpiCard label="חברים פעילים" value={hive.total} icon="👥" variant="gold" />
        <KpiCard label="MRR" value={`₪${hive.mrr.toLocaleString()}`} icon="💰" variant="gold" />
        <KpiCard label="חדשים החודש" value={hive.newThisMonth} icon="✨" variant="success" />
        <KpiCard
          label="ביטולים החודש"
          value={hive.cancellations}
          icon="❌"
          variant={hive.cancellations > 0 ? 'danger' : 'success'}
        />
      </KpiGrid>

      {/* Tier donut chart */}
      <SectionCard title="פילוח חברים לפי מסלול" titleEn="Member Tier Distribution">
        {hive.total === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
            אין חברים פעילים עדיין
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'center' }}>
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
                  <Cell fill="#c9a84c" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip {...TT} formatter={(v: any) => [`${v} חברים`]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>₪29 / חודש</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{hive.tier29} חברים · ₪{(hive.tier29 * 29).toLocaleString()} MRR</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>₪97 / חודש</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{hive.tier97} חברים · ₪{(hive.tier97 * 97).toLocaleString()} MRR</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Tier breakdown */}
        <SectionCard title="פילוח לפי מסלול" titleEn="Tier Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>מסלול בסיסי</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>₪29 / חודש</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827', fontFamily: 'system-ui' }}>{hive.tier29}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>₪{(hive.tier29 * 29).toLocaleString()} MRR</div>
                </div>
              </div>
              <div style={{
                height: '6px', background: '#e5e7eb', borderRadius: '3px',
                marginTop: '12px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${hive.total > 0 ? (hive.tier29 / hive.total) * 100 : 0}%`,
                  background: '#c9a84c',
                }} />
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: '#fffbf0',
              borderRadius: '10px',
              border: '1px solid #f3d89a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#c9a84c' }}>מסלול פרמיום</div>
                  <div style={{ fontSize: '11px', color: '#d4b06b' }}>₪97 / חודש</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#c9a84c', fontFamily: 'system-ui' }}>{hive.tier97}</div>
                  <div style={{ fontSize: '11px', color: '#d4b06b' }}>₪{(hive.tier97 * 97).toLocaleString()} MRR</div>
                </div>
              </div>
              <div style={{
                height: '6px', background: '#fde68a', borderRadius: '3px',
                marginTop: '12px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${hive.total > 0 ? (hive.tier97 / hive.total) * 100 : 0}%`,
                  background: '#c9a84c',
                }} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Health & Alerts */}
        <SectionCard title="בריאות ומעקב" titleEn="Health & Alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Churn rate */}
            <div style={{
              padding: '16px',
              background: Number(churnRate) > 5 ? '#fef2f2' : '#f0fdf4',
              borderRadius: '8px',
              border: `1px solid ${Number(churnRate) > 5 ? '#fecaca' : '#bbf7d0'}`,
            }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>שיעור נטישה חודשי</div>
              <div style={{
                fontSize: '24px', fontWeight: 600, fontFamily: 'system-ui',
                color: Number(churnRate) > 5 ? '#dc2626' : '#16a34a',
              }}>
                {churnRate}%
              </div>
            </div>

            {/* At-risk alert */}
            {hive.atRisk > 0 && (
              <div style={{
                padding: '16px',
                background: '#fefce8',
                borderRadius: '8px',
                border: '1px solid #fef08a',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: '#ca8a04', marginBottom: '4px' }}>
                  ⚠️ חברים בחלון החזר (14 יום)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#ca8a04', fontFamily: 'system-ui' }}>
                  {hive.atRisk} חברים
                </div>
                <div style={{ fontSize: '11px', color: '#a16207', marginTop: '4px' }}>
                  חברים חדשים שעדיין בתוך חלון הביטול - דורשים תשומת לב מיוחדת
                </div>
              </div>
            )}

            {/* Upcoming renewals */}
            <div style={{
              padding: '16px',
              background: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: '#2563eb', marginBottom: '4px' }}>
                חיובים קרובים (7 ימים)
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                מעקב אוטומטי דרך Cardcom - חידושים ותשלומים נכשלים
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
