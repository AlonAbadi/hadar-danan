'use client';

import { useState } from 'react';
import {
  PageHeader, KpiCard, KpiGrid, SectionCard, Badge, DataTable, EmptyState,
} from '@/components/admin/ui';
import type { ABProposal } from '@/lib/admin/ab-agent';
import { bayesianStats } from '@/lib/admin/ab-agent';
import { AB_CONTENT, QUIZ_Q1_AB } from '@/lib/ab';

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
// `subLabel` controls the prefix shown above the secondary text
// (e.g. "CTA" for landing tests, "כותרת משנה" for the quiz Q1 test).
const LIVE_TEST_META: Record<string, {
  label: string;
  metric: string;
  a: string;
  b: string;
  aSub: string;
  bSub: string;
  subLabel: string;
}> = {
  landing_headline: {
    label: 'כותרת הירו — עמוד הבית',
    metric: 'שיעור הרשמה · מעקב דרך טבלת experiments',
    a: AB_CONTENT.A.headline,
    b: AB_CONTENT.B.headline,
    aSub: AB_CONTENT.A.cta,
    bSub: AB_CONTENT.B.cta,
    subLabel: 'CTA',
  },
  quiz_q1_framing: {
    label: 'שאלה 1 בקוויז — מסגור זהות מול כאב',
    metric: 'אחוז המשלימים את הקוויז (QUIZ_LEAD / PAGE_VIEW)',
    a: QUIZ_Q1_AB.A.title,
    b: QUIZ_Q1_AB.B.title,
    aSub: QUIZ_Q1_AB.A.subtitle,
    bSub: QUIZ_Q1_AB.B.subtitle,
    subLabel: 'כותרת משנה',
  },
  challenge_hero_format: {
    label: 'אתגר — וידאו מול טקסט (primary: רכישות)',
    metric: 'אחוז הרכישות (PURCHASE_COMPLETED של challenge_197 / PAGE_VIEW של /challenge)',
    a: 'וידאו של הדר בראש העמוד',
    b: 'בלוק טקסט מעוצב במקום הוידאו',
    aSub: '5:25 דק׳ צפייה ב-VSL ראשי',
    bSub: '6 שורות עם 3 bullets וציטוט',
    subLabel: 'פורמט',
  },
  challenge_hero_format_checkout: {
    label: 'אתגר — וידאו מול טקסט (secondary: קליקים ל-checkout)',
    metric: 'אחוז קליקים על CTA (CHECKOUT_STARTED של challenge_197 / PAGE_VIEW של /challenge)',
    a: 'וידאו של הדר בראש העמוד',
    b: 'בלוק טקסט מעוצב במקום הוידאו',
    aSub: 'leading indicator לרכישות',
    bSub: 'אותו פיצול ויזיטורים כמו ה-primary',
    subLabel: 'פורמט',
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
    <div style={{ display: 'flex', borderBottom: '2px solid #2C323E', marginBottom: '24px', gap: '0' }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? '#E8B94A' : '#AAB0BD',
            background: 'none',
            border: 'none',
            borderBottom: active === tab.key ? '2px solid #C9964A' : '2px solid transparent',
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
            background: active === tab.key ? 'rgba(201,150,74,0.15)' : '#1D2430',
            color: active === tab.key ? '#E8B94A' : '#AAB0BD',
            padding: '2px 8px',
            borderRadius: '10px',
            border: '1px solid #2C323E',
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
  const color = confidence >= 95 ? '#22C55E' : confidence >= 80 ? '#E8B94A' : '#AAB0BD';
  const label = confidence >= 95 ? 'מובהק' : confidence >= 80 ? 'מתקרב למובהקות' : 'עוד מוקדם להחליט';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
        <span style={{ color: '#AAB0BD' }}>רמת ביטחון סטטיסטית</span>
        <span style={{ fontWeight: 600, color, fontFamily: 'system-ui' }}>
          {confidence.toFixed(0)}% · {label}
        </span>
      </div>
      <div style={{ height: '8px', background: '#1D2430', borderRadius: '4px', overflow: 'hidden', border: '1px solid #2C323E' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, confidence)}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#AAB0BD', marginTop: '4px' }}>
        <span>0%</span>
        <span style={{ color: '#E8B94A' }}>↑ 80%</span>
        <span style={{ color: '#22C55E' }}>↑ 95% (קבלת החלטה)</span>
      </div>
    </div>
  );
}

// One-line "what does this mean" interpretation for non-statisticians
function ResultInterpretation({
  hasMinSample,
  confidence,
  uplift,
  probBWins,
  visitorsA,
  visitorsB,
}: {
  hasMinSample: boolean;
  confidence: number;
  uplift: number;
  probBWins: number;
  visitorsA: number;
  visitorsB: number;
}) {
  let icon = '⏳';
  let title = 'הניסוי עוד צעיר';
  let body = `נצברו ${visitorsA + visitorsB} מבקרים. צריך לפחות 200 לכל גרסה כדי לקבל החלטה משמעותית.`;
  let color = '#AAB0BD';
  let bg = 'rgba(158,153,144,0.08)';

  if (hasMinSample) {
    if (confidence >= 95) {
      const winner = uplift > 0 ? 'B' : 'A';
      icon = '✅';
      title = `יש מנצח: גרסה ${winner}`;
      body = `הפער ${Math.abs(uplift).toFixed(1)}% מובהק סטטיסטית. אפשר להשאיר רק את גרסה ${winner} ולסיים את הניסוי.`;
      color = '#22C55E';
      bg = 'rgba(34,197,94,0.08)';
    } else if (confidence >= 80) {
      const leader = uplift > 0 ? 'B' : 'A';
      icon = '📊';
      title = `גרסה ${leader} מובילה, אבל עוד לא מספיק`;
      body = `הסיכוי שגרסה B תנצח: ${(probBWins * 100).toFixed(0)}%. ממתינים לעוד מבקרים כדי להגיע ל-95% ביטחון.`;
      color = '#E8B94A';
      bg = 'rgba(232,185,74,0.08)';
    } else {
      icon = '🔀';
      title = 'הפער קטן מדי להחלטה';
      body = `שתי הגרסאות מתפקדות דומה (Uplift ${uplift.toFixed(1)}%). הסיכוי ש-B תנצח: ${(probBWins * 100).toFixed(0)}%. ייתכן שאין הבדל אמיתי.`;
      color = '#AAB0BD';
      bg = 'rgba(158,153,144,0.08)';
    }
  }

  return (
    <div style={{
      marginTop: '14px',
      padding: '12px 14px',
      background: bg,
      border: `1px solid ${color}33`,
      borderRadius: '8px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color, marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#AAB0BD', lineHeight: '1.5' }}>{body}</div>
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
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#AAB0BD', display: 'block', marginBottom: '4px' }}>
              {label}
            </label>
            {type === 'textarea' ? (
              <textarea
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px',
                  border: '1px solid #2C323E', outline: 'none', fontFamily: 'inherit',
                  resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.5',
                  background: '#1D2430', color: '#EDE9E1',
                }}
              />
            ) : (
              <input
                type="text"
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px',
                  border: '1px solid #2C323E', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  background: '#1D2430', color: '#EDE9E1',
                }}
              />
            )}
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#AAB0BD', display: 'block', marginBottom: '4px' }}>מדד</label>
            <select
              value={form.metric}
              onChange={(e) => setForm({ ...form, metric: e.target.value })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #2C323E', outline: 'none', fontFamily: 'inherit', background: '#1D2430', color: '#EDE9E1' }}
            >
              {Object.entries(METRIC_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#AAB0BD', display: 'block', marginBottom: '4px' }}>עדיפות</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as 'high' | 'medium' | 'low' })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #2C323E', outline: 'none', fontFamily: 'inherit', background: '#1D2430', color: '#EDE9E1' }}
            >
              <option value="high">גבוהה</option>
              <option value="medium">בינונית</option>
              <option value="low">נמוכה</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 500, color: '#AAB0BD', display: 'block', marginBottom: '4px' }}>ימים להשגת מובהקות</label>
            <input
              type="number"
              value={form.days_to_significance}
              onChange={(e) => setForm({ ...form, days_to_significance: Number(e.target.value) })}
              style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #2C323E', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#1D2430', color: '#EDE9E1' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', fontSize: '13px', borderRadius: '6px',
              border: '1px solid #2C323E', background: '#1D2430', color: '#EDE9E1',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ביטול
          </button>
          <button
            onClick={() => onSave(form)}
            style={{
              padding: '8px 20px', fontSize: '13px', borderRadius: '6px',
              border: 'none', background: '#C9964A', color: '#fff',
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
      borderRight: `4px solid ${CATEGORY_COLORS[proposal.category] || '#AAB0BD'}`,
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
            <span style={{ fontSize: '11px', color: '#AAB0BD' }}>
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
              border: '1px solid #2C323E', background: '#1D2430', color: '#EDE9E1',
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
              border: 'none', background: loading ? '#2C323E' : '#C9964A', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit',
            }}
          >
            {loading ? '...' : '✅ אשר והתחל'}
          </button>
        </div>
      </div>

      {/* Hypothesis */}
      <div style={{
        fontSize: '12px', color: '#AAB0BD', background: '#1D2430', borderRadius: '6px',
        padding: '10px 12px', marginBottom: '12px', lineHeight: '1.6',
      }}>
        💡 {proposal.hypothesis}
      </div>

      {/* Variants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div style={{ padding: '10px 12px', background: '#1D2430', borderRadius: '6px', border: '1px solid #2C323E' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#AAB0BD', marginBottom: '4px' }}>גרסה A — נוכחית</div>
          <div style={{ fontSize: '12px', color: '#EDE9E1', lineHeight: '1.5' }}>{proposal.variant_a}</div>
        </div>
        <div style={{ padding: '10px 12px', background: 'rgba(201,150,74,0.08)', borderRadius: '6px', border: '1px solid rgba(201,150,74,0.25)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#E8B94A', marginBottom: '4px' }}>גרסה B — מוצעת</div>
          <div style={{ fontSize: '12px', color: '#EDE9E1', lineHeight: '1.5' }}>{proposal.variant_b}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#AAB0BD' }}>
          📊 מדד: {METRIC_LABELS[proposal.metric] || proposal.metric}
        </span>
        <span style={{ fontSize: '11px', color: '#AAB0BD' }}>
          📍 {proposal.page_or_element}
        </span>
        {proposal.reasoning && (
          <details style={{ fontSize: '11px', color: '#AAB0BD' }}>
            <summary style={{ cursor: 'pointer', color: '#AAB0BD' }}>נימוק הסוכן</summary>
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
              background: 'rgba(201,150,74,0.15)', color: '#E8B94A', border: '1px solid rgba(201,150,74,0.30)',
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
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '2px' }}>
            מדד: {meta?.metric ?? 'שיעור המרה · מעקב דרך טבלת experiments'}
          </div>
        </div>
      </div>

      {/* Variant texts */}
      {meta && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '12px 14px', background: '#1D2430', borderRadius: '8px', border: '1px solid #2C323E' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#AAB0BD', marginBottom: '6px', letterSpacing: '0.04em' }}>גרסה A — נוכחית</div>
            <div style={{ fontSize: '13px', color: '#EDE9E1', lineHeight: '1.5' }}>{meta.a}</div>
            <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '6px' }}>{meta.subLabel}: {meta.aSub}</div>
          </div>
          <div style={{ padding: '12px 14px', background: 'rgba(201,150,74,0.08)', borderRadius: '8px', border: '1px solid rgba(201,150,74,0.30)' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#E8B94A', marginBottom: '6px', letterSpacing: '0.04em' }}>גרסה B — מאתגר</div>
            <div style={{ fontSize: '13px', color: '#EDE9E1', lineHeight: '1.5' }}>{meta.b}</div>
            <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '6px' }}>{meta.subLabel}: {meta.bSub}</div>
          </div>
        </div>
      )}

      {/* Stats — large CVR numbers, clear hierarchy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '14px', alignItems: 'stretch', marginBottom: '16px' }}>
        <div style={{
          textAlign: 'center', padding: '16px 12px', borderRadius: '10px',
          background: winner === 'a' ? 'rgba(66,133,244,0.10)' : '#1D2430',
          border: winner === 'a' ? '1px solid rgba(66,133,244,0.40)' : '1px solid #2C323E',
        }}>
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginBottom: '6px', fontWeight: 600 }}>גרסה A · שיעור המרה</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrA.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '6px' }}>
            {test.conversions_a.toLocaleString()} המרות מתוך {test.visitors_a.toLocaleString()}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#AAB0BD', marginTop: '4px', fontFamily: 'system-ui' }}>
              טווח אמת 95%: {(stats.ci_a[0] * 100).toFixed(1)}–{(stats.ci_a[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>

        <div style={{
          padding: '14px 18px', textAlign: 'center', borderRadius: '10px',
          background: !stats.hasMinSample ? '#1D2430' : stats.uplift > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(220,38,38,0.10)',
          border: `1px solid ${!stats.hasMinSample ? '#2C323E' : stats.uplift > 0 ? 'rgba(34,197,94,0.30)' : 'rgba(220,38,38,0.30)'}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#AAB0BD', marginBottom: '4px', fontWeight: 600 }}>הבדל (B מול A)</div>
          <div style={{
            fontSize: '26px', fontWeight: 700, fontFamily: 'system-ui', lineHeight: 1,
            color: !stats.hasMinSample ? '#AAB0BD' : stats.uplift > 0 ? '#22C55E' : '#EF4444',
          }}>
            {stats.hasMinSample ? `${stats.uplift > 0 ? '+' : ''}${stats.uplift.toFixed(1)}%` : '–'}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#AAB0BD', marginTop: '6px', lineHeight: 1.4 }}>
              סיכוי ש-B מנצח<br />
              <span style={{ fontWeight: 600, color: '#EDE9E1', fontFamily: 'system-ui' }}>
                {(stats.probBWins * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        <div style={{
          textAlign: 'center', padding: '16px 12px', borderRadius: '10px',
          background: winner === 'b' ? 'rgba(34,197,94,0.10)' : 'rgba(201,150,74,0.06)',
          border: winner === 'b' ? '1px solid rgba(34,197,94,0.40)' : '1px solid rgba(201,150,74,0.25)',
        }}>
          <div style={{ fontSize: '11px', color: '#E8B94A', marginBottom: '6px', fontWeight: 600 }}>גרסה B · שיעור המרה</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrB.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '6px' }}>
            {test.conversions_b.toLocaleString()} המרות מתוך {test.visitors_b.toLocaleString()}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#AAB0BD', marginTop: '4px', fontFamily: 'system-ui' }}>
              טווח אמת 95%: {(stats.ci_b[0] * 100).toFixed(1)}–{(stats.ci_b[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <ConfidenceMeter confidence={stats.hasMinSample ? stats.confidence : 0} />

      <ResultInterpretation
        hasMinSample={stats.hasMinSample}
        confidence={stats.confidence}
        uplift={stats.uplift}
        probBWins={stats.probBWins}
        visitorsA={test.visitors_a}
        visitorsB={test.visitors_b}
      />
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
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '2px' }}>
            יום {days} מתוך {proposal.days_to_significance} · {daysLeft > 0 ? `עוד ${daysLeft} ימים` : 'חרג מהזמן המוערך'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onPause}
            disabled={loading}
            style={{
              padding: '6px 12px', fontSize: '12px', borderRadius: '6px',
              border: '1px solid #2C323E', background: '#1D2430', color: '#EDE9E1',
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
              border: '1px solid rgba(220,38,38,0.30)', background: 'rgba(220,38,38,0.08)', color: '#EF4444',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            🛑 סיים ניסוי
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '14px', alignItems: 'stretch', marginBottom: '16px' }}>
        {/* Variant A */}
        <div style={{
          textAlign: 'center', padding: '16px 12px', borderRadius: '10px',
          background: winner === 'a' ? 'rgba(66,133,244,0.10)' : '#1D2430',
          border: winner === 'a' ? '1px solid rgba(66,133,244,0.40)' : '1px solid #2C323E',
        }}>
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginBottom: '6px', fontWeight: 600 }}>גרסה A · שיעור המרה</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrA.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '6px' }}>
            {proposal.conversions_a.toLocaleString()} המרות מתוך {proposal.visitors_a.toLocaleString()}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#AAB0BD', marginTop: '4px', fontFamily: 'system-ui' }}>
              טווח אמת 95%: {(stats.ci_a[0] * 100).toFixed(1)}-{(stats.ci_a[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Uplift */}
        <div style={{
          padding: '14px 18px', textAlign: 'center', borderRadius: '10px',
          background: !stats.hasMinSample ? '#1D2430' : stats.uplift > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(220,38,38,0.10)',
          border: `1px solid ${!stats.hasMinSample ? '#2C323E' : stats.uplift > 0 ? 'rgba(34,197,94,0.30)' : 'rgba(220,38,38,0.30)'}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#AAB0BD', marginBottom: '4px', fontWeight: 600 }}>הבדל (B מול A)</div>
          <div style={{
            fontSize: '26px', fontWeight: 700, fontFamily: 'system-ui', lineHeight: 1,
            color: !stats.hasMinSample ? '#AAB0BD' : stats.uplift > 0 ? '#22C55E' : '#EF4444',
          }}>
            {stats.hasMinSample ? `${stats.uplift > 0 ? '+' : ''}${stats.uplift.toFixed(1)}%` : '-'}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#AAB0BD', marginTop: '6px', lineHeight: 1.4 }}>
              סיכוי ש-B מנצח<br />
              <span style={{ fontWeight: 600, color: '#EDE9E1', fontFamily: 'system-ui' }}>
                {(stats.probBWins * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Variant B */}
        <div style={{
          textAlign: 'center', padding: '16px 12px', borderRadius: '10px',
          background: winner === 'b' ? 'rgba(34,197,94,0.10)' : 'rgba(201,150,74,0.06)',
          border: winner === 'b' ? '1px solid rgba(34,197,94,0.40)' : '1px solid rgba(201,150,74,0.25)',
        }}>
          <div style={{ fontSize: '11px', color: '#E8B94A', marginBottom: '6px', fontWeight: 600 }}>גרסה B · שיעור המרה</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#EDE9E1', fontFamily: 'system-ui', lineHeight: 1 }}>
            {cvrB.toFixed(2)}%
          </div>
          <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '6px' }}>
            {proposal.conversions_b.toLocaleString()} המרות מתוך {proposal.visitors_b.toLocaleString()}
          </div>
          {stats.hasMinSample && (
            <div style={{ fontSize: '10px', color: '#AAB0BD', marginTop: '4px', fontFamily: 'system-ui' }}>
              טווח אמת 95%: {(stats.ci_b[0] * 100).toFixed(1)}-{(stats.ci_b[1] * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Confidence meter */}
      <ConfidenceMeter confidence={stats.hasMinSample ? stats.confidence : 0} />

      <ResultInterpretation
        hasMinSample={stats.hasMinSample}
        confidence={stats.confidence}
        uplift={stats.uplift}
        probBWins={stats.probBWins}
        visitorsA={proposal.visitors_a}
        visitorsB={proposal.visitors_b}
      />
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

  // Sum every test that has actually concluded with B beating A: both the
  // AI-agent proposals (status=completed) AND the experiments-table tests
  // (status in concluded/completed). The earlier version only summed the
  // proposals path, so a 123.8% live-test win (e.g. challenge_hero_format)
  // didn't show up in the dashboard KPI.
  const concludedLiveB = liveTests
    .filter((t) => (t.status === 'concluded' || t.status === 'completed'))
    .map((t) => ({
      stats: bayesianStats(t.visitors_a, t.conversions_a, t.visitors_b, t.conversions_b),
    }))
    .filter(({ stats }) => stats.hasMinSample && stats.uplift > 0);

  const totalCumulativeUplift =
    completed
      .filter((p) => p.winner === 'b')
      .reduce((sum, p) => {
        const s = bayesianStats(p.visitors_a, p.conversions_a, p.visitors_b, p.conversions_b);
        return sum + (s.uplift > 0 ? s.uplift : 0);
      }, 0)
    + concludedLiveB.reduce((sum, { stats }) => sum + stats.uplift, 0);

  const hasAnyCompleted = completed.length > 0 || concludedLiveB.length > 0;

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

  // Split live experiments (from the `experiments` table) by status so the
  // page can lead with what's actively collecting data and demote what's
  // already concluded into a "past results" block.
  const liveRunning   = liveTests.filter((t) => t.status === 'running');
  const liveConcluded = liveTests.filter((t) => t.status === 'concluded' || t.status === 'completed' || t.status === 'paused');
  const totalRunning  = liveRunning.length + running.length;
  const totalDone     = liveConcluded.length + completed.length;

  // Recommendations collapsed by default — Alon asked for them to be
  // demoted below running + concluded since the active tests are what
  // need attention day-to-day.
  const [showProposals, setShowProposals] = useState(false);

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
        titleEn="Experiments"
        subtitle="קודם מה רץ עכשיו · אחר כך מה הסתיים · בסוף ההמלצות"
        actions={
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              padding: '8px 18px', fontSize: '13px', borderRadius: '8px',
              border: 'none', background: analyzing ? '#2C323E' : '#C9964A', color: '#fff',
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
        <KpiCard label="רצים עכשיו" value={totalRunning} icon="🔴" variant="success" />
        <KpiCard label="הסתיימו" value={totalDone} icon="✅" />
        <KpiCard
          label="Uplift מצטבר"
          value={hasAnyCompleted ? `+${totalCumulativeUplift.toFixed(1)}%` : '-'}
          icon="📈"
          variant={totalCumulativeUplift > 0 ? 'success' : 'default'}
        />
        <KpiCard label="הצעות ממתינות" value={proposed.length} icon="💡" variant="gold" />
      </KpiGrid>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: רצים עכשיו — top of page, biggest, full LiveTestCard     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{
        marginTop: '32px',
        marginBottom: '32px',
        padding: '20px 24px 24px',
        background: 'linear-gradient(180deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
              background: '#22C55E', boxShadow: '0 0 0 4px rgba(34,197,94,0.18)',
              animation: 'livePulse 2s ease-in-out infinite',
            }} />
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#EDE9E1' }}>
              רצים עכשיו
            </h2>
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
            {totalRunning} ניסויים פעילים
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '20px' }}>
          הניסויים האלה אוספים נתונים כרגע. הסטטיסטיקה מתעדכנת לפי visitor + conversion חדשים.
        </div>

        {totalRunning === 0 ? (
          <EmptyState
            icon="⚡"
            title="אין ניסויים רצים"
            description="אשר הצעה מהסוכן כדי להפעיל ניסוי חדש."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {liveRunning.map((t) => (
              <LiveTestCard key={t.id} test={t} />
            ))}
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
                        <div style={{ fontSize: '11px', color: '#AAB0BD', marginTop: '2px' }}>
                          {p.visitors_a} A · {p.visitors_b} B · {p.confidence.toFixed(0)}% confidence
                        </div>
                      </div>
                      <button
                        onClick={() => handleResume(p.id)}
                        disabled={loadingId === p.id}
                        style={{
                          padding: '6px 14px', fontSize: '12px', borderRadius: '6px',
                          border: 'none', background: '#C9964A', color: '#fff',
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: הסתיימו — concluded experiments + completed proposals    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#EDE9E1', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✅</span>
            הסתיימו
          </h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
            {totalDone} ניסויים
          </div>
        </div>

        {totalDone === 0 ? (
          <div style={{
            padding: '20px 24px',
            background: '#141820',
            border: '1px solid #2C323E',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#AAB0BD',
            textAlign: 'center',
          }}>
            עוד אין ניסויים שהסתיימו. אחרי שמסיימים ניסוי הוא יופיע כאן.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Concluded LiveTests — full card so the final numbers are obvious */}
            {liveConcluded.map((t) => (
              <LiveTestCard key={t.id} test={t} />
            ))}

            {/* Completed proposals — compact table */}
            {completed.length > 0 && (
              <SectionCard title="ניסויים שהושלמו (מהסוכן)" titleEn="Completed Proposals" noPadding>
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
                          <div style={{ fontSize: '11px', color: '#AAB0BD' }}>{p.page_or_element}</div>
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
                          color: stats.uplift > 0 ? '#22C55E' : stats.uplift < 0 ? '#EF4444' : '#AAB0BD',
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
                      duration: dur !== null ? <span style={{ fontSize: '12px', color: '#AAB0BD' }}>{dur} ימים</span> : '-',
                    };
                  })}
                  emptyMessage="אין ניסויים שהושלמו עדיין"
                />
              </SectionCard>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: הצעות הסוכן — collapsed by default, demoted to bottom    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div>
        <button
          onClick={() => setShowProposals((v) => !v)}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            background: '#141820',
            border: '1px solid #2C323E',
            borderRadius: '12px',
            color: '#EDE9E1',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}>💡</span>
            הצעות מהסוכן ({proposed.length})
          </span>
          <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 400 }}>
            {showProposals ? 'הסתר ←' : 'הצג ↓'}
          </span>
        </button>

        {showProposals && (
          <div style={{ marginTop: '14px' }}>
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
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.88); }
        }
      `}</style>
    </div>
  );
}
