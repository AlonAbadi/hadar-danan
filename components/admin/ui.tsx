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
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 28, gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#EDE9E1', margin: 0 }}>{title}</h1>
          {titleEn && <span style={{ fontSize: 12, fontWeight: 400, color: '#9E9990' }}>{titleEn}</span>}
        </div>
        {subtitle && <p style={{ fontSize: 13, color: '#9E9990', margin: '3px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
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
  const borderColors: Record<string, string> = {
    default: '#2C323E',
    gold:    '#C9964A',
    success: '#34A853',
    danger:  '#EA4335',
    info:    '#4285F4',
  };
  const valueColors: Record<string, string> = {
    default: '#EDE9E1',
    gold:    '#E8B94A',
    success: '#34A853',
    danger:  '#EA4335',
    info:    '#4285F4',
  };

  return (
    <div style={{
      background: '#141820',
      border: `1px solid #2C323E`,
      borderTop: `3px solid ${borderColors[variant]}`,
      borderRadius: 12,
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#9E9990' }}>{icon && `${icon} `}{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: valueColors[variant], lineHeight: 1 }}>
        {value}
      </div>
      {change !== undefined && (
        <div style={{ fontSize: 11, marginTop: 6, color: change >= 0 ? '#34A853' : '#EA4335' }}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
          {changeLabel && <span style={{ color: '#9E9990' }}> {changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ─── KPI Grid ──────────────────────────────────────────
export function KpiGrid({ children, cols = 5 }: { children: ReactNode; cols?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gap: 12,
      marginBottom: 28,
    }}>
      {children}
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────
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
    <div style={{
      background: '#141820',
      border: '1px solid #2C323E',
      borderRadius: 12,
      marginBottom: 24,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px', borderBottom: '1px solid #2C323E',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#EDE9E1', margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {title}
          {titleEn && <span style={{ fontSize: 11, fontWeight: 400, color: '#9E9990' }}>{titleEn}</span>}
        </h2>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      <div style={noPadding ? {} : { padding: 20 }}>
        {children}
      </div>
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
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                textAlign: col.align || 'right',
                width: col.width,
                fontWeight: 600,
                color: '#9E9990',
                fontSize: 11,
                padding: '10px 14px',
                background: '#1D2430',
                borderBottom: '1px solid #2C323E',
                whiteSpace: 'nowrap',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: '#9E9990', fontSize: 13 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #2C323E' }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align || 'right', padding: '10px 14px', color: '#EDE9E1', whiteSpace: 'nowrap' }}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    default: { bg: '#9E999018', text: '#9E9990', border: '#9E999033' },
    success: { bg: '#34A85318', text: '#34A853', border: '#34A85333' },
    danger:  { bg: '#EA433518', text: '#EA4335', border: '#EA433533' },
    warning: { bg: '#FBBC0518', text: '#FBBC05', border: '#FBBC0533' },
    info:    { bg: '#4285F418', text: '#4285F4', border: '#4285F433' },
    gold:    { bg: '#C9964A18', text: '#C9964A', border: '#C9964A33' },
  };
  const c = colors[variant];

  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 6,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

// ─── Funnel Bar ────────────────────────────────────────
export function FunnelBar({
  stages,
}: {
  stages: { label: string; value: number; percent: number }[];
}) {
  const max = Math.max(...stages.map((s) => s.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {stages.map((stage, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: '#9E9990' }}>{stage.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1' }}>{stage.value.toLocaleString()}</span>
          </div>
          <div style={{ height: 28, background: '#2C323E', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #E8B94A, #C9964A)',
              borderRadius: 6,
              width: `${(stage.value / max) * 100}%`,
              opacity: 1 - i * 0.12,
              transition: 'width 0.6s ease',
            }} />
          </div>
          {i < stages.length - 1 && (
            <div style={{ fontSize: 11, color: '#9E9990', textAlign: 'center', padding: '4px 0' }}>
              ↓ {stage.percent}% המרה
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Percentage Bar ────────────────────────────────────
export function PercentBar({
  value,
  max = 100,
  color = '#C9964A',
  height = 6,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}) {
  return (
    <div style={{
      height, background: '#2C323E',
      borderRadius: height / 2, overflow: 'hidden', width: '100%',
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min((value / max) * 100, 100)}%`,
        background: color,
        borderRadius: height / 2,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ─── Date Range Picker ─────────────────────────────────
export function DateRangePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { value: 'today', label: 'היום' },
    { value: '7d',   label: '7 ימים' },
    { value: '30d',  label: '30 ימים' },
    { value: '90d',  label: '90 ימים' },
    { value: 'all',  label: 'הכל' },
  ];

  return (
    <div style={{
      display: 'flex', gap: 4,
      background: '#141820', border: '1px solid #2C323E',
      borderRadius: 10, padding: 4,
    }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: value === opt.value ? '#C9964A' : 'transparent',
            color: value === opt.value ? '#1A1206' : '#9E9990',
            fontFamily: "'Assistant', sans-serif",
          }}
        >
          {opt.label}
        </button>
      ))}
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
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#9E9990', marginBottom: 4 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: '#9E9990', maxWidth: 360, margin: '0 auto' }}>{description}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
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
    default: { bg: '#1D2430', border: '#2C323E', color: '#9E9990' },
    gold:    { bg: '#C9964A18', border: '#C9964A44', color: '#C9964A' },
    danger:  { bg: '#EA433518', border: '#EA433544', color: '#EA4335' },
  };
  const s = styles[variant];
  const padding = size === 'sm' ? '6px 14px' : '9px 20px';

  return (
    <button
      onClick={onClick}
      style={{
        background: s.bg, border: `1px solid ${s.border}`, color: s.color,
        padding, borderRadius: 8, fontSize: size === 'sm' ? 12 : 13,
        fontWeight: 600, cursor: 'pointer', fontFamily: "'Assistant', sans-serif",
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ─── Stat Comparison ───────────────────────────────────
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 4 }}>{labelA}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#EDE9E1' }}>{formatValue(valueA)}</div>
      </div>
      <div style={{ fontSize: 11, color: '#9E9990', fontWeight: 600 }}>VS</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#9E9990', marginBottom: 4 }}>{labelB}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#EDE9E1' }}>{formatValue(valueB)}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: isPositive ? '#34A853' : '#EA4335' }}>
        {isPositive ? '+' : ''}{pctDiff.toFixed(1)}%
      </div>
    </div>
  );
}
