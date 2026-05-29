'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, DateRangePicker } from '@/components/admin/ui';
import type { EventRow } from './page';

type Props = {
  data: {
    purchaseEvent:    EventRow;
    productEventRows: EventRow[];
    engagementRows:   EventRow[];
    totalPurchases:   number;
    totalRevenue:     number;
    totalLeads:       number;
    lastEventTime:    string | null;
  };
  dateRange: string;
};

function fmt(n: number) {
  return n.toLocaleString('he-IL');
}

function relTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דק׳`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days < 7) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function ConversionsClient({ data, dateRange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [pendingValue, setPendingValue] = useState<string | null>(null);

  useEffect(() => {
    if (pendingValue && dateRange === pendingValue) setPendingValue(null);
  }, [dateRange, pendingValue]);

  const updateRange = (newRange: string) => {
    if (newRange === dateRange) return;
    setPendingValue(newRange);
    const params = new URLSearchParams();
    if (newRange !== '30d') params.set('range', newRange);
    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ''}`);
    });
  };

  const purchaseRow = (r: EventRow) => ({
    eventName: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#E8B94A', fontWeight: 600 }}>{r.eventName}</span>,
    source:    <span style={{ color: '#9E9990', fontSize: 12 }}>{r.source}</span>,
    count:     <span style={{ fontWeight: 700 }}>{fmt(r.count)}</span>,
    totalValue: r.totalValue !== undefined ? <span style={{ color: '#C9964A', fontWeight: 600 }}>₪{fmt(r.totalValue)}</span> : '—',
    avgValue:   r.avgValue !== undefined && r.avgValue > 0 ? <span style={{ color: '#9E9990' }}>₪{fmt(r.avgValue)}</span> : '—',
    lastFired:  <span style={{ color: '#9E9990', fontSize: 12 }}>{relTime(r.lastFired)}</span>,
  });

  const engagementRow = (r: EventRow) => ({
    eventName: <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#4285F4', fontWeight: 600 }}>{r.eventName}</span>,
    source:    <span style={{ color: '#9E9990', fontSize: 12 }}>{r.source}</span>,
    count:     <span style={{ fontWeight: 700 }}>{fmt(r.count)}</span>,
    lastFired: <span style={{ color: '#9E9990', fontSize: 12 }}>{relTime(r.lastFired)}</span>,
  });

  return (
    <div style={{ padding: '32px 48px', maxWidth: 1400, margin: '0 auto' }}>
      <PageHeader
        title="אירועי CAPI"
        titleEn="Meta Conversions API Events"
        subtitle="כל מה שהשרת שלך שולח למטא — מהנתונים האמיתיים ב-Supabase. ללא קריאה למטא."
        actions={<DateRangePicker value={dateRange} onChange={updateRange} pending={isPending} pendingValue={pendingValue} />}
      />

      <KpiGrid cols={4}>
        <KpiCard label="Purchases" value={fmt(data.totalPurchases)} icon="💰" variant="gold" />
        <KpiCard label="Revenue" value={`₪${fmt(data.totalRevenue)}`} icon="📊" variant="success" />
        <KpiCard label="Leads (כל הסוגים)" value={fmt(data.totalLeads)} icon="🎯" variant="info" />
        <KpiCard label="אירוע אחרון" value={relTime(data.lastEventTime)} icon="⏱️" />
      </KpiGrid>

      <SectionCard
        title="אירועי רכישה"
        titleEn="Purchase Events"
        actions={<Badge variant="gold">{data.productEventRows.length + 1} אירועים פעילים</Badge>}
      >
        <p style={{ fontSize: 12, color: '#9E9990', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
          <strong style={{ color: '#EDE9E1' }}>Purchase</strong> נשלח לכל רכישה מוצלחת.
          {' '}בנוסף, כל מוצר שולח <strong style={{ color: '#EDE9E1' }}>אירוע מותאם</strong> משלו
          (PurchaseChallenge / PurchaseWorkshop / ...) — מאפשר לאופטם קמפיין ספציפי למוצר ב-Ads Manager.
        </p>
        <DataTable
          columns={[
            { key: 'eventName',  label: 'Meta Event' },
            { key: 'source',     label: 'מקור' },
            { key: 'count',      label: 'ספירה', align: 'right' },
            { key: 'totalValue', label: 'סה״כ ערך', align: 'right' },
            { key: 'avgValue',   label: 'ערך ממוצע', align: 'right' },
            { key: 'lastFired',  label: 'אירוע אחרון', align: 'right' },
          ]}
          rows={[purchaseRow(data.purchaseEvent), ...data.productEventRows.map(purchaseRow)]}
          emptyMessage="אין רכישות בטווח"
        />
      </SectionCard>

      <SectionCard
        title="אירועי לידים ומעורבות"
        titleEn="Lead & Engagement Events"
        actions={<Badge variant="info">{data.engagementRows.length} אירועים פעילים</Badge>}
      >
        <p style={{ fontSize: 12, color: '#9E9990', marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
          אירועים שמוזרמים למטא בכל פעולה משמעותית של המשתמש — לפני שמגיעה רכישה.
          {' '}משמשים לאופטימיזציה של קמפיינים בשלב TOFU/MOFU וליצירת Lookalike Audiences איכותיים.
        </p>
        <DataTable
          columns={[
            { key: 'eventName', label: 'Meta Event' },
            { key: 'source',    label: 'מקור' },
            { key: 'count',     label: 'ספירה', align: 'right' },
            { key: 'lastFired', label: 'אירוע אחרון', align: 'right' },
          ]}
          rows={data.engagementRows.map(engagementRow)}
          emptyMessage="אין אירועים בטווח"
        />
      </SectionCard>

      <div style={{ marginTop: 24, padding: '14px 18px', background: '#141820', border: '1px solid #2C323E', borderRadius: 10, fontSize: 12, color: '#9E9990', lineHeight: 1.7 }}>
        <strong style={{ color: '#E8B94A' }}>איך להשתמש בנתונים האלה ב-Meta Ads Manager:</strong><br />
        בעת יצירת קמפיין → Conversion Event → בחר את האירוע הספציפי שמתאים למטרה (למשל
        {' '}<code style={{ fontFamily: 'monospace', color: '#E8B94A' }}>PurchaseChallenge</code> לקמפיין שמכוון לרוכשי אתגר).
        {' '}האלגוריתם של מטא יאמן את עצמו לחפש לקוחות שדומים למי שכבר ביצע את האירוע אצלנו.
      </div>
    </div>
  );
}
