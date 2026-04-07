'use client';

import { useState } from 'react';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, DateRangePicker, EmptyState } from '@/components/admin/ui';

export default function BookingsClient({ bookings, calendly }: { bookings: any[]; calendly: any }) {
  const [dateRange, setDateRange] = useState('30d');

  const completed = bookings.filter((b) => b.status === 'completed');
  const noShow = bookings.filter((b) => b.status === 'no_show');
  const upcoming = bookings.filter((b) => b.status === 'scheduled' && new Date(b.scheduled_at) > new Date());
  const showRate = bookings.length > 0
    ? Math.round(((completed.length) / (completed.length + noShow.length)) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title="פגישות"
        titleEn="Bookings & Scheduling"
        subtitle="פגישות אסטרטגיה, שיעור הגעה והמרה מפגישה"
        actions={<DateRangePicker value={dateRange} onChange={setDateRange} />}
      />

      {!calendly.configured && (
        <div style={{
          padding: '12px 16px',
          background: '#fefce8',
          border: '1px solid #fef08a',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#ca8a04',
        }}>
          ⚠️ Calendly API לא מחובר - הוסף CALENDLY_API_TOKEN לקובץ .env
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

      {/* Upcoming */}
      <SectionCard title="פגישות קרובות" titleEn="Upcoming">
        {upcoming.length === 0 ? (
          <EmptyState icon="📅" title="אין פגישות קרובות" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcoming.slice(0, 10).map((b) => {
              const date = new Date(b.scheduled_at);
              return (
                <div key={b.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fffbf0',
                  borderRadius: '8px',
                  border: '1px solid #f3d89a',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: '#fef9f0', display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid #f3d89a',
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#c9a84c', fontFamily: 'system-ui' }}>
                        {date.getDate()}
                      </div>
                      <div style={{ fontSize: '9px', color: '#d4b06b' }}>
                        {date.toLocaleDateString('he-IL', { month: 'short' })}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                        {b.type === 'strategy' ? 'פגישת אסטרטגיה' : b.type === 'premium' ? 'יום צילום פרמיום' : 'ייעוץ'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
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

      {/* All bookings table */}
      <SectionCard title="כל הפגישות" titleEn="All Bookings" noPadding>
        <DataTable
          columns={[
            { key: 'date', label: 'תאריך', width: '15%' },
            { key: 'time', label: 'שעה', align: 'center' },
            { key: 'type', label: 'סוג', align: 'center' },
            { key: 'status', label: 'סטטוס', align: 'center' },
            { key: 'notes', label: 'הערות', width: '30%' },
          ]}
          rows={bookings.map((b) => {
            const date = new Date(b.scheduled_at);
            const statusMap: Record<string, { label: string; variant: any }> = {
              scheduled: { label: 'מתוכנן', variant: 'gold' },
              completed: { label: 'התקיים', variant: 'success' },
              cancelled: { label: 'בוטל', variant: 'danger' },
              no_show: { label: 'לא הגיע', variant: 'danger' },
            };
            const s = statusMap[b.status] || { label: b.status, variant: 'default' };
            return {
              date: date.toLocaleDateString('he-IL'),
              time: date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
              type: b.type === 'strategy' ? 'אסטרטגיה' : b.type === 'premium' ? 'פרמיום' : 'ייעוץ',
              status: <Badge variant={s.variant}>{s.label}</Badge>,
              notes: <span style={{ fontSize: '12px', color: '#9ca3af' }}>{b.notes || '-'}</span>,
            };
          })}
        />
      </SectionCard>

      {/* Calendly sync info */}
      {calendly.configured && calendly.data && (
        <SectionCard title="סנכרון Calendly" titleEn="Calendly Sync">
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {calendly.data.length} אירועים מסונכרנים מ-Calendly (30 ימים אחרונים)
          </div>
        </SectionCard>
      )}
    </div>
  );
}
