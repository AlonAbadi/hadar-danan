'use client';

import { useMemo, useState } from "react";
import Link from "next/link";

export type CallListRow = {
  sent_on:      string;
  user_id:      string;
  score:        number;
  reasons:      string[];
  brief:        { opening: string; talkingPoints: string[]; risk?: string } | null;
  outcome:      string | null;
  outcome_at:   string | null;
  outcome_by:   string | null;
  outcome_note: string | null;
  user: {
    id:     string;
    name:   string | null;
    email:  string;
    phone:  string;
    status: string;
  };
};

export type DayGroup = {
  sent_on: string;
  rows:    CallListRow[];
  counts:  { handled: number; not_relevant: number; booked: number; pending: number };
};

const COLOR = {
  bg:        '#0D1018',
  card:      '#141820',
  cardSoft:  '#1D2430',
  border:    '#2C323E',
  fg:        '#EDE9E1',
  fgMuted:   '#AAB0BD',
  gold:      '#C9964A',
  goldLight: '#E8B94A',
  green:     '#25D366',
  red:       '#E07A6A',
  blue:      '#2F80ED',
};

const STATUS_LABEL: Record<string, string> = {
  lead:             'ליד',
  engaged:          'מעורב',
  high_intent:      'כוונה גבוהה',
  buyer:            'קונה',
  booked:           'נסגר',
  handled:          'טופל',
  not_relevant:     'לא רלוונטי',
  premium_lead:     'ליד פרמיום',
  partnership_lead: 'ליד שותפות',
};

const OUTCOME_LABEL: Record<string, string> = {
  handled:      'טופל',
  not_relevant: 'לא רלוונטי',
  booked:       'נסגר',
};

const OUTCOME_COLOR: Record<string, string> = {
  handled:      '#AAB0BD',
  not_relevant: '#E07A6A',
  booked:       '#3FBF7F',
};

function toWa(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('972')) return d;
  if (d.startsWith('0')) return '972' + d.slice(1);
  return d;
}

function formatHebrewDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    weekday:  'long',
    day:      'numeric',
    month:    'long',
    year:     'numeric',
  }).format(d);
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.round(ms / 60000);
  if (m < 1)  return 'עכשיו';
  if (m < 60) return `לפני ${m} ד׳`;
  const h = Math.round(m / 60);
  if (h < 24) return `לפני ${h} שעות`;
  const d = Math.round(h / 24);
  return `לפני ${d} ימים`;
}

function isToday(sent_on: string): boolean {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  return sent_on === today;
}

type Props = { groups: DayGroup[] };

export default function CallListClient({ groups }: Props) {
  const today = groups.find(g => isToday(g.sent_on));
  const past  = groups.filter(g => !isToday(g.sent_on));

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 16px 64px', color: COLOR.fg }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: COLOR.fg }}>רשימת חיוגים</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: 13, color: COLOR.fgMuted }}>
          5 עד 10 לידים שמומלץ להתקשר אליהם, נשלחים לאימייל כל בוקר ב 09:00 (א-ה).
          סמן כאן את התוצאה של כל שיחה כדי שהליד לא יחזור ברשימת המחר.
        </p>
      </div>

      {today ? (
        <DayBlock group={today} defaultOpen />
      ) : (
        <div style={{
          background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: 12,
          padding: '24px 20px', marginBottom: 24, color: COLOR.fgMuted, fontSize: 14,
        }}>
          אין רשימה להיום עדיין. תרוץ אוטומטית ב 09:00 בבוקר.
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: COLOR.fgMuted, margin: '32px 0 12px 0', letterSpacing: 1 }}>
            היסטוריה
          </h2>
          {past.map(g => <DayBlock key={g.sent_on} group={g} />)}
        </>
      )}
    </div>
  );
}

