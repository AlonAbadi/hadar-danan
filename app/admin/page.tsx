import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

async function getHubKPIs() {
  const supabase = createServerClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [purchasesResult, leadsResult, pendingBookingsResult] = await Promise.all([
    supabase
      .from('purchases')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', monthStart),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const revenue = (purchasesResult.data ?? []).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );
  const leads = leadsResult.count ?? 0;
  const purchases = purchasesResult.data?.length ?? 0;
  const conversionRate = leads > 0 ? Math.round((purchases / leads) * 100) : 0;
  const pendingBookings = pendingBookingsResult.count ?? 0;

  return { revenue, leads, conversionRate, pendingBookings };
}

const NAV_CARDS = [
  { title: 'סקירה כללית',      desc: 'הכנסות, גרפים, conversion funnel',          href: '/admin/sales',       group: 'מכירות' },
  { title: 'פאנל מכירות',      desc: 'מסלול רכישה, שלבים, נטישות',               href: '/admin/funnel',      group: 'מכירות' },
  { title: 'מוצרים',           desc: 'ניהול מוצרים, מחירים, סטטוס',              href: '/admin/products',    group: 'מכירות' },
  { title: 'פגישות',           desc: 'ניהול פגישות אסטרטגיה',                    href: '/admin/bookings',    group: 'מכירות' },
  { title: 'קופונים ודילים',   desc: 'קודי הנחה, מותגים, תאריכי תפוגה',          href: '/admin/deals',       group: 'מכירות' },
  { title: 'ניהול לידים CRM',  desc: 'כל הלידים, סינון, חיפוש, פרופיל ליד',      href: '/admin/crm',         group: 'לידים' },
  { title: 'atelier — לידים',  desc: 'טפסי הצטרפות, ניתוח AI, אונבורדינג',       href: '/admin/atelier',     group: 'לידים' },
  { title: 'אימיילים',         desc: 'רצפי אימייל, open rate, שליחה ידנית',      href: '/admin/email',       group: 'שיווק' },
  { title: 'רכישת לקוחות',    desc: 'מקורות תנועה, CAC, ROAS',                   href: '/admin/acquisition', group: 'שיווק' },
  { title: 'A/B Testing',      desc: 'ניסויים פעילים, תוצאות',                   href: '/admin/abtesting',   group: 'שיווק' },
  { title: 'וידאו ואנליטיקס',  desc: 'מעקב צפיות, milestones',                   href: '/admin/video',       group: 'תוכן' },
  { title: 'כוורת',            desc: 'חברי קהילה, ניהול מנויים',                 href: '/admin/community',   group: 'קהילה' },
  { title: 'מודל MMM',         desc: 'הקצאת תקציב, רגרסיה, תחזיות',             href: '/admin/mmm',         group: 'אנליטיקה' },
  { title: 'לוגים',            desc: 'שגיאות, אירועים, מעקב מערכת',             href: '/admin/system',      group: 'מערכת' },
];

export default async function AdminHubPage() {
  const { revenue, leads, conversionRate, pendingBookings } = await getHubKPIs();

  const kpis = [
    { label: 'הכנסה החודש',    value: `${revenue.toLocaleString('he-IL')} \u20AA` },
    { label: 'לידים חדשים',    value: leads.toLocaleString('he-IL') },
    { label: 'שיעור המרה',     value: `${conversionRate}%` },
    { label: 'הזמנות ממתינות', value: pendingBookings.toLocaleString('he-IL') },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C14; }

        .hub-root {
          direction: rtl;
          font-family: 'Assistant', sans-serif;
          background: #080C14;
          min-height: 100vh;
          padding: 40px 48px;
        }

        .hub-header {
          font-size: 20px;
          font-weight: 700;
          color: #EDE9E1;
          margin-bottom: 32px;
          letter-spacing: -0.01em;
        }

        /* KPI bar */
        .hub-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .hub-kpi-card {
          background: #141820;
          border: 1px solid #2C323E;
          border-radius: 12px;
          padding: 20px 24px;
        }
        .hub-kpi-value {
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #E8B94A, #9E7C3A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .hub-kpi-label {
          font-size: 12px;
          color: #9E9990;
        }

        /* Nav cards */
        .hub-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .hub-card {
          display: block;
          text-decoration: none;
          background: #141820;
          border: 1px solid #2C323E;
          border-radius: 12px;
          padding: 20px;
          transition: border-color 0.18s;
        }
        .hub-card:hover {
          border-color: rgba(201, 150, 74, 0.4);
        }
        .hub-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #EDE9E1;
          margin-bottom: 6px;
        }
        .hub-card-desc {
          font-size: 13px;
          color: #9E9990;
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .hub-kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .hub-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .hub-root { padding: 24px 16px; }
          .hub-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hub-cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="hub-root">
        <div className="hub-header">ניהול - הדר דנן</div>

        <div className="hub-kpi-grid">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="hub-kpi-card">
              <div className="hub-kpi-value">{kpi.value}</div>
              <div className="hub-kpi-label">{kpi.label}</div>
            </div>
          ))}
        </div>

        {['מכירות', 'לידים', 'שיווק', 'תוכן', 'קהילה', 'אנליטיקה', 'מערכת'].map(group => {
          const cards = NAV_CARDS.filter(c => c.group === group);
          if (!cards.length) return null;
          return (
            <div key={group} style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E9990', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{group}</div>
              <div className="hub-cards-grid">
                {cards.map((card) => (
                  <Link key={card.href} href={card.href} className="hub-card">
                    <div className="hub-card-title">{card.title}</div>
                    <div className="hub-card-desc">{card.desc}</div>
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
