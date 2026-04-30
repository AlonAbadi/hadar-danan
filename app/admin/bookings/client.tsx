'use client';

import { useState } from 'react';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, DateRangePicker, EmptyState } from '@/components/admin/ui';

export default function BookingsClient({ bookings, calendly }: { bookings: any[]; calendly: any }) {
  const [dateRange, setDateRange] = useState('30d');

  const completed = bookings.filter((b) => b.status === 'completed');
  const noShow    = bookings.filter((b) => b.status === 'no_show');
  const upcoming  = bookings.filter((b) => b.status === 'scheduled' && new Date(b.scheduled_at) > new Date());
  const showRate  = (completed.length + noShow.length) > 0
    ? Math.round((completed.length / (completed.length + noShow.length)) * 100)
    : 0;

  return (
    <div style={{ padding: '32px 48px', color: '#EDE9E1' }}>
      <PageHeader
        title="פגישות"
        titleEn="Bookings & Scheduling"
        subtitle="פגישות אסטרטגיה, שיעור הגעה והמרה מפגישה"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      {!calendly.configured && (
        <div style={{
          padding: '12px 16px', marginBottom: 24,
          background: 'rgba(251,188,5,0.08)',
          border: '1px solid rgba(251,188,5,0.25)',
          borderRadius: 10, fontSize: 12, color: '#FBBC05',
        }}>
          ⚠️ Calendly API לא מחובר — הוסף CALENDLY_API_TOKEN לקובץ .env
        </div>
      )}

      <KpiGrid cols={4}>
        <KpiCard label="סה״כ פגישות" value={bookings.length} icon="📅" />
        <KpiCard label="קרובות" value={upcoming.length} icon="⏰" variant="gold" />
        <KpiCard
          label="שיעור הגעה"
          value={`${showRate}%`}
          icon="✅"
          variant={showRate >= 80 ? 'success' : showRate >= 60 ? 'gold' : 'danger'}
        />
        <KpiCard label="לא הגיעו" value={noShow.length} icon="❌" variant={noShow.length > 0 ? 'danger' : 'default'} />
      </KpiGrid>

      <SectionCard title="פגישות קרובות" titleEn="Upcoming">
        {upcoming.length === 0 ? (
          <EmptyState icon="📅" title="אין פגישות קרובות" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.slice(0, 10).map((b) => {
              const date = new Date(b.scheduled_at);
              return (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', background: 'rgba(201,150,74,0.07)',
                  borderRadius: 10, border: '1px solid rgba(201,150,74,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: 'rgba(201,150,74,0.12)',
                      border: '1px solid rgba(201,150,74,0.3)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#C9964A' }}>
                        {date.getDate()}
                      </div>
                      <div style={{ fontSize: 9, color: '#9E9990' }}>
                        {date.toLocaleDateString('he-IL', { month: 'short' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1' }}>
                        {b.type === 'strategy' ? 'פגישת אסטרטגיה' : b.type === 'premium' ? 'יום צילום פרמיום' : 'ייעוץ'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9E9990' }}>
                        {date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <Badge variant="gold">מתוכנן</Badge>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="כל הפגישות" titleEn="All Bookings" noPadding>
        <DataTable
          columns={[
            { key: 'date',   label: 'תאריך', width: '15%' },
            { key: 'time',   label: 'שעה',   align: 'center' },
            { key: 'type',   label: 'סוג',   align: 'center' },
            { key: 'status', label: 'סטטוס', align: 'center' },
            { key: 'notes',  label: 'הערות', width: '30%' },
          ]}
          rows={bookings.map((b) => {
            const date = new Date(b.scheduled_at);
            const statusMap: Record<string, { label: string; variant: any }> = {
              scheduled:  { label: 'מתוכנן', variant: 'gold' },
              completed:  { label: 'התקיים', variant: 'success' },
              cancelled:  { label: 'בוטל',   variant: 'danger' },
              no_show:    { label: 'לא הגיע', variant: 'danger' },
            };
            const s = statusMap[b.status] || { label: b.status, variant: 'default' };
            return {
              date:   date.toLocaleDateString('he-IL'),
              time:   date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
              type:   b.type === 'strategy' ? 'אסטרטגיה' : b.type === 'premium' ? 'פרמיום' : 'ייעוץ',
              status: <Badge variant={s.variant}>{s.label}</Badge>,
              notes:  <span style={{ fontSize: 12, color: '#9E9990' }}>{b.notes || '—'}</span>,
            };
          })}
        />
      </SectionCard>

      {calendly.configured && calendly.data && (
        <SectionCard title="סנכרון Calendly" titleEn="Calendly Sync">
          <div style={{ fontSize: 12, color: '#9E9990' }}>
            {calendly.data.length} אירועים מסונכרנים מ-Calendly (30 ימים אחרונים)
          </div>
        </SectionCard>
      )}
    </div>
  );
}