function DayBlock({ group, defaultOpen }: { group: DayGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [rows, setRows] = useState(group.rows);
  const counts = useMemo(() => {
    const c = { handled: 0, not_relevant: 0, booked: 0, pending: 0 };
    for (const r of rows) {
      if      (r.outcome === 'handled')      c.handled++;
      else if (r.outcome === 'not_relevant') c.not_relevant++;
      else if (r.outcome === 'booked')       c.booked++;
      else                                   c.pending++;
    }
    return c;
  }, [rows]);

  const onOutcome = (row: CallListRow, outcome: string) => {
    setRows(prev => prev.map(r =>
      r.user_id === row.user_id && r.sent_on === row.sent_on
        ? { ...r, outcome, outcome_at: new Date().toISOString(), outcome_by: 'me',
            user: { ...r.user, status: outcome } }
        : r
    ));
  };

  return (
    <div style={{
      background: COLOR.card, border: `1px solid ${COLOR.border}`, borderRadius: 12,
      marginBottom: 16, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'right', background: 'transparent', border: 0,
          padding: '14px 18px', cursor: 'pointer', color: COLOR.fg,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{formatHebrewDate(group.sent_on)}</div>
          <div style={{ fontSize: 12, color: COLOR.fgMuted, marginTop: 2 }}>
            {rows.length} לידים
            {counts.booked      > 0 && ` · ${counts.booked} סגירות`}
            {counts.handled     > 0 && ` · ${counts.handled} טופלו`}
            {counts.not_relevant > 0 && ` · ${counts.not_relevant} לא רלוונטי`}
            {counts.pending     > 0 && ` · ${counts.pending} ממתינים`}
          </div>
        </div>
        <span style={{ fontSize: 18, color: COLOR.fgMuted, transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>‹</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 18px 18px' }}>
          {rows.map((r, i) => (
            <LeadCard key={r.user_id + r.sent_on} row={r} index={i} onOutcome={onOutcome} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({ row, index, onOutcome }: {
  row: CallListRow;
  index: number;
  onOutcome: (row: CallListRow, outcome: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err,  setErr]  = useState<string | null>(null);
  const decided = !!row.outcome;
  const wa = toWa(row.user.phone || '');

  const submit = async (outcome: string) => {
    setBusy(outcome);
    setErr(null);
    try {
      const res = await fetch('/api/admin/call-list/outcome', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sent_on: row.sent_on, user_id: row.user_id, outcome }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'שגיאה');
      }
      onOutcome(row, outcome);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{
      background: COLOR.cardSoft, border: `1px solid ${COLOR.border}`, borderRadius: 10,
      padding: '16px 18px', marginTop: index === 0 ? 0 : 12, opacity: decided ? 0.78 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: COLOR.fg, marginBottom: 4 }}>
            <span style={{
              display: 'inline-block', background: 'linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)',
              color: '#0D1018', fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, marginLeft: 8,
            }}>{index + 1}</span>
            {row.user.name ?? 'ללא שם'}
          </div>
          <div style={{ fontSize: 12, color: COLOR.fgMuted }}>
            סטטוס: {STATUS_LABEL[row.user.status] ?? row.user.status} · ציון: {Math.round(row.score)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {row.user.phone && (
            <a href={`tel:${row.user.phone}`} style={{
              fontSize: 14, fontWeight: 700, color: COLOR.goldLight, textDecoration: 'none',
              direction: 'ltr', background: COLOR.bg, padding: '7px 12px', borderRadius: 8,
              border: `1px solid ${COLOR.gold}`,
            }}>📞 {row.user.phone}</a>
          )}
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" style={{
              fontSize: 13, fontWeight: 700, color: '#0D1018', textDecoration: 'none',
              background: COLOR.green, padding: '7px 12px', borderRadius: 8,
            }}>💬 וואטסאפ</a>
          )}
          <Link href={`/admin/users/${row.user_id}`} style={{
            fontSize: 13, fontWeight: 600, color: COLOR.gold, textDecoration: 'none',
            background: COLOR.bg, padding: '7px 12px', borderRadius: 8, border: `1px solid ${COLOR.border}`,
          }}>CRM ←</Link>
        </div>
      </div>

      {row.reasons.length > 0 && (
        <>
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: COLOR.gold, marginBottom: 4 }}>למה היום</div>
          <ul style={{ margin: 0, padding: '0 18px 0 0', color: COLOR.fg, fontSize: 13, lineHeight: 1.7 }}>
            {row.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </>
      )}

      {row.brief?.opening && (
        <>
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: COLOR.gold, marginBottom: 4 }}>פתיח מוצע</div>
          <div style={{
            background: COLOR.bg, borderRight: `3px solid ${COLOR.gold}`, padding: '10px 14px',
            borderRadius: 4, fontSize: 14, color: COLOR.fg, lineHeight: 1.6, fontStyle: 'italic',
          }}>{row.brief.opening}</div>
        </>
      )}

      {row.brief && row.brief.talkingPoints.length > 0 && (
        <>
          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 700, color: COLOR.gold, marginBottom: 4 }}>נקודות שיחה</div>
          <ul style={{ margin: 0, padding: '0 18px 0 0', color: COLOR.fg, fontSize: 13, lineHeight: 1.7 }}>
            {row.brief.talkingPoints.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </>
      )}

      {row.brief?.risk && (
        <div style={{
          marginTop: 12, padding: '8px 12px', background: 'rgba(224,122,106,0.12)',
          border: `1px solid ${COLOR.red}`, borderRadius: 6, fontSize: 12, color: COLOR.red,
        }}>⚠ {row.brief.risk}</div>
      )}

      <div style={{
        marginTop: 16, paddingTop: 12, borderTop: `1px solid ${COLOR.border}`,
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {decided ? (
          <div style={{ fontSize: 13, color: OUTCOME_COLOR[row.outcome!] ?? COLOR.fgMuted, fontWeight: 700 }}>
            ✓ {OUTCOME_LABEL[row.outcome!] ?? row.outcome}
            {row.outcome_at && <span style={{ color: COLOR.fgMuted, fontWeight: 400, marginRight: 8 }}>· {relTime(row.outcome_at)}</span>}
            {row.outcome_by && <span style={{ color: COLOR.fgMuted, fontWeight: 400, marginRight: 8 }}>· {row.outcome_by}</span>}
          </div>
        ) : (
          <>
            <span style={{ fontSize: 12, color: COLOR.fgMuted, marginLeft: 4 }}>אחרי השיחה:</span>
            <OutcomeBtn label="✅ נסגר"      onClick={() => submit('booked')}       busy={busy === 'booked'}      color="#3FBF7F" />
            <OutcomeBtn label="טופל"          onClick={() => submit('handled')}      busy={busy === 'handled'}     color={COLOR.fgMuted} />
            <OutcomeBtn label="לא רלוונטי"    onClick={() => submit('not_relevant')} busy={busy === 'not_relevant'} color={COLOR.red} />
            {err && <span style={{ fontSize: 12, color: COLOR.red, marginRight: 8 }}>{err}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function OutcomeBtn({ label, onClick, busy, color }: {
  label: string; onClick: () => void; busy: boolean; color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        background: 'transparent', border: `1px solid ${color}`, color,
        padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600,
        cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1,
      }}
    >{busy ? '...' : label}</button>
  );
}
