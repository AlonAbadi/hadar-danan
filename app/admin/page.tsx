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
  {
    title: 'דשבורד מכירות',
    desc: 'הכנסות, גרפים, conversion funnel',
    href: '/admin/sales',
  },
  {
    title: 'ניהול לידים CRM',
    desc: 'כל הלידים, סינון, חיפוש, פרופיל ליד',
    href: '/admin/leads',
  },
  {
    title: 'אימיילים',
    desc: 'רצפי אימייל, open rate, שליחה ידנית',
    href: '/admin/emails',
  },
  {
    title: 'וידאו ואנליטיקס',
    desc: 'מעקב צפיות, milestones',
    href: '/admin/video',
  },
  {
    title: 'הזמנות',
    desc: 'ניהול פגישות אסטרטגיה',
    href: '/admin/bookings',
  },
  {
    title: 'כוורת',
    desc: 'חברי קהילה, ניהול מנויים',
    href: '/admin/hive',
  },
  {
    title: 'A/B Testing',
    desc: 'ניסויים פעילים, תוצאות',
    href: '/admin/ab',
  },
  {
    title: 'לוגים',
    desc: 'שגיאות, אירועים, מעקב מערכת',
    href: '/admin/logs',
  },
];

export default async function AdminHubPage() {
  const { revenue, leads, conversionRate, pendingBookings } = await getHubKPIs();

  const kpis = [
    {
      label: 'הכנסה החודש',
      value: `${revenue.toLocaleString('he-IL')} ₪`,
    },
    {
      label: 'לידים חדשים',
      value: leads.toLocaleString('he-IL'),
    },
    {
      label: 'שיעור המרה',
      value: `${conversionRate}%`,
    },
    {
      label: 'הזמנות ממתינות',
      value: pendingBookings.toLocaleString('he-IL'),
    },
  ];

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif", minHeight: '100vh', background: '#080C14', padding: '32px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#EDE9E1', margin: '0 0 28px' }}>
        סקירה כללית
      </h1>

      {/* KPI Bar */}
      <div className="hub-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 36,
      }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: '#141820',
              border: '1px solid #2C323E',
              borderRadius: 12,
              padding: '20px 24px',
            }}
          >
            <div style={{
              fontSize: 26,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #E8B94A, #9E7C3A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
              marginBottom: 6,
            }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 12, color: '#9E9990' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Navigation Cards */}
      <div className="hub-cards-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16,
      }}>
        {NAV_CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="hub-card">
            <div className="hub-card-title">{card.title}</div>
            <div className="hub-card-desc">{card.desc}</div>
          </Link>
        ))}
      </div>

      <style>{`
        .hub-card {
          display: block;
          text-decoration: none;
          background: #141820;
          border: 1px solid #2C323E;
          border-radius: 12px;
          padding: 20px 24px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hub-card:hover {
          border-color: rgba(201,150,74,0.4);
          box-shadow: 0 0 0 1px rgba(201,150,74,0.15), 0 4px 20px rgba(201,150,74,0.08);
        }
        .hub-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #EDE9E1;
          margin-bottom: 6px;
        }
        .hub-card-desc {
          font-size: 13px;
          color: #9E9990;
          line-height: 1.5;
        }
        @media (max-width: 900px) {
          .hub-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .hub-kpi-grid { grid-template-columns: 1fr !important; }
          .hub-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
