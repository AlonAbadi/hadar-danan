'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PRODUCT_MAP } from '@/lib/admin/queries';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecentPurchase {
  id: string;
  user_id: string;
  name: string | null;
  email: string;
  product: string;
  productName: string;
  amount: number;
  created_at: string;
}

interface RevenueData {
  total: number;
  change: number;
  orderCount: number;
  byProduct: Record<string, { revenue: number; count: number; name: string }>;
  recentPurchases: RecentPurchase[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRODUCT_COLORS: Record<string, string> = {
  challenge: '#34A853', challenge_197: '#34A853',
  workshop: '#FBBC05', workshop_1080: '#FBBC05',
  course: '#C9964A', course_1800: '#C9964A',
  strategy: '#E8B94A', strategy_4000: '#E8B94A',
  premium: '#EA4335', premium_14000: '#EA4335',
  partnership: '#9C27B0',
  hive: '#4285F4', hive_starter_160: '#4285F4',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'עכשיו';
  if (mins < 60)  return `לפני ${mins} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return 'אתמול';
  if (days < 30)  return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL');
}

function absDate(iso: string): string {
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#141820', border: '1px solid #2C323E', borderRadius: 12, padding: 20,
};

// ── Date range picker ─────────────────────────────────────────────────────────

const RANGES = [
  { value: 'today', label: 'היום' },
  { value: '7d',   label: '7 ימים' },
  { value: '30d',  label: '30 ימים' },
  { value: '90d',  label: '90 ימים' },
  { value: 'all',  label: 'הכל' },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductsClient() {
  const [range, setRange]   = useState('30d');
  const [data, setData]     = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/revenue?dateRange=${range}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  const products = data
    ? Object.entries(data.byProduct)
        .map(([pid, d]) => ({
          id: pid,
          name: PRODUCT_MAP[pid]?.name ?? d.name,
          color: PRODUCT_COLORS[pid] ?? '#9E9990',
          revenue: d.revenue,
          count: d.count,
          pct: data.total > 0 ? Math.round((d.revenue / data.total) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue)
    : [];

  const maxRevenue = products[0]?.revenue ?? 1;

  const todayPurchases = (data?.recentPurchases ?? []).filter(p => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(p.created_at) >= today;
  });

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-assistant), Assistant, sans-serif', color: '#EDE9E1', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>מוצרים</div>
          <div style={{ fontSize: 13, color: '#9E9990', marginTop: 2 }}>הכנסות וביצועים לפי מוצר</div>
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', gap: 4, background: '#141820', border: '1px solid #2C323E', borderRadius: 10, padding: 4 }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: range === r.value ? '#C9964A' : 'transparent',
                color: range === r.value ? '#1A1206' : '#9E9990',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'סה״כ הכנסות',   value: loading ? '...' : `₪${(data?.total ?? 0).toLocaleString('he-IL')}`,    color: '#E8B94A', icon: '💰' },
          { label: 'סה״כ רכישות',   value: loading ? '...' : String(data?.orderCount ?? 0),                        color: '#4285F4', icon: '🛒' },
          { label: 'רכישות היום',   value: loading ? '...' : String(todayPurchases.length),                         color: '#34A853', icon: '⚡' },
        ].map(k => (
          <div key={k.label} style={{ ...card, borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 8 }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            {k.label === 'סה״כ הכנסות' && data && !loading && (
              <div style={{ fontSize: 11, marginTop: 6, color: data.change >= 0 ? '#34A853' : '#EA4335' }}>
                {data.change >= 0 ? '▲' : '▼'} {Math.abs(Math.round(data.change))}% לעומת התקופה הקודמת
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Purchases today ── */}
      {!loading && todayPurchases.length > 0 && (
        <div style={{ ...card, borderColor: 'rgba(52,168,83,0.3)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#34A853' }}>⚡</span> רכישות היום
            <span style={{ fontSize: 12, color: '#9E9990', fontWeight: 400 }}>({todayPurchases.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayPurchases.map(p => (
              <Link key={p.id} href={`/admin/users/${p.user_id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(52,168,83,0.05)', border: '1px solid rgba(52,168,83,0.15)',
                  transition: 'background 0.15s', gap: 12,
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,168,83,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,168,83,0.05)')}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#EDE9E1' }}>{p.name ?? p.email}</div>
                    <div style={{ fontSize: 12, color: '#9E9990', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: PRODUCT_COLORS[p.product] ?? '#C9964A' }}>{p.productName}</div>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>{relativeTime(p.created_at)}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#34A853', flexShrink: 0 }}>
                    ₪{p.amount.toLocaleString('he-IL')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── By product ── */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>ביצועים לפי מוצר</div>
        {loading && <div style={{ color: '#9E9990', fontSize: 13 }}>טוען...</div>}
        {!loading && products.length === 0 && (
          <div style={{ color: '#9E9990', fontSize: 13 }}>אין רכישות בתקופה זו</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {products.map(p => (
            <div key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#EDE9E1' }}>{p.name}</span>
                <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: '#9E9990' }}>{p.count} רכישות</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>₪{p.revenue.toLocaleString('he-IL')}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, minWidth: 36, textAlign: 'center',
                    background: p.color + '22', color: p.color, border: `1px solid ${p.color}44`,
                    borderRadius: 6, padding: '1px 7px',
                  }}>{p.pct}%</span>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: '#1D2430', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 9999, background: p.color,
                  width: `${Math.round((p.revenue / maxRevenue) * 100)}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent purchases list ── */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <span>רכישות אחרונות</span>
          {!loading && <span style={{ fontSize: 12, color: '#9E9990', fontWeight: 400 }}>{data?.recentPurchases.length ?? 0} רשומות</span>}
        </div>
        {loading && <div style={{ color: '#9E9990', fontSize: 13 }}>טוען...</div>}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(data?.recentPurchases ?? []).map((p, i) => (
            <Link key={p.id} href={`/admin/users/${p.user_id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 0', gap: 12,
                borderBottom: i < (data?.recentPurchases.length ?? 0) - 1 ? '1px solid #2C323E' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#EDE9E1' }}>{p.name ?? '—'}</div>
                  <div style={{ fontSize: 12, color: '#9E9990', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '2px 9px', borderRadius: 6,
                    background: (PRODUCT_COLORS[p.product] ?? '#9E9990') + '1A',
                    color: PRODUCT_COLORS[p.product] ?? '#9E9990',
                    border: `1px solid ${(PRODUCT_COLORS[p.product] ?? '#9E9990')}33`,
                  }}>
                    {p.productName}
                  </span>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#34A853' }}>₪{p.amount.toLocaleString('he-IL')}</div>
                  <div style={{ fontSize: 11, color: '#9E9990' }}>{absDate(p.created_at)}</div>
                </div>
              </div>
            </Link>
          ))}
          {!loading && (data?.recentPurchases.length ?? 0) === 0 && (
            <div style={{ color: '#9E9990', fontSize: 13, textAlign: 'center', padding: 24 }}>אין רכישות בתקופה זו</div>
          )}
        </div>
      </div>

      {/* ── Upsell ladder ── */}
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>מסלול שדרוג</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['free_training', 'challenge', 'workshop', 'course', 'strategy', 'premium', 'partnership'].map((pid, i, arr) => {
            const p = PRODUCT_MAP[pid];
            const pData = data?.byProduct[pid];
            const hasRevenue = (pData?.revenue ?? 0) > 0;
            const color = PRODUCT_COLORS[pid] ?? '#9E9990';
            return (
              <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  padding: '12px 14px', borderRadius: 10, textAlign: 'center', minWidth: 100, flexShrink: 0,
                  background: hasRevenue ? color + '15' : '#141820',
                  border: `1px solid ${hasRevenue ? color + '44' : '#2C323E'}`,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: hasRevenue ? color : '#9E9990' }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1', marginTop: 4 }}>
                    {p.price === 0 ? 'חינם' : `₪${p.price.toLocaleString()}`}
                  </div>
                  <div style={{ fontSize: 11, color: '#9E9990', marginTop: 2 }}>
                    {pData?.count ?? 0} רכישות
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <span style={{ color: '#2C323E', fontSize: 18, flexShrink: 0 }}>→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
