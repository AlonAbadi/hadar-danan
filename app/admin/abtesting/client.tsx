'use client';

import { useState } from 'react';
import {
  PageHeader, KpiCard, KpiGrid, SectionCard, Badge, DataTable, EmptyState,
} from '@/components/admin/ui';
import type { ABProposal } from '@/lib/admin/ab-agent';
import { bayesianStats } from '@/lib/admin/ab-agent';
import { AB_CONTENT } from '@/lib/ab';

// ── Live experiment (experiments table) ────────────────────────────────────────

interface LiveTest {
  id: string;
  name: string;
  status: string;
  variant_a: string | null;
  variant_b: string | null;
  visitors_a: number;
  visitors_b: number;
  conversions_a: number;
  conversions_b: number;
  winner: string | null;
}

// Human-readable metadata for known live tests
const LIVE_TEST_META: Record<string, { label: string; a: string; b: string; aCta: string; bCta: string }> = {
  landing_headline: {
    label: 'כותרת הירו — עמוד הבית',
    a: AB_CONTENT.A.headline,
    b: AB_CONTENT.B.headline,
    aCta: AB_CONTENT.A.cta,
    bCta: AB_CONTENT.B.cta,
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  copy: 'טקסט/קופי',
  ux: 'UX/UI',
  funnel: 'פאנל',
};

const CATEGORY_COLORS: Record<string, string> = {
  copy: '#3b82f6',
  ux: '#8b5cf6',
  funnel: '#22c55e',
};

const PRIORITY_VARIANT: Record<string, 'danger' | 'gold' | 'default'> = {
  high: 'danger',
  medium: 'gold',
  low: 'default',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

const METRIC_LABELS: Record<string, string> = {
  signup_rate: 'שיעור הרשמה',
  checkout_rate: 'שיעור תשלום',
  click_rate: 'שיעור קליק',
  email_open_rate: 'Open Rate',
  quiz_completion_rate: 'השלמת שאלון',
};

function daysRunning(startedAt: string | null): number {
  if (!startedAt) return 0;
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000);
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

function TabBar({
  tabs, active, onChange,
}: {
  tabs: { key: string; label: string; count: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '24px', gap: '0' }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? '#c9a84c' : '#6b7280',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid #c9a84c' : '2px solid transparent',
            marginBottom: '-2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'inherit',
          }}
        >
          {tab.label}
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            background: active === tab.key ? '#fef9f0' : '#f3f4f6',
            color: active === tab.key ? '#c9a84c' : '#9ca3af',
            padding: '1px 6px',
            borderRadius: '10px',
          }}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Confidence Meter ───────────────────────────────────────────────────────────

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const color = confidence >= 95 ? '#16a34a' : confidence >= 80 ? '#ca8a04' : '#9ca3af';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9E9990', marginBottom: '4px' }}>
        <span>Confidence</span>
        <span style={{ fontWeight: 600, color, fontFamily: 'system-ui' }}>{confidence.toFixed(0)}%</span>
      </div>
      <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, confidence)}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

