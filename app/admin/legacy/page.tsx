import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { PageHeader, KpiCard, KpiGrid, SectionCard, Badge, DataTable } from '@/components/admin/ui';

// Campaign dashboard for the legacy-list reactivation (LEGACY_LIST_ACTIVATION_PLAN.md).
// Sources: LEGACY_* rows in `events` (waves from the send script, bounce/complaint/
// click from the Resend webhook, ledger snapshots from --sync) + users created via
// utm_source=legacy with their extractions and purchases embedded.
export const revalidate = 300;

const GATE_BOUNCE = 0.08;
const GATE_COMPLAINT = 0.001;
const LIST_SIZE = 35023;

const BUCKET_LABELS: Record<string, string> = {
  challenge: 'אתגר', strategy: 'אסטרטגיה', hive: 'כוורת', nurture: 'טיפוח', none: 'ללא',
};

function relTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `לפני ${Math.max(mins, 1)} דק׳`;
  if (mins < 1440) return `לפני ${Math.floor(mins / 60)} שע׳`;
  return `לפני ${Math.floor(mins / 1440)} ימים`;
}

export default async function LegacyPage() {
  const supabase = createServerClient() as any;

  // Supabase caps every select at 1,000 rows regardless of .limit() — the
  // legacy event log crossed that on wave 6, silently freezing this page on
  // the oldest rows (same trap as the email-report audit). Paginate.
  const legacyEvents: { type: string; metadata: Record<string, unknown>; created_at: string }[] = [];
  for (let off = 0; ; off += 1000) {
    const { data } = await supabase
      .from('events')
      .select('type, metadata, created_at')
      .in('type', [
        'LEGACY_WAVE_SENT', 'LEGACY_SYNC_SNAPSHOT', 'LEGACY_EMAIL_BOUNCED',
        'LEGACY_EMAIL_COMPLAINED', 'LEGACY_EMAIL_CLICKED', 'LEGACY_UNSUBSCRIBED',
      ])
      .order('created_at', { ascending: true })
      .range(off, off + 999);
    legacyEvents.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  const { data: converted } = await supabase
    .from('users')
    .select('id, email, name, status, created_at, signal_extractions(bucket, created_at), purchases(product, amount, status)')
    .eq('utm_source', 'legacy')
    .order('created_at', { ascending: false });

  const evs = (legacyEvents ?? []) as { type: string; metadata: Record<string, unknown>; created_at: string }[];
  const waves = evs.filter((e) => e.type === 'LEGACY_WAVE_SENT')
    .map((e) => ({ n: Number(e.metadata.wave), size: Number(e.metadata.size), at: String(e.metadata.at ?? e.created_at) }));
  const snapshot = evs.filter((e) => e.type === 'LEGACY_SYNC_SNAPSHOT').at(-1)?.metadata as
    | { sent1: number; bounced: number; complained: number; clicked: number; unsubscribed: number } | undefined;

  const uniq = (t: string) => new Set(evs.filter((e) => e.type === t).map((e) => String(e.metadata.email))).size;
  const sent = Math.max(waves.reduce((s, w) => s + w.size, 0), snapshot?.sent1 ?? 0);
  // webhook (live) and ledger snapshot (authoritative) can lag each other — show the max
  const bounced = Math.max(uniq('LEGACY_EMAIL_BOUNCED'), snapshot?.bounced ?? 0);
  const complained = Math.max(uniq('LEGACY_EMAIL_COMPLAINED'), snapshot?.complained ?? 0);
  const clicked = Math.max(uniq('LEGACY_EMAIL_CLICKED'), snapshot?.clicked ?? 0);
  const unsubscribed = Math.max(uniq('LEGACY_UNSUBSCRIBED'), snapshot?.unsubscribed ?? 0);

  type Converted = {
    id: string; email: string; name: string | null; status: string; created_at: string;
    signal_extractions: { bucket: string | null; created_at: string }[];
    purchases: { product: string; amount: number; status: string }[];
  };
  const users = (converted ?? []) as Converted[];
  const diagnosed = users.filter((u) => u.signal_extractions.length > 0);
  const buckets: Record<string, number> = {};
  for (const u of diagnosed) {
    const b = u.signal_extractions[0]?.bucket ?? 'none';
    buckets[b] = (buckets[b] ?? 0) + 1;
  }
  const paid = users.flatMap((u) => u.purchases.filter((p) => p.status === 'completed'));
  const revenue = paid.reduce((s, p) => s + (p.amount ?? 0), 0);

  const bounceRate = sent ? bounced / sent : 0;
  const complaintRate = sent ? complained / sent : 0;
  const gatesOk = bounceRate <= GATE_BOUNCE && complaintRate <= GATE_COMPLAINT;

  return (
    <div style={{ padding: '28px 48px', maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="קמפיין הרשימה ההיסטורית"
        titleEn="Legacy Reactivation"
        subtitle={`${LIST_SIZE.toLocaleString()} אנשי קשר מהמערכת הקודמת. שליחה בגלים מ-news.beegood.online, מעקב מלא דרך utm_source=legacy.`}
        actions={
          sent > 0 ? (
            <Badge variant={gatesOk ? 'success' : 'danger'}>
              {gatesOk ? 'שערי איכות תקינים ✓' : 'שער איכות נחצה — השליחה עצורה'}
            </Badge>
          ) : undefined
        }
      />

      <KpiGrid cols={6}>
        <KpiCard label="נשלחו (מייל 1)" value={sent.toLocaleString()} icon="📤" variant="gold" />
        <KpiCard label="כיסוי הרשימה" value={`${((sent / LIST_SIZE) * 100).toFixed(1)}%`} icon="📊" />
        <KpiCard label="קליקים" value={`${clicked} (${sent ? ((clicked / sent) * 100).toFixed(1) : 0}%)`} icon="👆" variant="info" />
        <KpiCard label="נרשמו לאתר" value={users.length} icon="👤" variant="success" />
        <KpiCard label="השלימו אבחון אות" value={diagnosed.length} icon="✨" variant="gold" />
        <KpiCard label="הכנסות" value={`${revenue.toLocaleString()}₪`} icon="💰" variant={revenue > 0 ? 'success' : 'default'} />
      </KpiGrid>

      <KpiGrid cols={4}>
        <KpiCard label="החזרות (bounce)" value={`${bounced} · ${(bounceRate * 100).toFixed(1)}%`} icon="↩️"
          variant={bounceRate > GATE_BOUNCE ? 'danger' : 'default'} />
        <KpiCard label="תלונות ספאם" value={`${complained} · ${(complaintRate * 100).toFixed(2)}%`} icon="🚫"
          variant={complaintRate > GATE_COMPLAINT ? 'danger' : 'default'} />
        <KpiCard label="הסרות מהרשימה" value={unsubscribed} icon="👋" />
        <KpiCard label="שערי עצירה" value={`bounce ≤ ${GATE_BOUNCE * 100}% · תלונות ≤ ${GATE_COMPLAINT * 100}%`} icon="🚦"
          variant={gatesOk ? 'success' : 'danger'} />
      </KpiGrid>

      <SectionCard title="גלי שליחה" titleEn="Waves" noPadding>
        <DataTable
          columns={[
            { key: 'wave', label: 'גל' },
            { key: 'size', label: 'נשלחו' },
            { key: 'at', label: 'מתי' },
          ]}
          rows={waves.map((w) => ({
            wave: `גל ${w.n}`,
            size: w.size.toLocaleString(),
            at: `${new Date(w.at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })} (${relTime(w.at)})`,
          }))}
          emptyMessage="עוד לא נשלח גל"
        />
      </SectionCard>

      {diagnosed.length > 0 && (
        <SectionCard title="אבחונים לפי מסלול" titleEn="Buckets">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(buckets).sort((a, b) => b[1] - a[1]).map(([b, n]) => (
              <div key={b} style={{ background: '#1D2430', border: '1px solid #2C323E', borderRadius: 10, padding: '10px 18px' }}>
                <span style={{ color: '#E8B94A', fontWeight: 800, fontSize: 18 }}>{n}</span>
                <span style={{ color: '#AAB0BD', fontSize: 13, marginRight: 8 }}>{BUCKET_LABELS[b] ?? b}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="נרשמו מהקמפיין" titleEn="Converted contacts" noPadding>
        <DataTable
          columns={[
            { key: 'name', label: 'שם' },
            { key: 'email', label: 'אימייל' },
            { key: 'status', label: 'סטטוס' },
            { key: 'bucket', label: 'מסלול' },
            { key: 'purchases', label: 'רכישות' },
            { key: 'at', label: 'הצטרפו' },
          ]}
          rows={users.slice(0, 100).map((u) => ({
            name: <Link href={`/admin/users/${u.id}`} style={{ color: '#E8B94A', textDecoration: 'none' }}>{u.name || '-'}</Link>,
            email: <span style={{ direction: 'ltr', display: 'inline-block' }}>{u.email}</span>,
            status: <Badge variant={['buyer', 'booked'].includes(u.status) ? 'success' : 'default'}>{u.status}</Badge>,
            bucket: u.signal_extractions.length
              ? <Badge variant="gold">{BUCKET_LABELS[u.signal_extractions[0]?.bucket ?? 'none'] ?? '-'}</Badge>
              : <span style={{ color: '#5B6270' }}>עוד לא</span>,
            purchases: u.purchases.filter((p) => p.status === 'completed').map((p) => `${p.amount}₪`).join(', ') || '-',
            at: relTime(u.created_at),
          }))}
          emptyMessage="עוד אין נרשמים מהקמפיין — הם יופיעו כאן ברגע שיקליקו וישלימו הרשמה"
        />
      </SectionCard>

      <div style={{ color: '#5B6270', fontSize: 11, textAlign: 'center', paddingBottom: 24 }}>
        הנתונים מתעדכנים אחת ל-5 דקות. קליקים והחזרות מגיעים מה-webhook של Resend בזמן אמת,
        וסנכרון מלא רץ עם הסקריפט לפני כל גל.
      </div>
    </div>
  );
}
