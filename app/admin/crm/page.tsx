'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  leads_today: number;
  sales_this_month: number;
  pending_action: number;
  conversion_rate: number;
}

interface PipelineUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  hive_status: string | null;
  created_at: string;
  last_activity_at: string | null;
  utm_source: string | null;
  purchase_count: number;
  total_spent: number;
}

interface Reminder {
  id: string;
  user_id: string | null;
  assigned_to: string;
  task: string;
  due_at: string;
  completed_at: string | null;
  created_at: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return 'עכשיו';
  if (mins < 60)  return `לפני ${mins} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days < 30)  return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString('he-IL');
}

function formatPrice(n: number): string {
  return '₪' + n.toLocaleString('he-IL');
}

const STATUS_LABELS: Record<string, string> = {
  lead: 'ליד',
  engaged: 'מעורב',
  high_intent: 'כוונה גבוהה',
  buyer: 'קונה',
  booked: 'פגישה',
  premium_lead: 'פרמיום',
  partnership_lead: 'שותפות',
};

const STATUS_COLORS: Record<string, string> = {
  lead: '#9E9990',
  engaged: '#4285F4',
  high_intent: '#C9964A',
  buyer: '#34A853',
  booked: '#34A853',
  premium_lead: '#E8B94A',
  partnership_lead: '#E8B94A',
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#9E9990';
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 9999,
      fontSize: 12,
      fontWeight: 700,
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
    }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Tab: Dashboard ────────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [recent, setRecent] = useState<PipelineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/admin/pipeline?limit=10').then(r => r.json()).catch(() => ({ users: [] })),
    ]).then(([s, p]) => {
      setStats({
        leads_today:      s?.leads_today      ?? 0,
        sales_this_month: s?.sales_this_month ?? 0,
        pending_action:   s?.pending_action   ?? 0,
        conversion_rate:  s?.conversion_rate  ?? 0,
      });
      setRecent(p?.users ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const kpis = stats ? [
    { label: 'לידים היום',      value: String(stats.leads_today ?? 0),                               color: '#4285F4' },
    { label: 'מכירות החודש',    value: '₪' + (stats.sales_this_month ?? 0).toLocaleString('he-IL'), color: '#34A853' },
    { label: 'ממתינים לטיפול', value: String(stats.pending_action ?? 0),                             color: '#EA4335' },
    { label: 'שיעור המרה',     value: (stats.conversion_rate ?? 0).toFixed(1) + '%',                color: '#C9964A' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {loading
          ? [1,2,3,4].map(i => <div key={i} style={cardStyle} />)
          : kpis.map(k => (
            <div key={k.label} style={{ ...cardStyle, borderTop: `3px solid ${k.color}` }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 13, color: '#9E9990', marginTop: 6 }}>{k.label}</div>
            </div>
          ))
        }
      </div>

      {/* Recent activity */}
      <div style={cardStyle}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#EDE9E1', marginBottom: 16 }}>פעילות אחרונה</div>
        {loading && <div style={{ color: '#9E9990', fontSize: 13 }}>טוען...</div>}
        {recent.map(u => (
          <Link key={u.id} href={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid #2C323E',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#EDE9E1' }}>{u.name ?? u.email}</span>
                <span style={{ fontSize: 12, color: '#9E9990' }}>{u.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StatusBadge status={u.status} />
                <span style={{ fontSize: 12, color: '#9E9990' }}>{relativeTime(u.created_at)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Pipeline ─────────────────────────────────────────────────────────────

const FILTER_BUTTONS = [
  { label: 'הכל',          value: '' },
  { label: 'ליד',          value: 'lead' },
  { label: 'מעורב',        value: 'engaged' },
  { label: 'כוונה גבוהה', value: 'high_intent' },
  { label: 'קונה',         value: 'buyer' },
  { label: 'פרמיום',      value: 'premium_lead' },
];

function PipelineTab() {
  const [users, setUsers]   = useState<PipelineUser[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery]   = useState('');  // debounced search

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '50' });
    if (status) params.set('status', status);
    if (query)  params.set('search', query);
    fetch(`/api/admin/pipeline?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setTotal(d.total ?? 0); })
      .finally(() => setLoading(false));
  }, [status, query]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search */}
      <input
        type="text"
        placeholder="חיפוש לפי שם, אימייל, טלפון..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          background: '#1D2430', border: '1px solid #2C323E',
          color: '#EDE9E1', fontSize: 14, outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {FILTER_BUTTONS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            style={{
              padding: '6px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: status === f.value ? '#C9964A' : '#1D2430',
              color: status === f.value ? '#1A1206' : '#9E9990',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: '#9E9990' }}>
        {loading ? 'טוען...' : `${total.toLocaleString()} תוצאות`}
      </div>

      {/* User list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.map(u => (
          <Link key={u.id} href={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, padding: '14px 18px',
              transition: 'border-color 0.15s',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#EDE9E1', marginBottom: 2 }}>
                  {u.name ?? '—'}
                </div>
                <div style={{ fontSize: 12, color: '#9E9990', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <StatusBadge status={u.status} />
                {u.total_spent > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#34A853' }}>{formatPrice(u.total_spent)}</span>
                )}
                <span style={{ fontSize: 11, color: '#9E9990' }}>{relativeTime(u.last_activity_at)}</span>
              </div>
            </div>
          </Link>
        ))}
        {!loading && users.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', color: '#9E9990', padding: 32 }}>אין תוצאות</div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Reminders ────────────────────────────────────────────────────────────

function RemindersTab() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading]     = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  // New reminder form state
  const [newTask, setNewTask]         = useState('');
  const [newDue, setNewDue]           = useState('');
  const [newAssigned, setNewAssigned] = useState('הדר');
  const [saving, setSaving]           = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/reminders?completed=false')
      .then(r => r.json())
      .then(d => setReminders(d.reminders ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markDone(id: string) {
    setCompleting(id);
    await fetch('/api/admin/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed_at: new Date().toISOString() }),
    });
    setReminders(prev => prev.filter(r => r.id !== id));
    setCompleting(null);
  }

  async function addReminder() {
    if (!newTask || !newDue) return;
    setSaving(true);
    const res = await fetch('/api/admin/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: newAssigned, task: newTask, due_at: new Date(newDue).toISOString() }),
    });
    const data = await res.json();
    if (data.reminder) {
      setReminders(prev => [data.reminder, ...prev]);
      setNewTask(''); setNewDue(''); setShowForm(false);
    }
    setSaving(false);
  }

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const overdue  = reminders.filter(r => new Date(r.due_at) < now);
  const today    = reminders.filter(r => new Date(r.due_at) >= now && new Date(r.due_at) < endOfToday);
  const upcoming = reminders.filter(r => new Date(r.due_at) >= endOfToday);

  function ReminderGroup({ title, items, color }: { title: string; items: Reminder[]; color: string }) {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 10, textTransform: 'uppercase' }}>
          {title} ({items.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(r => (
            <div key={r.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRight: `3px solid ${color}` }}>
              <button
                onClick={() => markDone(r.id)}
                disabled={completing === r.id}
                style={{
                  width: 22, height: 22, borderRadius: 6, border: `2px solid ${color}`,
                  background: 'transparent', cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color, fontSize: 14, fontWeight: 700,
                }}
              >
                {completing === r.id ? '...' : ''}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: '#EDE9E1', fontWeight: 600 }}>{r.task}</div>
                <div style={{ fontSize: 12, color: '#9E9990', marginTop: 2 }}>
                  {new Date(r.due_at).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {r.assigned_to && <span style={{ marginRight: 8 }}>· {r.assigned_to}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#9E9990' }}>
          {loading ? 'טוען...' : `${reminders.length} תזכורות פתוחות`}
        </span>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{
            padding: '8px 20px', borderRadius: 9999, fontSize: 13, fontWeight: 700,
            background: '#C9964A', color: '#1A1206', border: 'none', cursor: 'pointer',
          }}
        >
          + תזכורת חדשה
        </button>
      </div>

      {/* New reminder form */}
      {showForm && (
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#EDE9E1' }}>תזכורת חדשה</div>
          <input
            type="text"
            placeholder="תיאור המשימה..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            style={inputStyle}
          />
          <input
            type="datetime-local"
            value={newDue}
            onChange={e => setNewDue(e.target.value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="אחראי"
            value={newAssigned}
            onChange={e => setNewAssigned(e.target.value)}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={addReminder}
              disabled={saving || !newTask || !newDue}
              style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                background: '#C9964A', color: '#1A1206', border: 'none', cursor: 'pointer',
                opacity: saving || !newTask || !newDue ? 0.5 : 1,
              }}
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#1D2430', color: '#9E9990', border: '1px solid #2C323E', cursor: 'pointer',
              }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Grouped reminders */}
      <ReminderGroup title="באיחור"   items={overdue}  color="#EA4335" />
      <ReminderGroup title="היום"     items={today}    color="#C9964A" />
      <ReminderGroup title="בקרוב"   items={upcoming} color="#9E9990" />

      {!loading && reminders.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#9E9990', padding: 40 }}>
          אין תזכורות פתוחות 🎉
        </div>
      )}
    </div>
  );
}