function EditModal({
  proposal,
  onSave,
  onCancel,
}: {
  proposal: ABProposal;
  onSave: (updates: Partial<ABProposal>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: proposal.title,
    hypothesis: proposal.hypothesis,
    variant_a: proposal.variant_a,
    variant_b: proposal.variant_b,
    metric: proposal.metric,
    page_or_element: proposal.page_or_element,
    priority: proposal.priority,
    days_to_significance: proposal.days_to_significance,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: '#141820', border: '1px solid #2C323E', borderRadius: '12px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflow: 'auto', padding: '28px',
      }}>
        <div style={{ fontWeight: 600, fontSize: '16px', color: '#EDE9E1', marginBottom: '20px' }}>
          ✏️ עריכת הצעה
        </div>

        {([
          { key: 'title', label: 'כותרת', type: 'input' },
          { key: 'hypothesis', label: 'השערה', type: 'textarea' },
          { key: 'variant_a', label: 'גרסה A - נוכחית', type: 'textarea' },
          { key: 'variant_b', label: 'גרסה B - מוצעת', type: 'textarea' },
          { key: 'page_or_element', label: 'דף / אלמנט', type: 'input' },
        ] as const).map(({ key, label, type }) => (
          <div key={key} style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9E9990', display: 'block', marginBottom: '4px' }}>
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px',
                  border: '1px solid #d1d5db', outline: 'none', fontFamily: 'inherit',
                  resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5',
                }}
              />
            ) : (
              <input
                type="text"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px',
                  border: '1px solid #d1d5db', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9E9990', display: 'block', marginBottom: '4px' }}>מדד</label>
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontFamily: 'inherit' }}
            >
              {Object.entries(METRIC_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9E9990', display: 'block', marginBottom: '4px' }}>עדיפות</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as 'high' | 'medium' | 'low' })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontFamily: 'inherit' }}
            >
              <option value="high">גבוהה</option>
              <option value="medium">בינונית</option>
              <option value="low">נמוכה</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#9E9990', display: 'block', marginBottom: '4px' }}>ימים להשגת מובהקות</label>
            <input
              type="number"
              value={form.days_to_significance}
              onChange={(e) => setForm({ ...form, days_to_significance: Number(e.target.value) })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', fontSize: '13px', borderRadius: '6px',
              border: '1px solid #d1d5db', background: '#1D2430', color: '#EDE9E1',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ביטול
          </button>
          <button
            onClick={() => onSave(form)}
            style={{
              padding: '8px 20px', fontSize: '13px', borderRadius: '6px',
              border: 'none', background: '#c9a84c', color: '#fff',
              cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            שמור שינויים
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Proposal Card (Tab 1) ──────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  onApprove,
  onEdit,
  loading,
}: {
  proposal: ABProposal;
  onApprove: () => void;
  onEdit: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      padding: '20px',
      background: '#141820',
      borderRadius: '10px',
      border: '1px solid #2C323E',
      borderRight: `4px solid ${CATEGORY_COLORS[proposal.category] || '#9E9990'}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
              background: `${CATEGORY_COLORS[proposal.category]}20`,
              color: CATEGORY_COLORS[proposal.category],
            }}>
              {CATEGORY_LABELS[proposal.category]}
            </span>
            <Badge variant={PRIORITY_VARIANT[proposal.priority] || 'default'}>
              {PRIORITY_LABELS[proposal.priority]}
            </Badge>
            <span style={{ fontSize: '11px', color: '#9E9990' }}>
              ~{proposal.days_to_significance} ימים · {proposal.estimated_traffic} ביקורים/יום
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#EDE9E1' }}>{proposal.title}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginRight: '12px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid #d1d5db', background: '#1D2430', color: '#EDE9E1',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ✏️ ערוך
          </button>
          <button
            onClick={onApprove}
            disabled={loading}
            style={{
              padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
              border: 'none', background: loading ? '#d1d5db' : '#c9a84c', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            {loading ? '...' : '✅ אשר והתחל'}
          </button>
        </div>
      </div>

      {/* Hypothesis */}
      <div style={{
        fontSize: '12px', color: '#9E9990', background: '#1D2430', borderRadius: '6px',
        padding: '10px 12px', marginBottom: '12px', lineHeight: '1.6',
      }}>
        💡 {proposal.hypothesis}
      </div>

      {/* Variants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div style={{ padding: '10px 12px', background: '#1D2430', borderRadius: '6px', border: '1px solid #2C323E' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9E9990', marginBottom: '4px' }}>גרסה A — נוכחית</div>
          <div style={{ fontSize: '12px', color: '#EDE9E1', lineHeight: '1.5' }}>{proposal.variant_a}</div>
        </div>
        <div style={{ padding: '10px 12px', background: 'rgba(201,150,74,0.08)', borderRadius: '6px', border: '1px solid rgba(201,150,74,0.25)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#C9964A', marginBottom: '4px' }}>גרסה B — מוצעת</div>
          <div style={{ fontSize: '12px', color: '#EDE9E1', lineHeight: '1.5' }}>{proposal.variant_b}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#9E9990' }}>
          📊 מדד: {METRIC_LABELS[proposal.metric] || proposal.metric}
        </span>
        <span style={{ fontSize: '11px', color: '#9E9990' }}>
          📍 {proposal.page_or_element}
        </span>
        {proposal.reasoning && (
          <details style={{ fontSize: '11px', color: '#9E9990' }}>
            <summary style={{ cursor: 'pointer', color: '#9E9990' }}>נימוק הסוכן</summary>
            <div style={{ marginTop: '6px', lineHeight: '1.6' }}>{proposal.reasoning}</div>
          </details>
        )}
      </div>
    </div>
  );
}

// ── Live Test Card (experiments table) ────────────────────────────────────────

function LiveTestCard({ test }: { test: LiveTest }) {
  const meta = LIVE_TEST_META[test.name];
  const stats = bayesianStats(test.visitors_a, test.conversions_a, test.visitors_b, test.conversions_b);
  const cvrA = test.visitors_a > 0 ? (test.conversions_a / test.visitors_a * 100) : 0;
  const cvrB = test.visitors_b > 0 ? (test.conversions_b / test.visitors_b * 100) : 0;
  const winner = stats.confidence >= 95 ? stats.winner : null;

  return (
    <div style={{
      padding: '20px',
      background: '#141820',
      borderRadius: '10px',
      border: winner === 'b' ? '2px solid #34A853' : winner === 'a' ? '2px solid #4285F4' : '2px solid #C9964A',
      position: 'relative',
    }}>
      {/* Winner badge */}
      {winner && (
        <div style={{
          position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
          background: winner === 'b' ? '#16a34a' : '#3b82f6', color: '#fff',
          padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          🏆 מנצח: גרסה {winner.toUpperCase()} — {Math.abs(stats.uplift).toFixed(1)}% uplift
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
              background: '#fef3c7', color: '#C9964A',
            }}>
              📡 ניסוי חי
            </span>
            <Badge variant="gold">פעיל</Badge>
            {!stats.hasMinSample && (
              <Badge variant="default">ממתין לדגימה מינימלית</Badge>
            )}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#EDE9E1' }}>
            {meta?.label ?? test.name}
          </div>
          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '2px' }}>
            מדד: שיעור הרשמה · מעקב דרך טבלת experiments
          </div>
        </div>
      </div>

      {/* Variant texts */}
      {meta && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div style={{ padding: '10px 12px', background: '#f3f4f6', borderRadius: '6px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9E9990', marginBottom: '4px' }}>גרסה A — נוכחית</div>
            <div style={{ fontSize: '12px', color: '#EDE9E1', lineHeight: '1.5' }}>{meta.a}</div>
            <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '4px' }}>CTA: {meta.aCta}</div>
          </div>
          <div style={{ padding: '10px 12px', background: '#fef9f0', borderRadius: '6px', border: '1px solid #f3d89a' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#c9a84c', marginBottom: '4px' }}>גרסה B — מאתגר</div>
            <div style={{ fontSize: '12px', color: '#EDE9E1', lineHeight: '1.5' }}>{meta.b}</div>
            <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '4px' }}>CTA: {meta.bCta}</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          textAlign: 'center', padding: '14px', borderRadius: '8px',
          background: winner === 'a' ? '#eff6ff' : '#f9fafb',
          border: winner === 'a' ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '10px', color: '#9E9990', marginBottom: '4px', fontWeight: 500 }}>גרסה A</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrA.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '4px' }}>
            {test.conversions_a.toLocaleString()} / {test.visitors_a.toLocaleString()} מבקרים
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#9E9990', marginTop: '2px', fontFamily: 'system-ui' }}>
              95% CI: {(stats.ci_a[0] * 100).toFixed(1)}–{(stats.ci_a[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 16px', textAlign: 'center', borderRadius: '8px',
          background: !stats.hasMinSample ? '#f9fafb' : stats.uplift > 0 ? '#f0fdf4' : '#fef2f2',
        }}>
          <div style={{ fontSize: '10px', color: '#9E9990', marginBottom: '4px' }}>Uplift</div>
          <div style={{
            fontSize: '22px', fontWeight: 700, fontFamily: 'system-ui', lineHeight: 1,
            color: !stats.hasMinSample ? '#9ca3af' : stats.uplift > 0 ? '#16a34a' : '#dc2626',
          }}>
            {stats.hasMinSample ? `${stats.uplift > 0 ? '+' : ''}${stats.uplift.toFixed(1)}%` : '–'}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#9E9990', marginTop: '4px' }}>
              P(B&gt;A): {(stats.probBWins * 100).toFixed(0)}%
            </div>
          )}
        </div>

        <div style={{
          textAlign: 'center', padding: '14px', borderRadius: '8px',
          background: winner === 'b' ? '#f0fdf4' : '#fef9f0',
          border: winner === 'b' ? '1px solid #bbf7d0' : '1px solid #f3d89a',
        }}>
          <div style={{ fontSize: '10px', color: '#c9a84c', marginBottom: '4px', fontWeight: 500 }}>גרסה B</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrB.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '4px' }}>
            {test.conversions_b.toLocaleString()} / {test.visitors_b.toLocaleString()} מבקרים
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#9E9990', marginTop: '2px', fontFamily: 'system-ui' }}>
              95% CI: {(stats.ci_b[0] * 100).toFixed(1)}–{(stats.ci_b[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <ConfidenceMeter confidence={stats.hasMinSample ? stats.confidence : 0} />

      {!stats.hasMinSample && (
        <div style={{ fontSize: '11px', color: '#9E9990', textAlign: 'center', marginTop: '8px' }}>
          נדרשים לפחות 100 מבקרים לכל גרסה לפני חישוב מובהקות
          ({test.visitors_a}/100 A · {test.visitors_b}/100 B)
        </div>
      )}
    </div>
  );
}

// ── Running Card (Tab 2) ───────────────────────────────────────────────────────

function RunningCard({
  proposal,
  onStop,
  onPause,
  loading,
}: {
  proposal: ABProposal;
  onStop: () => void;
  onPause: () => void;
  loading: boolean;
}) {
  const stats = bayesianStats(
    proposal.visitors_a, proposal.conversions_a,
    proposal.visitors_b, proposal.conversions_b
  );
  const cvrA = proposal.visitors_a > 0 ? (proposal.conversions_a / proposal.visitors_a * 100) : 0;
  const cvrB = proposal.visitors_b > 0 ? (proposal.conversions_b / proposal.visitors_b * 100) : 0;
  const days = daysRunning(proposal.started_at);
  const daysLeft = Math.max(0, proposal.days_to_significance - days);
  const winner = stats.confidence >= 95 ? stats.winner : null;

  return (
    <div style={{
      padding: '20px',
      background: '#141820',
      borderRadius: '10px',
      border: winner === 'b' ? '2px solid #34A853' : winner === 'a' ? '2px solid #4285F4' : '1px solid #2C323E',
      position: 'relative',
    }}>
      {/* Winner badge */}
      {winner && (
        <div style={{
          position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
          background: winner === 'b' ? '#16a34a' : '#3b82f6', color: '#fff',
          padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          🏆 מנצח: גרסה {winner.toUpperCase()} - {Math.abs(stats.uplift).toFixed(1)}% uplift
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
              background: `${CATEGORY_COLORS[proposal.category]}20`,
              color: CATEGORY_COLORS[proposal.category],
            }}>
              {CATEGORY_LABELS[proposal.category]}
            </span>
            <Badge variant="gold">פעיל</Badge>
            {!stats.hasMinSample && (
              <Badge variant="default">ממתין לדגימה מינימלית</Badge>
            )}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#EDE9E1' }}>{proposal.title}</div>
          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '2px' }}>
            יום {days} מתוך {proposal.days_to_significance} · {daysLeft > 0 ? `עוד ${daysLeft} ימים` : 'חרג מהזמן המוערך'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onPause}
            disabled={loading}
            style={{
              padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid #d1d5db', background: '#1D2430', color: '#EDE9E1',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            ⏸ עצור זמנית
          </button>
          <button
            onClick={onStop}
            disabled={loading}
            style={{
              padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            🛑 סיים ניסוי
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
        {/* Variant A */}
        <div style={{
          textAlign: 'center', padding: '14px', borderRadius: '8px',
          background: winner === 'a' ? '#eff6ff' : '#f9fafb',
          border: winner === 'a' ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '10px', color: '#9E9990', marginBottom: '4px', fontWeight: 500 }}>גרסה A (נוכחית)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrA.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '4px' }}>
            {proposal.conversions_a.toLocaleString()} / {proposal.visitors_a.toLocaleString()} מבקרים
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#9E9990', marginTop: '2px', fontFamily: 'system-ui' }}>
              95% CI: {(stats.ci_a[0] * 100).toFixed(1)}-{(stats.ci_a[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Uplift */}
        <div style={{
          padding: '12px 16px', textAlign: 'center', borderRadius: '8px',
          background: !stats.hasMinSample ? '#f9fafb' : stats.uplift > 0 ? '#f0fdf4' : '#fef2f2',
        }}>
          <div style={{ fontSize: '10px', color: '#9E9990', marginBottom: '4px' }}>Uplift</div>
          <div style={{
            fontSize: '22px', fontWeight: 700, fontFamily: 'system-ui', lineHeight: 1,
            color: !stats.hasMinSample ? '#9ca3af' : stats.uplift > 0 ? '#16a34a' : '#dc2626',
          }}>
            {stats.hasMinSample ? `${stats.uplift > 0 ? '+' : ''}${stats.uplift.toFixed(1)}%` : '-'}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#9E9990', marginTop: '4px' }}>
              P(B&gt;A): {(stats.probBWins * 100).toFixed(0)}%
            </div>
          )}
        </div>

        {/* Variant B */}
        <div style={{
          textAlign: 'center', padding: '14px', borderRadius: '8px',
          background: winner === 'b' ? '#f0fdf4' : '#fef9f0',
          border: winner === 'b' ? '1px solid #bbf7d0' : '1px solid #f3d89a',
        }}>
          <div style={{ fontSize: '10px', color: '#c9a84c', marginBottom: '4px', fontWeight: 500 }}>גרסה B (מוצעת)</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrB.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '4px' }}>
            {proposal.conversions_b.toLocaleString()} / {proposal.visitors_b.toLocaleString()} מבקרים
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#9E9990', marginTop: '2px', fontFamily: 'system-ui' }}>
              95% CI: {(stats.ci_b[0] * 100).toFixed(1)}-{(stats.ci_b[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Confidence meter */}
      <ConfidenceMeter confidence={stats.hasMinSample ? stats.confidence : 0} />

      {!stats.hasMinSample && (
        <div style={{ fontSize: '11px', color: '#9E9990', textAlign: 'center', marginTop: '8px' }}>
          נדרשים לפחות 100 מבקרים לכל גרסה לפני חישוב מובהקות
          ({proposal.visitors_a}/100 A · {proposal.visitors_b}/100 B)
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ABTestingClient({ proposals: initial, liveTests }: { proposals: ABProposal[]; liveTests: LiveTest[] }) {
  const [proposals, setProposals] = useState<ABProposal[]>(initial);
  const [activeTab, setActiveTab] = useState<'proposed' | 'running' | 'completed'>('proposed');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingProposal, setEditingProposal] = useState<ABProposal | null>(null);

  const proposed = proposals.filter((p) => p.status === 'proposed').sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] || 1) - (order[b.priority] || 1);
  });
  const running = proposals.filter((p) => p.status === 'running' || p.status === 'approved');
  const paused = proposals.filter((p) => p.status === 'paused');
  const completed = proposals.filter((p) => p.status === 'completed');

  const totalCumulativeUplift = completed
    .filter((p) => p.winner === 'b')
    .reduce((sum, p) => {
      const s = bayesianStats(p.visitors_a, p.conversions_a, p.visitors_b, p.conversions_b);
      return sum + (s.uplift > 0 ? s.uplift : 0);
    }, 0);

  // ── API calls ──────────────────────────────────────────────────────────────

  async function callApi(id: string, body: Record<string, unknown>) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/ab-proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.proposal) {
        setProposals((prev) => prev.map((p) => (p.id === id ? data.proposal : p)));
      }
      return data;
    } finally {
      setLoadingId(null);
    }
  }

  async function handleApprove(id: string) {
    await callApi(id, { action: 'approve' });
    setActiveTab('running');
  }

  async function handleStop(id: string) {
    await callApi(id, { action: 'stop' });
    setActiveTab('completed');
  }

  async function handlePause(id: string) {
    await callApi(id, { action: 'pause' });
  }

  async function handleResume(id: string) {
    await callApi(id, { action: 'resume' });
    setActiveTab('running');
  }

  async function handleEdit(id: string, updates: Partial<ABProposal>) {
    await callApi(id, { action: 'update', ...updates });
    setEditingProposal(null);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeMsg('');
    try {
      const res = await fetch('/api/admin/ab-agent', { method: 'POST' });
      const data = await res.json();
      if (data.proposals?.length > 0) {
        setProposals((prev) => [
          ...data.proposals.filter((n: ABProposal) => !prev.some((p) => p.id === n.id)),
          ...prev,
        ]);
        setActiveTab('proposed');
      }
      setAnalyzeMsg(data.message || '');
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '32px 48px', color: '#EDE9E1' }}>
      {editingProposal && (
        <EditModal
          proposal={editingProposal}
          onSave={(updates) => handleEdit(editingProposal.id, updates)}
          onCancel={() => setEditingProposal(null)}
        />
      )}

      <PageHeader
        title="A/B טסטינג"
        titleEn="AI Experimentation Hub"
        subtitle="הסוכן מנתח נתוני האתר ומציע ניסויים - אתה מאשר, הנתונים מכריעים"
        actions={
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              padding: '8px 18px', fontSize: '13px', borderRadius: '8px',
              border: 'none', background: analyzing ? '#d1d5db' : '#c9a84c', color: '#fff',
              cursor: analyzing ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {analyzing ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                מנתח...
              </>
            ) : '🤖 בקש ניתוח חדש'}
          </button>
        }
      />

      {analyzeMsg && (
        <div style={{
          padding: '10px 16px', background: 'rgba(52,168,83,0.08)', border: '1px solid rgba(52,168,83,0.25)',
          borderRadius: '8px', fontSize: '12px', color: '#34A853', marginBottom: '20px',
        }}>
          ✅ {analyzeMsg}
        </div>
      )}

      <KpiGrid cols={4}>
        <KpiCard label="הצעות ממתינות" value={proposed.length} icon="💡" variant="gold" />
        <KpiCard label="ניסויים פעילים" value={running.length + liveTests.length} icon="⚡" variant="success" />
        <KpiCard label="הושלמו" value={completed.length} icon="✅" />
        <KpiCard
          label="Uplift מצטבר"
          value={completed.length > 0 ? `+${totalCumulativeUplift.toFixed(1)}%` : '-'}
          icon="📈"
          variant={totalCumulativeUplift > 0 ? 'success' : 'default'}
        />
      </KpiGrid>

      <TabBar
        active={activeTab}
        onChange={(k) => setActiveTab(k as typeof activeTab)}
        tabs={[
          { key: 'proposed', label: 'הצעות הסוכן', count: proposed.length },
          { key: 'running', label: 'ניסויים פעילים', count: running.length + paused.length + liveTests.length },
          { key: 'completed', label: 'הושלמו', count: completed.length },
        ]}
      />

      {/* ── Tab 1: Proposed ────────────────────────────────────────────────── */}
      {activeTab === 'proposed' && (
        <>
          {proposed.length === 0 ? (
            <EmptyState
              icon="🤖"
              title="אין הצעות ממתינות"
              description='לחץ על "בקש ניתוח חדש" כדי שהסוכן יבצע ניתוח ויציע ניסויים חדשים'
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {proposed.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  onApprove={() => handleApprove(p.id)}
                  onEdit={() => setEditingProposal(p)}
                  loading={loadingId === p.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab 2: Running ─────────────────────────────────────────────────── */}
      {activeTab === 'running' && (
        <>
          {/* Live tests from experiments table */}
          {liveTests.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#C9964A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                📡 ניסויים חיים — experiments table
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {liveTests.map((t) => (
                  <LiveTestCard key={t.id} test={t} />
                ))}
              </div>
            </div>
          )}

          {running.length === 0 && paused.length === 0 && liveTests.length === 0 ? (
            <EmptyState
              icon="⚡"
              title="אין ניסויים פעילים"
              description='אשר הצעה מהסוכן כדי להתחיל ניסוי'
            />
          ) : running.length === 0 && paused.length === 0 ? null : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {running.map((p) => (
                <RunningCard
                  key={p.id}
                  proposal={p}
                  onStop={() => handleStop(p.id)}
                  onPause={() => handlePause(p.id)}
                  loading={loadingId === p.id}
                />
              ))}
              {paused.length > 0 && (
                <SectionCard title="מושהים" titleEn="Paused">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {paused.map((p) => (
                      <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '12px 16px', background: '#1D2430', borderRadius: '8px',
                        border: '1px solid #2C323E',
                      }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#EDE9E1' }}>{p.title}</div>
                          <div style={{ fontSize: '11px', color: '#9E9990', marginTop: '2px' }}>
                            {p.visitors_a} A · {p.visitors_b} B · {p.confidence.toFixed(0)}% confidence
                          </div>
                        </div>
                        <button
                          onClick={() => handleResume(p.id)}
                          disabled={loadingId === p.id}
                          style={{
                            padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
                            border: 'none', background: '#c9a84c', color: '#fff',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          ▶ המשך
                        </button>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Tab 3: Completed ───────────────────────────────────────────────── */}
      {activeTab === 'completed' && (
        <SectionCard title="ניסויים שהושלמו" titleEn="Completed Tests" noPadding>
          <DataTable
            columns={[
              { key: 'name', label: 'ניסוי', width: '25%' },
              { key: 'category', label: 'קטגוריה', align: 'center' },
              { key: 'uplift', label: 'Uplift', align: 'center' },
              { key: 'winner', label: 'מנצח', align: 'center' },
              { key: 'confidence', label: 'Confidence', align: 'center' },
              { key: 'duration', label: 'משך', align: 'center' },
            ]}
            rows={completed.map((p) => {
              const stats = bayesianStats(p.visitors_a, p.conversions_a, p.visitors_b, p.conversions_b);
              const dur = p.started_at && p.completed_at
                ? Math.floor((new Date(p.completed_at).getTime() - new Date(p.started_at).getTime()) / 86400000)
                : null;
              return {
                name: (
                  <div>
                    <div style={{ fontWeight: 500, color: '#EDE9E1', fontSize: '13px' }}>{p.title}</div>
                    <div style={{ fontSize: '11px', color: '#9E9990' }}>{p.page_or_element}</div>
                  </div>
                ),
                category: (
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                    background: `${CATEGORY_COLORS[p.category]}20`,
                    color: CATEGORY_COLORS[p.category], fontWeight: 500,
                  }}>
                    {CATEGORY_LABELS[p.category]}
                  </span>
                ),
                uplift: (
                  <span style={{
                    color: stats.uplift > 0 ? '#16a34a' : stats.uplift < 0 ? '#dc2626' : '#6b7280',
                    fontWeight: 600, fontFamily: 'system-ui',
                  }}>
                    {stats.hasMinSample ? `${stats.uplift > 0 ? '+' : ''}${stats.uplift.toFixed(1)}%` : '-'}
                  </span>
                ),
                winner: p.winner === 'b'
                  ? <Badge variant="success">🏆 גרסה B</Badge>
                  : p.winner === 'a'
                    ? <Badge variant="info">גרסה A</Badge>
                    : <Badge variant="default">אין מנצח</Badge>,
                confidence: <Badge variant={p.confidence >= 95 ? 'success' : 'warning'}>{p.confidence.toFixed(0)}%</Badge>,
                duration: dur !== null ? <span style={{ fontSize: '12px', color: '#9E9990' }}>{dur} ימים</span> : '-',
              };
            })}
            emptyMessage="אין ניסויים שהושלמו עדיין"
          />
        </SectionCard>
      )}

      {/* Agent info card */}
      <SectionCard title="על הסוכן" titleEn="How the Agent Works">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { icon: '🔍', title: 'ניתוח נתונים', desc: 'בוחן נשירת פאנל, ביצועי אימייל, נטישת תשלום ושיעורי המרה' },
            { icon: '💡', title: 'הצעות חכמות', desc: 'מציע ניסויים בקטגוריות קופי, UX ופאנל עם נימוק מבוסס-נתונים' },
            { icon: '📊', title: 'Bayesian Stats', desc: 'מחשב P(B>A) ו-Confidence Interval - לא רק p-value' },
            { icon: '🛑', title: 'עצירה חכמה', desc: 'עוצר אוטומטי ב-95% confidence או לאחר 2× הזמן המוערך' },
          ].map((item) => (
            <div key={item.title} style={{
              padding: '14px', background: '#1D2430', borderRadius: '8px', border: '1px solid #2C323E',
            }}>
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>{item.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#C9964A', marginBottom: '4px' }}>{item.title}</div>
              <div style={{ fontSize: '11px', color: '#9E9990', lineHeight: '1.5' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
