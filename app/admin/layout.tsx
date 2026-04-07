'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_SECTIONS = [
  {
    label: 'ראשי',
    items: [
      { href: '/admin', label: 'סקירה כללית', icon: '📊', labelEn: 'Overview' },
    ],
  },
  {
    label: 'מכירות',
    items: [
      { href: '/admin/funnel', label: 'פאנל מכירות', icon: '🔄', labelEn: 'Funnel' },
      { href: '/admin/products', label: 'מוצרים', icon: '📦', labelEn: 'Products' },
      { href: '/admin/bookings', label: 'פגישות', icon: '📅', labelEn: 'Bookings' },
    ],
  },
  {
    label: 'שיווק',
    items: [
      { href: '/admin/acquisition', label: 'רכישת לקוחות', icon: '🎯', labelEn: 'Acquisition' },
      { href: '/admin/mmm', label: 'מודל MMM', icon: '🧠', labelEn: 'Media Mix' },
      { href: '/admin/abtesting', label: 'A/B טסטינג', icon: '⚡', labelEn: 'Experiments' },
      { href: '/admin/email', label: 'אימיילים', icon: '📧', labelEn: 'Email' },
      { href: '/admin/video', label: 'סרטונים', icon: '🎬', labelEn: 'Video' },
    ],
  },
  {
    label: 'קהילה',
    items: [
      { href: '/admin/community', label: 'הכוורת', icon: '🐝', labelEn: 'Hive' },
      { href: '/admin/leads', label: 'לידים', icon: '👥', labelEn: 'Leads' },
      { href: '/admin/crm', label: 'CRM', icon: '🎯', labelEn: 'CRM' },
    ],
  },
  {
    label: 'מערכת',
    items: [
      { href: '/admin/system', label: 'לוגים ומערכת', icon: '⚙️', labelEn: 'System' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell" dir="rtl">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="admin-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-brand">
              <span className="brand-icon">🐝</span>
              <div>
                <div className="brand-name">הדר דנן</div>
                <div className="brand-sub">ניהול ואנליטיקס</div>
              </div>
            </div>
          )}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'הרחב' : 'כווץ'}
          >
            {collapsed ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="nav-section">
              {!collapsed && <div className="nav-section-label">{section.label}</div>}
              {section.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {!collapsed && (
                      <span className="nav-text">
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-label-en">{item.labelEn}</span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <Link href="/" className="nav-item back-link">
              <span className="nav-icon">←</span>
              <span className="nav-label">חזרה לאתר</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`admin-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Mobile header */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            ☰
          </button>
          <span className="mobile-title">ניהול</span>
        </div>

        <div className="admin-content">
          {children}
        </div>
      </main>

      <style jsx>{`
        .admin-shell {
          display: flex;
          min-height: 100vh;
          background: #f8f8f7;
          color: #111827;
          font-family: 'Assistant', sans-serif;
        }

        /* Overlay */
        .admin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 90;
        }

        /* Sidebar */
        .admin-sidebar {
          width: 260px;
          background: #ffffff;
          border-left: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          transition: width 0.25s ease;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .admin-sidebar.collapsed {
          width: 64px;
        }

        .sidebar-header {
          padding: 20px 16px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          min-height: 68px;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          font-size: 20px;
        }
        .brand-name {
          font-size: 15px;
          font-weight: 600;
          color: #c9a84c;
        }
        .brand-sub {
          font-size: 11px;
          color: #9ca3af;
          letter-spacing: 0.02em;
        }
        .collapse-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 6px;
          font-size: 12px;
          border-radius: 4px;
          transition: all 0.15s;
        }
        .collapse-btn:hover {
          color: #374151;
          background: #f3f4f6;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: 12px 8px;
        }
        .nav-section {
          margin-bottom: 8px;
        }
        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 8px 14px 4px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          color: #374151;
          text-decoration: none;
          font-size: 13px;
          transition: all 0.15s;
          white-space: nowrap;
          border-right: 3px solid transparent;
          margin-bottom: 1px;
        }
        .nav-item:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .nav-item.active {
          background: #fef9f0;
          color: #c9a84c;
          border-right-color: #c9a84c;
        }
        .nav-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }
        .nav-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .nav-label {
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-label-en {
          font-size: 10px;
          color: #9ca3af;
          font-family: system-ui, sans-serif;
          line-height: 1.2;
          margin-top: 1px;
        }
        .nav-item.active .nav-label-en {
          color: #d4b06b;
        }

        .sidebar-footer {
          padding: 8px;
          border-top: 1px solid #e5e7eb;
        }
        .back-link {
          font-size: 12px;
        }

        /* Main content */
        .admin-main {
          flex: 1;
          margin-right: 260px;
          transition: margin-right 0.25s ease;
          min-height: 100vh;
          background: #f8f8f7;
        }
        .admin-main.sidebar-collapsed {
          margin-right: 64px;
        }
        .admin-content {
          padding: 32px;
          max-width: 1400px;
        }

        /* Mobile header */
        .mobile-header {
          display: none;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .mobile-menu-btn {
          background: none;
          border: none;
          color: #374151;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
        }
        .mobile-title {
          font-size: 15px;
          font-weight: 600;
          color: #c9a84c;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(100%);
            transition: transform 0.3s ease;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
          }
          .admin-main {
            margin-right: 0;
          }
          .admin-main.sidebar-collapsed {
            margin-right: 0;
          }
          .mobile-header {
            display: flex;
          }
          .admin-content {
            padding: 16px;
          }
          .collapse-btn {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
