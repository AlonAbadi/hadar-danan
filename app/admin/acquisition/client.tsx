'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar, DateRangePicker, EmptyState, ActionButton } from '@/components/admin/ui';

const COLORS = ['#c9a84c', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#6b7280'];
const TT = { contentStyle: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#111827', fontWeight: 600 } };

function ApiStatusBanner({ name, configured }: { name: string; configured: boolean }) {
  if (configured) return null;
  return (
    <div style={{
      padding: '12px 16px',
      background: '#fefce8',
      border: '1px solid #fef08a',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
      fontSize: '12px',
      color: '#ca8a04',
    }}>
      <span>⚠️ {name} - לא מחובר. הוסף API credentials ב-.env</span>
      <span style={{ color: '#9ca3af', fontSize: '11px' }}>
        {name === 'Meta Ads' ? 'META_ADS_ACCESS_TOKEN, META_AD_ACCOUNT_ID' :
         name === 'Google Ads' ? 'GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_DEVELOPER_TOKEN' :
         'GA4_PROPERTY_ID + GOOGLE_APPLICATION_CREDENTIALS_JSON'}
      </span>
    </div>
  );
}

export default function AcquisitionClient({
  sources,
  metaAds,
  googleAds,
  ga4,
}: {
  sources: any[];
  metaAds: any;
  googleAds: any;
  ga4: any;
}) {
  const [dateRange, setDateRange] = useState('30d');

  const totalLeads = sources.reduce((s, x) => s + x.leads, 0);
  const totalRevenue = sources.reduce((s, x) => s + x.revenue, 0);
  const totalBuyers = sources.reduce((s, x) => s + x.buyers, 0);
  const overallCR = totalLeads > 0 ? ((totalBuyers / totalLeads) * 100).toFixed(1) : '0';
  const metaSpend = metaAds.data?.reduce((s: number, c: any) => s + c.spend, 0) || 0;

  return (
    <div>
      <PageHeader
        title="רכישת לקוחות"
        titleEn="Acquisition & Attribution"
        subtitle="מקורות תנועה, ביצועי קמפיינים וייחוס הכנסות"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      {/* API Status Banners */}
      <ApiStatusBanner name="Meta Ads" configured={metaAds.configured} />
      <ApiStatusBanner name="Google Ads" configured={googleAds.configured} />
      <ApiStatusBanner name="GA4" configured={ga4.configured} />

      <KpiGrid cols={5}>
        <KpiCard label="סה״כ לידים" value={totalLeads.toLocaleString()} icon="👤" />
        <KpiCard label="רוכשים" value={totalBuyers.toLocaleString()} icon="🛒" variant="success" />
        <KpiCard label="המרה כוללת" value={`${overallCR}%`} icon="📈" variant="gold" />
        <KpiCard label="הכנסה מלידים" value={`₪${totalRevenue.toLocaleString()}`} icon="💰" />
        <KpiCard
          label="הוצאה על מדיה (Meta)"
          value={metaSpend > 0 ? `₪${Math.round(metaSpend).toLocaleString()}` : 'לא מחובר'}
          icon="📢"
          variant={metaSpend > 0 ? 'info' : 'default'}
        />
      </KpiGrid>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SectionCard title="הכנסות לפי מקור" titleEn="Revenue by Source">
          {sources.length === 0 ? (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>אין נתונים</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sources.sort((a, b) => b.revenue - a.revenue).slice(0, 6).map(s => ({ name: s.source, value: s.revenue }))}
                  cx="50%" cy="45%" outerRadius={80} innerRadius={45}
                  dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sources.slice(0, 6).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TT} formatter={(v: any) => [`₪${Number(v).toLocaleString()}`, 'הכנסה']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="לידים מול רוכשים לפי מקור" titleEn="Leads vs Buyers">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sources.sort((a, b) => b.leads - a.leads).slice(0, 6).map(s => ({ name: s.source, לידים: s.leads, רוכשים: s.buyers }))} margin={{ right: 8, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip {...TT} />
              <Bar dataKey="לידים" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="רוכשים" fill="#c9a84c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Source breakdown */}
      <SectionCard title="ביצועים לפי מקור" titleEn="Performance by Source" noPadding>
        <DataTable
          columns={[
            { key: 'source', label: 'מקור', width: '20%' },
            { key: 'leads', label: 'לידים', align: 'center' },
            { key: 'buyers', label: 'רוכשים', align: 'center' },
            { key: 'cr', label: 'המרה', align: 'center' },
            { key: 'revenue', label: 'הכנסה', align: 'center' },
            { key: 'roas', label: 'ROAS', align: 'center' },
            { key: 'bar', label: '', width: '15%' },
          ]}
          rows={sources
            .sort((a, b) => b.revenue - a.revenue)
            .map((s) => ({
              source: <span style={{ fontWeight: 500, color: '#111827' }}>{s.source}</span>,
              leads: s.leads.toLocaleString(),
              buyers: s.buyers.toLocaleString(),
              cr: (
                <Badge variant={s.conversionRate >= 5 ? 'success' : s.conversionRate >= 2 ? 'warning' : 'danger'}>
                  {s.conversionRate}%
                </Badge>
              ),
              revenue: `₪${s.revenue.toLocaleString()}`,
              roas: '-',
              bar: <PercentBar value={totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0} color="#c9a84c" />,
            }))}
        />
      </SectionCard>

      {/* GA4 overview */}
      {ga4.configured && ga4.data && (
        <>
          <KpiGrid cols={4}>
            <KpiCard label="סשנים (GA4)" value={(ga4.data.overview?.sessions ?? 0).toLocaleString()} icon="📊" variant="info" />
            <KpiCard label="משתמשים (GA4)" value={(ga4.data.overview?.users ?? 0).toLocaleString()} icon="👥" />
            <KpiCard label="Bounce Rate" value={`${((ga4.data.overview?.bounceRate ?? 0) * 100).toFixed(1)}%`} icon="↩️" />
            <KpiCard label="זמן סשן ממוצע" value={`${Math.round((ga4.data.overview?.avgSessionDuration ?? 0) / 60)}m`} icon="⏱️" />
          </KpiGrid>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <SectionCard title="ערוצי תנועה (GA4)" titleEn="Traffic Channels" noPadding>
              <DataTable
                columns={[
                  { key: 'channel', label: 'ערוץ', width: '40%' },
                  { key: 'sessions', label: 'סשנים', align: 'center' },
                  { key: 'users', label: 'משתמשים', align: 'center' },
                ]}
                rows={(ga4.data.channels ?? []).map((c: any) => ({
                  channel: <span style={{ fontWeight: 500 }}>{c.channel}</span>,
                  sessions: c.sessions.toLocaleString(),
                  users: c.users.toLocaleString(),
                }))}
              />
            </SectionCard>

            <SectionCard title="אירועים (GA4)" titleEn="Key Events">
              {(ga4.data.events ?? []).map((e: any) => (
                <div key={e.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                  <span style={{ color: '#374151' }}>{e.name}</span>
                  <span style={{ fontWeight: 600, color: '#111827' }}>{e.count.toLocaleString()}</span>
                </div>
              ))}
            </SectionCard>
          </div>
        </>
      )}

      {/* Meta Ads campaigns */}
      <SectionCard
        title="קמפיינים - Meta Ads"
        titleEn="Meta Campaigns"
        actions={!metaAds.configured && <Badge variant="warning">לא מחובר</Badge>}
        noPadding
      >
        {metaAds.configured && metaAds.data ? (
          <DataTable
            columns={[
              { key: 'name', label: 'קמפיין', width: '25%' },
              { key: 'impressions', label: 'חשיפות', align: 'center' },
              { key: 'clicks', label: 'קליקים', align: 'center' },
              { key: 'ctr', label: 'CTR', align: 'center' },
              { key: 'spend', label: 'הוצאה', align: 'center' },
              { key: 'conversions', label: 'המרות', align: 'center' },
              { key: 'cpa', label: 'CPA', align: 'center' },
            ]}
            rows={metaAds.data.map((c: any) => ({
              name: <span style={{ fontWeight: 500, color: '#111827' }}>{c.name}</span>,
              impressions: c.impressions.toLocaleString(),
              clicks: c.clicks.toLocaleString(),
              ctr: `${c.ctr.toFixed(2)}%`,
              spend: `₪${Math.round(c.spend).toLocaleString()}`,
              conversions: c.conversions,
              cpa: c.costPerConversion > 0 ? `₪${Math.round(c.costPerConversion)}` : '-',
            }))}
          />
        ) : (
          <EmptyState
            icon="📢"
            title="Meta Ads לא מחובר"
            description="הוסף META_ADS_ACCESS_TOKEN ו-META_AD_ACCOUNT_ID לקובץ .env"
          />
        )}
      </SectionCard>
    </div>
  );
}
