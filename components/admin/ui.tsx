'use client';

import { ReactNode } from 'react';

// ─── Page Header ───────────────────────────────────────
export function PageHeader({
  title,
  titleEn,
  subtitle,
  actions,
}: {
  title: string;
  titleEn?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">
          {title}
          {titleEn && <span className="page-title-en">{titleEn}</span>}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .page-title-en {
          font-size: 13px;
          font-weight: 400;
          color: #9ca3af;
          font-family: system-ui, sans-serif;
        }
        .page-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0;
        }
        .page-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────
export function KpiCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  variant?: 'default' | 'gold' | 'success' | 'danger' | 'info';
}) {
  const accentColors: Record<string, string> = {
    default: '#ffffff',
    gold: '#fffbf0',
    success: '#f0fdf4',
    danger: '#fef2f2',
    info: '#eff6ff',
  };
  const borderColors: Record<string, string> = {
    default: '#e5e7eb',
    gold: '#f3d89a',
    success: '#bbf7d0',
    danger: '#fecaca',
    info: '#bfdbfe',
  };

  return (
    <div
      className="kpi-card"
      style={{
        background: accentColors[variant],
        borderColor: borderColors[variant],
      }}
    >
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      {change !== undefined && (
        <div className={`kpi-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          {changeLabel && <span className="change-label"> {changeLabel}</span>}
        </div>
      )}

      <style jsx>{`
        .kpi-card {
          border: 1px solid;
          border-radius: 12px;
          padding: 20px;
          transition: border-color 0.2s;
        }
        .kpi-card:hover {
          border-color: #c9a84c !important;
        }
        .kpi-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .kpi-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          letter-spacing: 0.02em;
        }
        .kpi-icon {
          font-size: 18px;
        }
        .kpi-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
          font-family: system-ui, sans-serif;
        }
        .kpi-change {
          font-size: 12px;
          margin-top: 8px;
          font-family: system-ui, sans-serif;
        }
        .kpi-change.positive {
          color: #16a34a;
        }
        .kpi-change.negative {
          color: #dc2626;
        }
        .change-label {
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
}

// ─── KPI Grid ──────────────────────────────────────────
export function KpiGrid({ children, cols = 5 }: { children: ReactNode; cols?: number }) {
  return (
    <div className="kpi-grid">
      {children}
      <style jsx>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(${cols}, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }
        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 768px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

// ─── Section Card (container for dashboard sections) ──
export function SectionCard({
  title,
  titleEn,
  actions,
  children,
  noPadding,
}: {
  title: string;
  titleEn?: string;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div className="section-card">
      <div className="section-header">
        <h2 className="section-title">
          {title}
          {titleEn && <span className="section-title-en">{titleEn}</span>}
        </h2>
        {actions && <div className="section-actions">{actions}</div>}
      </div>
      <div className={noPadding ? 'section-body no-padding' : 'section-body'}>
        {children}
      </div>

      <style jsx>{`
        .section-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .section-title-en {
          font-size: 11px;
          font-weight: 400;
          color: #9ca3af;
          font-family: system-ui, sans-serif;
        }
        .section-actions {
          display: flex;
          gap: 8px;
        }
        .section-body {
          padding: 20px;
        }
        .section-body.no-padding {
          padding: 0;
        }
      `}</style>
    </div>
  );
}

// ─── Data Table ────────────────────────────────────────
export function DataTable({
  columns,
  rows,
  emptyMessage = 'אין נתונים להצגה',
}: {
  columns: { key: string; label: string; align?: 'right' | 'left' | 'center'; width?: string }[];
  rows: Record<string, ReactNode>[];
  emptyMessage?: string;
}) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ textAlign: col.align || 'right', width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align || 'right' }}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <style jsx>{`
        .table-wrapper {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .data-table th {
          font-weight: 500;
          color: #6b7280;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 10px 12px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .data-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
          white-space: nowrap;
        }
        .data-table tbody tr:hover {
          background: #f9fafb;
        }
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────
export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'gold';
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    default: { bg: '#f3f4f6', text: '#6b7280' },
    success: { bg: '#f0fdf4', text: '#16a34a' },
    danger: { bg: '#fef2f2', text: '#dc2626' },
    warning: { bg: '#fefce8', text: '#ca8a04' },
    info: { bg: '#eff6ff', text: '#2563eb' },
    gold: { bg: '#fffbf0', text: '#c9a84c' },
  };
  const c = colors[variant];

  return (
    <span
      className="badge"
      style={{ background: c.bg, color: c.text }}
    >
      {children}
      <style jsx>{`
        .badge {
          font-size: 11px;
          font-weight: 500;
          padding: 3px 10px;
          border-radius: 6px;
          white-space: nowrap;
          display: inline-block;
        }
      `}</style>
    </span>
  );
}

// ─── Funnel Bar (visual bar chart for funnel stages) ──
export function FunnelBar({
  stages,
}: {
  stages: { label: string; value: number; percent: number }[];
}) {
  const max = Math.max(...stages.map((s) => s.value));

  return (
    <div className="funnel-bar">
      {stages.map((stage, i) => (
        <div key={i} className="funnel-stage">
          <div className="funnel-stage-header">
            <span className="funnel-stage-label">{stage.label}</span>
            <span className="funnel-stage-value">{stage.value.toLocaleString()}</span>
          </div>
          <div className="funnel-bar-track">
            <div
              className="funnel-bar-fill"
              style={{
                width: `${(stage.value / max) * 100}%`,
                opacity: 1 - i * 0.12,
              }}
            />
          </div>
          {i < stages.length - 1 && (
            <div className="funnel-drop">
              ↓ {stage.percent}% המרה
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        .funnel-bar {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .funnel-stage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .funnel-stage-label {
          font-size: 13px;
          color: #374151;
        }
        .funnel-stage-value {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          font-family: system-ui, sans-serif;
        }
        .funnel-bar-track {
          height: 28px;
          background: #f3f4f6;
          border-radius: 6px;
          overflow: hidden;
        }
        .funnel-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #c9a84c, #a88a3d);
          border-radius: 6px;
          transition: width 0.6s ease;
        }
        .funnel-drop {
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
          padding: 4px 0;
        }
      `}</style>
    </div>
  );
}

// ─── Percentage Bar ────────────────────────────────────
export function PercentBar({
  value,
  max = 100,
  color = '#c9a84c',
  height = 6,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}) {
  return (
    <div className="pct-bar">
      <div
        className="pct-fill"
        style={{
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color,
          height,
        }}
      />
      <style jsx>{`
        .pct-bar {
          height: ${height}px;
          background: #f3f4f6;
          border-radius: ${height / 2}px;
          overflow: hidden;
          width: 100%;
        }
        .pct-fill {
          border-radius: ${height / 2}px;
          transition: width 0.4s ease;
        }
      `}</style>
    </div>
  );
}

// ─── Date Range Picker (simple) ───────────────────────
export function DateRangePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { value: 'today', label: 'היום' },
    { value: '7d', label: '7 ימים' },
    { value: '30d', label: '30 ימים' },
    { value: '90d', label: '90 ימים' },
    { value: 'all', label: 'הכל' },
  ];

  return (
    <div className="date-picker">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`date-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}

      <style jsx>{`
        .date-picker {
          display: flex;
          gap: 2px;
          background: #f3f4f6;
          border-radius: 8px;
          padding: 2px;
        }
        .date-btn {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'Assistant', sans-serif;
        }
        .date-btn:hover {
          color: #111827;
          background: #ffffff;
        }
        .date-btn.active {
          background: #ffffff;
          color: #c9a84c;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
      `}</style>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div className="empty-action">{action}</div>}

      <style jsx>{`
        .empty-state {
          text-align: center;
          padding: 48px 24px;
        }
        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .empty-title {
          font-size: 15px;
          font-weight: 500;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .empty-desc {
          font-size: 13px;
          color: #9ca3af;
          max-width: 360px;
          margin: 0 auto;
        }
        .empty-action {
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

// ─── Action Button ─────────────────────────────────────
export function ActionButton({
  children,
  onClick,
  variant = 'default',
  size = 'sm',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'gold' | 'danger';
  size?: 'sm' | 'md';
}) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    default: {
      bg: '#f3f4f6',
      border: '#e5e7eb',
      color: '#374151',
    },
    gold: {
      bg: '#fffbf0',
      border: '#f3d89a',
      color: '#c9a84c',
    },
    danger: {
      bg: '#fef2f2',
      border: '#fecaca',
      color: '#dc2626',
    },
  };
  const s = styles[variant];
  const padding = size === 'sm' ? '6px 14px' : '9px 20px';

  return (
    <button
      onClick={onClick}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        padding,
        borderRadius: '8px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: "'Assistant', sans-serif",
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ─── Stat Comparison (for A/B testing etc) ─────────────
export function StatComparison({
  labelA,
  labelB,
  valueA,
  valueB,
  format = 'number',
}: {
  labelA: string;
  labelB: string;
  valueA: number;
  valueB: number;
  format?: 'number' | 'percent' | 'currency';
}) {
  const diff = valueB - valueA;
  const pctDiff = valueA > 0 ? ((diff / valueA) * 100) : 0;
  const isPositive = diff >= 0;

  const formatValue = (v: number) => {
    if (format === 'percent') return `${v.toFixed(1)}%`;
    if (format === 'currency') return `₪${v.toLocaleString()}`;
    return v.toLocaleString();
  };

  return (
    <div className="stat-comparison">
      <div className="stat-col">
        <div className="stat-label">{labelA}</div>
        <div className="stat-val">{formatValue(valueA)}</div>
      </div>
      <div className="stat-vs">VS</div>
      <div className="stat-col">
        <div className="stat-label">{labelB}</div>
        <div className="stat-val">{formatValue(valueB)}</div>
      </div>
      <div className={`stat-diff ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '+' : ''}{pctDiff.toFixed(1)}%
      </div>

      <style jsx>{`
        .stat-comparison {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-col {
          text-align: center;
        }
        .stat-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        .stat-val {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          font-family: system-ui, sans-serif;
        }
        .stat-vs {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 600;
        }
        .stat-diff {
          font-size: 14px;
          font-weight: 600;
          font-family: system-ui, sans-serif;
        }
        .stat-diff.positive { color: #16a34a; }
        .stat-diff.negative { color: #dc2626; }
      `}</style>
    </div>
  );
}
