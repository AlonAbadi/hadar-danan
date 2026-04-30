import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

async function getHubKPIs() {
  const supabase = createServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [purchasesThisMonth, purchasesLastMonth, leadsMonth, todayLeads, hiveActive, pendingBookings, recentBuyers] = await Promise.all([
    supabase.from('purchases').select('amount').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('purchases').select('amount').eq('status', 'completed').gte('created_at', prevMonthStart).lt('created_at', monthStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('hive_status', 'active'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('purchases').select('user_id, amount, product, created_at').eq('status', 'completed').order('created_at', { ascending: false }).limit(5),
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
  };
}

const NAV_CARDS = [
  { title: 'סקירה כללית',     desc: 'הכנסות, גרפים, conversion funnel',        href: '/admin/sales',       group: 'מכירות',   icon: '📊' },
  { title: 'פאנל מכירות',     desc: 'מסלול רכישה, שלבים, נטישות',             href: '/admin/funnel',      group: 'מכירות',   icon: '🌊' },
  { title: 'מוצרים',          desc: 'ניהול מוצרים, מחירים, רכישות',           href: '/admin/products',    group: 'מכירות',   icon: '📦' },
  { title: 'פגישות',          desc: 'ניהול פגישות אסטרטגיה',                  href: '/admin/bookings',    group: 'מכירות',   icon: '📅' },
  { title: 'קופונים ודילים',  desc: 'קודי הנחה, מותגים, תאריכי תפוגה',        href: '/admin/deals',       group: 'מכירות',   icon: '🎟️' },
  { title: 'ניהול לידים CRM', desc: 'כל הלידים, סינון, חיפוש, פרופיל ליד',   href: '/admin/crm',         group: 'לידים',    icon: '👥' },
  { title: 'atelier — לידים', desc: 'טפסי הצטרפות, ניתוח AI, אונבורדינג',     href: '/admin/atelier',     group: 'לידים',    icon: '🎨' },
  { title: 'אימיילים',        desc: 'רצפי אימייל, open rate, שליחה ידנית',   href: '/admin/email',       group: 'שיווק',    icon: '📧' },
  { title: 'רכישת לקוחות',   desc: 'מקורות תנועה, CAC, ROAS',                href: '/admin/acquisition', group: 'שיווק',    icon: '🎯' },
  { title: 'A/B Testing',     desc: 'ניסויים פעילים, תוצאות',                 href: '/admin/abtesting',   group: 'שיווק',    icon: '🧪' },
  { title: 'שיעור במתנה',     desc: 'נרשמים, צפייה, השלמה, המרה למוצרים',   href: '/admin/training',    group: 'תוכן',     icon: '🎓' },
  { title: 'וידאו ואנליטיקס', desc: 'מעקב צפיות, milestones, נשירה',          href: '/admin/video',       group: 'תוכן',     icon: '🎬' },
  { title: 'הכוורת',          desc: 'חברי קהילה, MRR, שימור מנויים',          href: '/admin/community',   group: 'קהילה',    icon: '🐝' },
  { title: 'מודל MMM',        desc: 'הקצאת תקציב, רגרסיה, תחזיות',           href: '/admin/mmm',         group: 'אנליטיקה', icon: '🔬' },
  { title: 'לוגים ומערכת',    desc: 'שגיאות, אירועים, מעקב מערכת',           href: '/admin/system',      group: 'מערכת',    icon: '⚙️' },
];

const GROUPS = ['מכירות', 'לידים', 'שיווק', 'תוכן', 'קהילה', 'אנליטיקה', 'מערכת'];

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
  const kd = await getHubKPIs();

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .hub { direction: rtl; font-family: 'Assistant', sans-serif; padding: 40px 48px; }
        .hub-title { font-size: 22px; font-weight: 800; color: #EDE9E1; margin-bottom: 6px; }
        .hub-sub { font-size: 13px; color: #9E9990; margin-bottom: 32px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }
        .kpi { background: #141820; border: 1px solid #2C323E; border-radius: 12px; padding: 18px 22px; }
        .kpi-val { font-size: 26px; font-weight: 900; background: linear-gradient(135deg, #E8B94A, #C9964A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1.2; margin-bottom: 5px; }
        .kpi-val.green { background: linear-gradient(135deg, #34A853, #1e7a38); }
        .kpi-val.blue  { background: linear-gradient(135deg, #4285F4, #2563eb); }
        .kpi-label { font-size: 12px; color: #9E9990; }
        .kpi-change { font-size: 11px; margin-top: 4px; }
        .two-col { display: grid; grid-template-columns: 1fr 340px; gap: 20px; margin-bottom: 32px; }
        .section { background: #141820; border: 1px solid #2C323E; border-radius: 12px; overflow: hidden; }
        .section-head { padding: 14px 20px; border-bottom: 1px solid #2C323E; font-size: 14px; font-weight: 700; color: #EDE9E1; }
        .buyer-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 20px; border-bottom: 1px solid rgba(44,50,62,0.6); gap: 12px; }
        .buyer-row:last-child { border-bottom: none; }
        .group-label { font-size: 10px; font-weight: 800; color: #9E9990; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; margin-top: 28px; }
        .group-label:first-child { margin-top: 0; }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .card { display: block; text-decoration: none; background: #141820; border: 1px solid #2C323E; border-radius: 12px; padding: 18px 20px; transition: border-color 0.18s, background 0.18s; }
        .card:hover { border-color: rgba(201,150,74,0.45); background: #171d28; }
        .card-icon { font-size: 18px; margin-bottom: 8px; }
        .card-title { font-size: 14px; font-weight: 700; color: #EDE9E1; margin-bottom: 5px; }
        .card-desc { font-size: 12px; color: #9E9990; line-height: 1.5; }
        @media (max-width: 1100px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .two-col { grid-template-columns: 1fr; }
          .cards { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .hub { padding: 24px 16px; }
          .kpi-grid { gap: 10px; }
          .cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hub">
        <div className="hub-title">ניהול — הדר דנן</div>
        <div className="hub-sub">לוח בקרה מרכזי · {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</div>

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
            <div className="kpi-change" style={{ color: '#9E9990' }}>היום: {kd.todayLeads}</div>
          </div>
          <div className="kpi" style={{ borderTop: '3px solid #34A853' }}>
            <div className="kpi-val green">{kd.conversionRate}%</div>
            <div className="kpi-label">שיעור המרה</div>
            <div className="kpi-change" style={{ color: '#9E9990' }}>{kd.purchases} רכישות מ-{kd.leads} לידים</div>
          </div>
          <div className="kpi" style={{ borderTop: '3px solid #9C27B0' }}>
            <div className="kpi-val" style={{ background: 'linear-gradient(135deg, #CE93D8, #9C27B0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{kd.hiveActive}</div>
            <div className="kpi-label">חברי כוורת פעילים</div>
            <div className="kpi-change" style={{ color: '#9E9990' }}>פגישות ממתינות: {kd.pendingBookings}</div>
          </div>
        </div>

        {/* Recent buyers */}
        {kd.recentBuyers.length > 0 && (
          <div className="two-col">
            <div />
            <div className="section">
              <div className="section-head">⚡ רכישות אחרונות</div>
              {kd.recentBuyers.map((b, i) => (
                <div className="buyer-row" key={i}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>{b.product}</div>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#34A853' }}>₪{b.amount?.toLocaleString('he-IL')}</div>
                    <div style={{ fontSize: 10, color: '#9E9990' }}>{relTime(b.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav cards by group */}
        {GROUPS.map(group => {
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
