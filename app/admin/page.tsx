import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { QuizInsightsButton } from './QuizInsightsButton';
import { conversionScore, toWhatsappNumber, type ConversionTier } from '@/lib/signal/conversion-score';

// Gold list — /signal leads ranked by conversion-ease (lib/signal/conversion-score).
// Surfaces the highest-fit, most-ready leads for Hadar to reach out to personally.
interface GoldLead {
  id: string; name: string; occupation: string; phone: string;
  signal: string; score: number; tier: ConversionTier; reasons: string[]; wa: string | null;
}

async function getSignalGoldList(): Promise<GoldLead[]> {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: exts } = await (supabase as any)
    .from('signal_extractions')
    .select('user_id, signal, bucket, generated_at')
    .order('generated_at', { ascending: false })
    .limit(400);
  if (!exts?.length) return [];

  const userIds = [...new Set(exts.map((e: { user_id: string }) => e.user_id).filter(Boolean))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase as any)
    .from('users').select('id, name, phone, occupation, status').in('id', userIds);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uMap: Record<string, any> = {};
  for (const u of users ?? []) uMap[u.id] = u;

  const byUser: Record<string, GoldLead> = {};
  for (const e of exts) {
    const u = uMap[e.user_id];
    if (!u) continue;
    if (u.status === 'buyer' || u.status === 'not_relevant') continue; // converted / junk
    const sc = conversionScore({ routingSignal: e.signal?.routing_signal, bucket: e.bucket, status: u.status });
    const prev = byUser[e.user_id];
    if (!prev || sc.score > prev.score) {
      byUser[e.user_id] = {
        id: u.id, name: u.name ?? '—', occupation: u.occupation ?? '', phone: u.phone ?? '',
        signal: typeof e.signal?.signal === 'string' ? e.signal.signal : '',
        score: sc.score, tier: sc.tier, reasons: sc.reasons, wa: toWhatsappNumber(u.phone),
      };
    }
  }
  return Object.values(byUser).sort((a, b) => b.score - a.score).slice(0, 12);
}

const HADAR_OUTREACH = (name: string) =>
  `היי ${name ? name + ', ' : ''}כאן הדר דנן. ראיתי את האות שחילצת אצלנו במנוע והתחברתי אליו מאוד. אשמח לחשוב איתך על הצעד הבא.`;

