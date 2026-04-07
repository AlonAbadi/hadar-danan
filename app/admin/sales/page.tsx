import { createServerClient } from '@/lib/supabase/server';
import { RevenueBarChart } from './RevenueBarChart';

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197:   'אתגר 7 ימים',
  workshop_1080:   'סדנה יום אחד',
  course_1800:     'קורס דיגיטלי',
  strategy_4000:   'פגישת אסטרטגיה',
  premium_14000:   'יום צילום פרמיום',
  test_1:          'מוצר בדיקה',
};

function monthRange(monthsAgo: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function getSalesData() {
  const supabase = createServerClient();

  const thisPeriod = monthRange(0);
  const lastPeriod = monthRange(1);

  const [thisMonthRes, lastMonthRes, recentRes] = await Promise.all([
    supabase
      .from('purchases')
      .select('amount, product')
      .eq('status', 'completed')
      .gte('created_at', thisPeriod.start)
      .lt('created_at', thisPeriod.end),
    supabase
      .from('purchases')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', lastPeriod.start)
      .lt('created_at', lastPeriod.end),
    supabase
      .from('purchases')
      .select('id, amount, product, created_at, user_id')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const thisMonthRows = thisMonthRes.data ?? [];
  const lastMonthRows = lastMonthRes.data ?? [];
  const recentRows    = recentRes.data ?? [];

  // KPIs
  const revenueThisMonth = thisMonthRows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const revenueLastMonth = lastMonthRows.reduce((s, r) => s + (r.amount ?? 0), 0);
  const growth = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : null;

  // Revenue by product (this month)
  const byProduct: Record<string, number> = {};
  for (const row of thisMonthRows) {
    const key = row.product ?? 'other';
    byProduct[key] = (byProduct[key] ?? 0) + (row.amount ?? 0);
  }
  const chartData = Object.entries(byProduct).map(([product, revenue]) => ({
    name: PRODUCT_LABELS[product] ?? product,
    revenue,
  }));

  // User names for recent purchases
  const userIds = [...new Set(recentRows.map((r) => r.user_id).filter(Boolean))] as string[];
  const usersRes = userIds.length
    ? await supabase.from('users').select('id, name, email').in('id', userIds)
    : { data: [] };
  const userMap: Record<string, string> = {};
  for (const u of usersRes.data ?? []) {
    userMap[u.id] = u.name ?? u.email ?? u.id;
  }

  const recentPurchases = recentRows.map((r) => ({
    id:      r.id,
    name:    userMap[r.user_id] ?? '-',
    product: PRODUCT_LABELS[r.product] ?? r.product,
    amount:  r.amount,
    date:    r.created_at,
  }));

  return { revenueThisMonth, revenueLastMonth, growth, chartData, recentPurchases };
}

function fmt(n: number) {
  return n.toLocaleString('he-IL');
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default async function SalesDashboardPage() {
  const { revenueThisMonth, revenueLastMonth, growth, chartData, recentPurchases } =
    await getSalesData();

  const kpis = [
    { label: 'הכנסה החודש',     value: `${fmt(revenueThisMonth)} \u20AA` },
    { label: 'הכנסה חודש קודם', value: `${fmt(revenueLastMonth)} \u20AA` },
    {
      label: 'צמיחה חודשית',
      value: growth === null ? '-' : `${growth > 0 ? '+' : ''}${growth}%`,
      positive: growth !== null && growth >= 0,
    },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C14; }

        .sales-root {
          direction: rtl;
          font-family: 'Assistant', sans-serif;
          background: #080C14;
          min-height: 100vh;
          padding: 40px 48px;
          color: #EDE9E1;
        }

        .sales-title {
          font-size: 20px;
          font-weight: 700;
          color: #EDE9E1;
          margin-bottom: 32px;
        }

        /* KPI cards */
        .kpi-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 36px;
        }
        .kpi-card {
          background: #141820;
          border: 1px solid #2C323E;
          border-radius: 12px;
          padding: 20px 24px;
        }
        .kpi-value {
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #E8B94A, #9E7C3A);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .kpi-label {
          font-size: 12px;
          color: #9E9990;
        }

        /* Chart section */
        .section-card {
          background: #141820;
          border: 1px solid #2C323E;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #EDE9E1;
          margin-bottom: 20px;
        }

        /* Table */
        .purchases-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .purchases-table th {
          text-align: right;
          padding: 10px 14px;
          color: #9E9990;
          font-weight: 600;
          font-size: 12px;
          border-bottom: 1px solid #2C323E;
        }
        .purchases-table td {
          padding: 12px 14px;
          color: #EDE9E1;
          border-bottom: 1px solid rgba(44,50,62,0.5);
        }
        .purchases-table tr:last-child td {
          border-bottom: none;
        }
        .td-amount {
          font-weight: 700;
          color: #C9964A;
        }
        .td-muted {
          color: #9E9990;
        }

        @media (max-width: 900px) {
          .kpi-row { grid-template-columns: 1fr 1fr; }
          .sales-root { padding: 24px 20px; }
        }
        @media (max-width: 600px) {
          .kpi-row { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sales-root">
        <div className="sales-title">דשבורד מכירות</div>

        {/* KPIs */}
        <div className="kpi-row">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="section-card">
          <div className="section-title">הכנסה לפי מוצר - החודש</div>
          {chartData.length > 0 ? (
            <RevenueBarChart data={chartData} />
          ) : (
            <p style={{ color: '#9E9990', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              אין נתונים לחודש זה
            </p>
          )}
        </div>

        {/* Recent purchases table */}
        <div className="section-card">
          <div className="section-title">10 רכישות אחרונות</div>
          {recentPurchases.length > 0 ? (
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>מוצר</th>
                  <th>סכום</th>
                  <th>תאריך</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="td-muted">{p.product}</td>
                    <td className="td-amount">{fmt(p.amount)} &#x20AA;</td>
                    <td className="td-muted">{fmtDate(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#9E9990', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
              אין רכישות עדיין
            </p>
          )}
        </div>
      </div>
    </>
  );
}
