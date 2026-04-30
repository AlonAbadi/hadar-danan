'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PAGE_NAMES: Record<string, string> = {
  '/admin/sales':       'דשבורד מכירות',
  '/admin/funnel':      'פאנל מכירות',
  '/admin/products':    'מוצרים',
  '/admin/bookings':    'פגישות',
  '/admin/deals':       'קופונים ודילים',
  '/admin/crm':         'ניהול לידים',
  '/admin/atelier':     'Atelier — לידים',
  '/admin/email':       'אימיילים',
  '/admin/acquisition': 'רכישת לקוחות',
  '/admin/abtesting':   'A/B Testing',
  '/admin/video':       'סרטונים ואנליטיקס',
  '/admin/community':   'הכוורת',
  '/admin/mmm':         'מודל MMM',
  '/admin/system':      'מערכת ולוגים',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHub = pathname === '/admin';
  const basePath = '/' + pathname.split('/').slice(1, 3).join('/');
  const pageName = PAGE_NAMES[basePath] ?? '';

  return (
    <div style={{ background: '#080C14', minHeight: '100vh', direction: 'rtl', fontFamily: 'var(--font-assistant), Assistant, sans-serif' }}>
      {!isHub && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(8,12,20,0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #2C323E',
          padding: '0 48px',
          height: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/admin" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#9E9990', textDecoration: 'none',
            fontSize: 13, fontWeight: 600,
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#C9964A')}
            onMouseLeave={e => (e.currentTarget.style.color = '#9E9990')}
          >
            <span style={{ fontSize: 16 }}>←</span> ניהול
          </Link>

          {pageName && (
            <div style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1' }}>{pageName}</div>
          )}

          <div style={{ width: 72 }} />
        </div>
      )}
      {children}
    </div>
  );
}