async function getHubKPIs() {
  const supabase = createServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    purchasesThisMonth, purchasesLastMonth, leadsMonth, todayLeads, hiveActive,
    pendingBookings, recentBuyers, boilingLeadsRes,
  ] = await Promise.all([
    supabase.from('purchases').select('amount').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('purchases').select('amount').eq('status', 'completed').gte('created_at', prevMonthStart).lt('created_at', monthStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('hive_status', 'active'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('purchases').select('user_id, amount, product, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('users')
      .select('id, name, email, phone, occupation, signal_temperature_at')
      .eq('signal_temperature', 'boiling')
      .order('signal_temperature_at', { ascending: false })
      .limit(10),
  ]);

  const revenue = (purchasesThisMonth.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  const prevRevenue = (purchasesLastMonth.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
  const revenueChange = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;
  const leads = leadsMonth.count ?? 0;
  const purchases = purchasesThisMonth.data?.length ?? 0;
  const conversionRate = leads > 0 ? Math.round((purchases / leads) * 100) : 0;

  const userIds = [...new Set((recentBuyers.data ?? []).map(p => p.user_id).filter(Boolean))];
  const usersRes = userIds.length ? await supabase.from('users').select('id, name, email').in('id', userIds) : { data: [] };
  const userMap: Record<string, string> = {};
  for (const u of usersRes.data ?? []) userMap[u.id] = u.name ?? u.email ?? u.id;

  const PRODUCT_LABELS: Record<string, string> = {
    challenge_197: 'אתגר', workshop_1080: 'סדנה', course_1800: 'קורס',
    strategy_4000: 'אסטרטגיה', premium_14000: 'פרמיום', hive_starter_160: 'כוורת',
  };

  type BoilingRow = {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    occupation: string | null;
    signal_temperature_at: string | null;
  };
  const boilingLeads = ((boilingLeadsRes.data as BoilingRow[] | null) ?? []).map((u) => ({
    id:         u.id,
    name:       u.name ?? u.email ?? '—',
    phone:      u.phone ?? '',
    occupation: u.occupation ?? '',
    time:       u.signal_temperature_at ?? '',
  }));

  return {
    revenue, revenueChange, leads, todayLeads: todayLeads.count ?? 0,
    purchases, conversionRate,
    hiveActive: hiveActive.count ?? 0,
    pendingBookings: pendingBookings.count ?? 0,
    recentBuyers: (recentBuyers.data ?? []).map(p => ({
      name: userMap[p.user_id] ?? '—',
      product: PRODUCT_LABELS[p.product as string] ?? p.product,
      amount: p.amount,
      time: p.created_at,
    })),
    boilingLeads,
  };
}

const NAV_CARDS = [
  { title: 'רשימת חיוגים',     desc: 'הלידים הכי חמים להיום + היסטוריה ותוצאות שיחה',  href: '/admin/call-list',   group: 'ראשי',     icon: '📞' },
  { title: 'אסטרטג שיווק AI',  desc: 'ניתוח חי + המלצות אסטרטגיות (Claude Opus 4.7)', href: '/admin/strategist',  group: 'ראשי',     icon: '🧠' },
  { title: 'מנוע התנועה',      desc: 'תיאור לקוח → תדריך בימוי לסרטון (לא תסריט)',  href: '/admin/movement',    group: 'תוכן',     icon: '🎯' },
  { title: 'ניתוח קמפיינים — Meta', desc: 'ROAS אמיתי, CPL, CPA, השוואת Meta vs CRM', href: '/admin/meta',        group: 'ראשי',     icon: '📊' },
  { title: 'לקוחות',          desc: 'היסטוריה, רכישות, צפיות, מיילים',        href: '/admin/clients',     group: 'ראשי',     icon: '⭐' },
  { title: 'ניהול לידים CRM', desc: 'כל הלידים, סינון, חיפוש, פרופיל ליד',   href: '/admin/crm',         group: 'ראשי',     icon: '👥' },
  { title: 'רכישת לקוחות',   desc: 'מקורות תנועה, CAC, ROAS',                href: '/admin/acquisition', group: 'ראשי',     icon: '🎯' },
  { title: 'אירועי CAPI',     desc: 'מה נשלח למטא: Purchase, Lead, Schedule', href: '/admin/conversions', group: 'ראשי',     icon: '📡' },
  { title: 'סקירה כללית',     desc: 'הכנסות, גרפים, conversion funnel',        href: '/admin/sales',       group: 'מכירות',   icon: '📊' },
  { title: 'פאנל מכירות',     desc: 'מסלול רכישה, שלבים, נטישות',             href: '/admin/funnel',      group: 'מכירות',   icon: '🌊' },
  { title: 'מוצרים',          desc: 'ניהול מוצרים, מחירים, רכישות',           href: '/admin/products',    group: 'מכירות',   icon: '📦' },
  { title: 'פגישות',          desc: 'ניהול פגישות אסטרטגיה',                  href: '/admin/bookings',    group: 'מכירות',   icon: '📅' },
  { title: 'קופונים ודילים',  desc: 'קודי הנחה, מותגים, תאריכי תפוגה',        href: '/admin/deals',       group: 'מכירות',   icon: '🎟️' },
  { title: '3 ימים פתוחים',   desc: 'מועמדויות /apply, ציון מחויבות',          href: '/admin/stage',       group: 'ראשי',     icon: '🎯' },
  { title: 'atelier — לידים', desc: 'טפסי הצטרפות, ניתוח AI, אונבורדינג',     href: '/admin/atelier',     group: 'לידים',    icon: '🎨' },
  { title: 'אימיילים',        desc: 'רצפי אימייל, open rate, שליחה ידנית',   href: '/admin/email',       group: 'שיווק',    icon: '📧' },
  { title: 'A/B Testing',     desc: 'ניסויים פעילים, תוצאות',                 href: '/admin/abtesting',   group: 'שיווק',    icon: '🧪' },
  { title: 'שיעור במתנה',     desc: 'נרשמים, צפייה, השלמה, המרה למוצרים',   href: '/admin/training',    group: 'תוכן',     icon: '🎓' },
  { title: 'וידאו ואנליטיקס', desc: 'מעקב צפיות, milestones, נשירה',          href: '/admin/video',       group: 'תוכן',     icon: '🎬' },
  { title: 'זום אתגר — 23.6', desc: 'משתתפי הזום הקרוב, טלפונים, התקדמות',  href: '/admin/upcoming/challenge-zoom', group: 'תוכן', icon: '🎥' },
  { title: 'סדנה — 30.7',     desc: 'נרשמי הסדנה הקרובה, טלפונים ופרטים',    href: '/admin/upcoming/workshop',       group: 'תוכן', icon: '🎤' },
  { title: 'הכוורת',          desc: 'חברי קהילה, MRR, שימור מנויים',          href: '/admin/community',   group: 'קהילה',    icon: '🐝' },
  { title: 'מנוע האות',       desc: 'אבחוני TrueSignal© של לידים — האות שלהם',  href: '/admin/signal',      group: 'קהילה',    icon: '✨' },
  { title: 'מודל MMM',        desc: 'הקצאת תקציב, רגרסיה, תחזיות',           href: '/admin/mmm',         group: 'אנליטיקה', icon: '🔬' },
  { title: 'לוגים ומערכת',    desc: 'שגיאות, אירועים, מעקב מערכת',           href: '/admin/system',      group: 'מערכת',    icon: '⚙️' },
];

const GROUPS = ['ראשי', 'מכירות', 'לידים', 'שיווק', 'תוכן', 'קהילה', 'אנליטיקה', 'מערכת'];

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 2) return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דק׳`;
  if (hours < 24) return `לפני ${hours} ש׳`;
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
}

export default async function AdminHubPage() {
  const [kd, goldList] = await Promise.all([getHubKPIs(), getSignalGoldList()]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hub { direction: rtl; font-family: 'Assistant', sans-serif; padding: 36px 48px 60px; background: #080C14; min-height: 100vh; color: #EDE9E1; }
        .hub-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 8px; }
        .hub-title { font-size: 22px; font-weight: 800; color: #EDE9E1; }
        .hub-sub { font-size: 13px; color: #AAB0BD; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        .kpi { background: #141820; border: 1px solid #2C323E; border-radius: 12px; padding: 18px 22px; }
        .kpi-val { font-size: 26px; font-weight: 900; background: linear-gradient(135deg, #E8B94A, #C9964A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; margin-bottom: 5px; }
        .kpi-val.green { background: linear-gradient(135deg, #34A853, #1e7a38); }
        .kpi-val.blue  { background: linear-gradient(135deg, #4285F4, #2563eb); }
        .kpi-label { font-size: 12px; color: #AAB0BD; }
        .kpi-change { font-size: 11px; margin-top: 4px; }
        .top-row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; margin-bottom: 36px; align-items: start; }
        .quick-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .quick-card { display: flex; flex-direction: column; text-decoration: none; background: linear-gradient(145deg,#1a2030,#141820); border: 1px solid rgba(201,150,74,0.2); border-radius: 12px; padding: 18px 20px; transition: border-color 0.18s, background 0.18s; }
        .quick-card:hover { border-color: rgba(201,150,74,0.55); background: #1d2535; }
        .quick-card-icon { font-size: 22px; margin-bottom: 10px; }
        .quick-card-title { font-size: 15px; font-weight: 800; color: #EDE9E1; margin-bottom: 4px; }
        .quick-card-desc { font-size: 12px; color: #AAB0BD; line-height: 1.5; }
        .buyers-box { background: #141820; border: 1px solid #2C323E; border-radius: 12px; overflow: hidden; }
        .buyers-head { padding: 12px 18px; border-bottom: 1px solid #2C323E; font-size: 13px; font-weight: 700; color: #EDE9E1; }
        .buyer-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 18px; border-bottom: 1px solid rgba(44,50,62,0.5); gap: 10px; }
        .buyer-row:last-child { border-bottom: none; }
        .divider { height: 1px; background: #2C323E; margin-bottom: 32px; }
        .group-label { font-size: 10px; font-weight: 800; color: #6B7280; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; margin-top: 28px; }
        .group-label:first-child { margin-top: 0; }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { display: block; text-decoration: none; background: #141820; border: 1px solid #2C323E; border-radius: 12px; padding: 18px 20px; transition: border-color 0.18s, background 0.18s; }
        .card:hover { border-color: rgba(201,150,74,0.35); background: #171d28; }
        .card-icon { font-size: 18px; margin-bottom: 8px; }
        .card-title { font-size: 14px; font-weight: 700; color: #EDE9E1; margin-bottom: 5px; }
        .card-desc { font-size: 12px; color: #AAB0BD; line-height: 1.5; }
        @media (max-width: 1100px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .top-row { grid-template-columns: 1fr; }
          .quick-cards { grid-template-columns: repeat(2, 1fr); }
          .cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .hub { padding: 20px 16px 40px; }
          .quick-cards { grid-template-columns: 1fr; }
          .cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hub">
        <div className="hub-header">
          <div className="hub-title">ניהול — הדר דנן</div>
          <div className="hub-sub">{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>

        {/* ── GOLD LIST — /signal leads ranked by conversion-ease ───────────── */}
        {goldList.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(232,185,74,0.12) 0%, rgba(201,150,74,0.04) 100%)',
            border: '1px solid rgba(232,185,74,0.4)',
            borderRadius: 16,
            padding: '18px 20px 16px',
            marginBottom: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#E8B94A' }}>רשימת זהב · לידים שווי-המרה</div>
              <div style={{ fontSize: 11.5, color: '#AAB0BD' }}>פנייה אישית של הדר · מדורג לפי קלות-המרה (fit, בשלות, כוונה)</div>
            </div>
            <div style={{ fontSize: 11, color: '#7d7468', marginBottom: 14, fontStyle: 'italic' }}>
              חיזוי התאמה, לא המרה מוכחת. עבדי מלמעלה למטה.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {goldList.map((lead, i) => {
                const tierColor = lead.tier === 'hot' ? '#E8B94A' : lead.tier === 'warm' ? '#C9964A' : '#7d7468';
                const firstName = lead.name.split(' ')[0];
                const waHref = lead.wa
                  ? `https://wa.me/${lead.wa}?text=${encodeURIComponent(HADAR_OUTREACH(firstName))}`
                  : null;
                return (
                  <div key={lead.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: '#141820', border: '1px solid #2C323E', borderRadius: 10, padding: '11px 14px',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#6B7280', width: 18, flexShrink: 0, textAlign: 'center' }}>{i + 1}</div>
                    <div style={{
                      flexShrink: 0, minWidth: 44, textAlign: 'center', padding: '4px 8px', borderRadius: 8,
                      background: `${tierColor}1f`, border: `1px solid ${tierColor}66`, color: tierColor, fontWeight: 800, fontSize: 14,
                    }}>{lead.score}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <Link href={`/admin/users/${lead.id}`} style={{ fontSize: 14.5, fontWeight: 700, color: '#EDE9E1', textDecoration: 'none' }}>{lead.name}</Link>
                        {lead.occupation && <span style={{ fontSize: 12, color: '#C9964A' }}>· {lead.occupation}</span>}
                      </div>
                      {lead.signal && (
                        <div style={{ fontSize: 12.5, color: '#AAB0BD', lineHeight: 1.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.signal}</div>
                      )}
                      {lead.reasons.length > 0 && (
                        <div style={{ fontSize: 10.5, color: '#7d7468', marginTop: 3 }}>{lead.reasons.join(' · ')}</div>
                      )}
                    </div>
                    {waHref ? (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" style={{
                        flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'linear-gradient(135deg, #E8B94A, #C9964A)', color: '#1a140a',
                        fontWeight: 800, fontSize: 12.5, padding: '8px 14px', borderRadius: 9, textDecoration: 'none',
                      }}>WhatsApp ←</a>
                    ) : (
                      <span style={{ flexShrink: 0, fontSize: 11, color: '#6B7280' }}>אין טלפון</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="kpi" style={{ borderTop: '3px solid #C9964A' }}>
            <div className="kpi-val">₪{kd.revenue.toLocaleString('he-IL')}</div>
            <div className="kpi-label">הכנסה החודש</div>
            {kd.revenueChange !== null && (
              <div className="kpi-change" style={{ color: kd.revenueChange >= 0 ? '#34A853' : '#EA4335' }}>
                {kd.revenueChange >= 0 ? '▲' : '▼'} {Math.abs(kd.revenueChange)}% לעומת חודש קודם
              </div>
            )}
          </div>
          <div className="kpi" style={{ borderTop: '3px solid #4285F4' }}>
            <div className="kpi-val blue">{kd.leads.toLocaleString('he-IL')}</div>
            <div className="kpi-label">לידים חדשים החודש</div>
            <div className="kpi-change" style={{ color: '#AAB0BD' }}>היום: {kd.todayLeads}</div>
          </div>
          <div className="kpi" style={{ borderTop: '3px solid #34A853' }}>
            <div className="kpi-val green">{kd.conversionRate}%</div>
            <div className="kpi-label">שיעור המרה</div>
            <div className="kpi-change" style={{ color: '#AAB0BD' }}>{kd.purchases} רכישות מ-{kd.leads} לידים</div>
          </div>
          <div className="kpi" style={{ borderTop: '3px solid #9C27B0' }}>
            <div className="kpi-val" style={{ background: 'linear-gradient(135deg, #CE93D8, #9C27B0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{kd.hiveActive}</div>
            <div className="kpi-label">חברי כוורת פעילים</div>
            <div className="kpi-change" style={{ color: '#AAB0BD' }}>פגישות ממתינות: {kd.pendingBookings}</div>
          </div>
        </div>

        {/* Boiling leads from /signal — strategy bucket. These need to be
            called within hours, not days. */}
        {kd.boilingLeads.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124,10,2,0.18) 0%, rgba(124,10,2,0.06) 100%)',
            border: '1px solid rgba(255,80,80,0.35)',
            borderRadius: 14,
            padding: '14px 18px 16px',
            marginBottom: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FF6B6B', letterSpacing: '0.04em' }}>
                🔥 לידים רותחים — אות שיצא לפגישת אסטרטגיה
              </div>
              <div style={{ fontSize: 11, color: '#AAB0BD' }}>{kd.boilingLeads.length} ממתינים</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {kd.boilingLeads.map((b) => {
                const wa = b.phone ? `https://wa.me/${b.phone.replace(/\D/g, '').replace(/^0/, '972')}` : '';
                return (
                  <div key={b.id} style={{
                    background: '#141820',
                    border: '1px solid rgba(255,107,107,0.2)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#EDE9E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#AAB0BD', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {b.occupation || '—'} · {b.time ? relTime(b.time) : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Link href={`/admin/users/${b.id}`} style={{
                        background: '#C9964A', color: '#fff', fontSize: 11, fontWeight: 700,
                        padding: '6px 10px', borderRadius: 6, textDecoration: 'none',
                      }}>CRM</Link>
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" style={{
                          background: '#25D366', color: '#fff', fontSize: 11, fontWeight: 700,
                          padding: '6px 10px', borderRadius: 6, textDecoration: 'none',
                        }}>WA</a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top row: quick-access cards + recent buyers */}
        <div className="top-row">
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#E8B94A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>גישה מהירה</div>
            <div className="quick-cards">
              {NAV_CARDS.filter(c => c.group === 'ראשי').map(card => (
                <Link key={card.href} href={card.href} className="quick-card">
                  <div className="quick-card-icon">{card.icon}</div>
                  <div className="quick-card-title">{card.title}</div>
                  <div className="quick-card-desc">{card.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          {kd.recentBuyers.length > 0 && (
            <div className="buyers-box">
              <div className="buyers-head">⚡ רכישות אחרונות</div>
              {kd.recentBuyers.map((b, i) => (
                <div className="buyer-row" key={i}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#AAB0BD' }}>{b.product}</div>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#34A853' }}>₪{b.amount?.toLocaleString('he-IL')}</div>
                    <div style={{ fontSize: 10, color: '#AAB0BD' }}>{relTime(b.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="divider" />

        {/* Quiz insights AI analysis */}
        <QuizInsightsButton />

        {/* Nav cards by group — skip ראשי (shown above) */}
        {GROUPS.filter(g => g !== 'ראשי').map(group => {
          const cards = NAV_CARDS.filter(c => c.group === group);
          if (!cards.length) return null;
          return (
            <div key={group}>
              <div className="group-label">{group}</div>
              <div className="cards">
                {cards.map(card => (
                  <Link key={card.href} href={card.href} className="card">
                    <div className="card-icon">{card.icon}</div>
                    <div className="card-title">{card.title}</div>
                    <div className="card-desc">{card.desc}</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