// ── Quiz Distribution ─────────────────────────────────────────────────────────

const PRODUCT_LABELS: Record<string, string> = {
  free_training: 'הדרכה חינמית',
  challenge:     'אתגר 7 ימים',
  workshop:      'סדנה יום אחד',
  course:        'קורס דיגיטלי',
  strategy:      'פגישת אסטרטגיה',
  premium:       'יום צילום פרמיום',
  partnership:   'שותפות אסטרטגית',
};

const PRODUCT_COLORS: Record<string, string> = {
  free_training: '#4285F4',
  challenge:     '#34A853',
  workshop:      '#FBBC05',
  course:        '#C9964A',
  strategy:      '#E8B94A',
  premium:       '#EA4335',
  partnership:   '#9C27B0',
};

interface QuizRow { product: string; count: number; percent: number; }

function PieChart({ rows }: { rows: QuizRow[] }) {
  const size = 200;
  const r = 78;
  const cx = size / 2;
  const cy = size / 2;

  let cumulative = 0;
  const slices = rows.map(row => {
    const startAngle = cumulative;
    const angle = (row.percent / 100) * 360;
    cumulative += angle;
    return { ...row, startAngle, angle };
  });

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function slicePath(startAngle: number, angle: number) {
    if (angle >= 359.99) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r} Z`;
    }
    const start = polarToXY(startAngle, r);
    const end   = polarToXY(startAngle + angle, r);
    const large = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {slices.map(s => (
        <path
          key={s.product}
          d={slicePath(s.startAngle, s.angle)}
          fill={PRODUCT_COLORS[s.product] ?? '#9E9990'}
          stroke="#141820"
          strokeWidth={2}
        />
      ))}
      {/* Centre hole */}
      <circle cx={cx} cy={cy} r={40} fill="#141820" />
    </svg>
  );
}

function QuizDistribution() {
  const [total, setTotal]   = useState<number | null>(null);
  const [rows, setRows]     = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/quiz-stats')
      .then(r => r.json())
      .then(d => { setTotal(d.total ?? 0); setRows(d.distribution ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ ...cardStyle, color: '#9E9990', fontSize: 13 }}>טוען התפלגות קוויז...</div>
  );
  if (!rows.length) return null;

  return (
    <div style={{ ...cardStyle, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#EDE9E1' }}>התפלגות תוצאות קוויז</div>
        <div style={{ fontSize: 13, color: '#9E9990' }}>{total?.toLocaleString()} מילאו</div>
      </div>

      {/* Pie + bars side by side */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <PieChart rows={rows} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(r => {
            const color = PRODUCT_COLORS[r.product] ?? '#9E9990';
            const label = PRODUCT_LABELS[r.product] ?? r.product;
            return (
              <div key={r.product}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#EDE9E1' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                    {label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>
                    {r.count.toLocaleString()} · {r.percent}%
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 9999, background: '#1D2430', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${r.percent}%`,
                    borderRadius: 9999,
                    background: color,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: '#141820',
  border: '1px solid #2C323E',
  borderRadius: 12,
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  background: '#1D2430', border: '1px solid #2C323E',
  color: '#EDE9E1', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',  label: 'דאשבורד' },
  { id: 'pipeline',   label: 'פייפליין' },
  { id: 'reminders',  label: 'תזכורות' },
] as const;
type TabId = typeof TABS[number]['id'];

export default function CrmPage() {
  const [tab, setTab] = useState<TabId>('dashboard');

  return (
    <div dir="rtl" style={{ fontFamily: 'var(--font-assistant), Assistant, sans-serif', minHeight: '100vh', background: '#0D1018', padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#EDE9E1' }}>CRM</div>
        <div style={{ fontSize: 13, color: '#9E9990', marginTop: 2 }}>ניהול לקוחות ותהליכי מכירה</div>
      </div>

      {/* Quiz distribution */}
      <QuizDistribution />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #2C323E', marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#C9964A' : '#9E9990',
              borderBottom: tab === t.id ? '2px solid #C9964A' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard'  && <DashboardTab />}
      {tab === 'pipeline'   && <PipelineTab />}
      {tab === 'reminders'  && <RemindersTab />}
    </div>
  );
}
