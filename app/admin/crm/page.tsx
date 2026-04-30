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
  quiz_product: string | null;
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
                {u.quiz_product && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: PRODUCT_COLORS[u.quiz_product] ?? '#9E9990',
                    background: (PRODUCT_COLORS[u.quiz_product] ?? '#9E9990') + '18',
                    border: `1px solid ${(PRODUCT_COLORS[u.quiz_product] ?? '#9E9990')}33`,
                    borderRadius: 6, padding: '2px 8px',
                  }}>
                    🎯 {PRODUCT_LABELS[u.quiz_product] ?? u.quiz_product}
                  </span>
                )}
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

interface QuizRow { product: string; count: number; percent: number; }

function PieChart({ rows }: { rows: QuizRow[] }) {
  const size = 300;
  const r = 118;
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
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
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
      <circle cx={cx} cy={cy} r={58} fill="#141820" />
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
          <div style={{ width: '100%', maxWidth: 200 }}>
            <PieChart rows={rows} />
          </div>
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

// ── Tab: Priority Leads ───────────────────────────────────────────────────────

interface PriorityLead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  quiz_product: string | null;
  match_percent: number | null;
  priority: number;
}

const PRIORITY_TIERS = [
  { product: 'partnership', label: 'שותפות אסטרטגית', color: '#9C27B0' },
  { product: 'premium',     label: 'יום צילום פרמיום', color: '#EA4335' },
  { product: 'strategy',    label: 'פגישת אסטרטגיה',  color: '#E8B94A' },
  { product: 'course',      label: 'קורס דיגיטלי',    color: '#C9964A' },
];

// Diagnosis popup uses these to render product names
const DIAG_PRODUCT_NAMES: Record<string, string> = {
  challenge_197:  "צ'אלנג' 7 ימים",
  workshop_1080:  'סדנה יום אחד',
  course_1800:    'קורס דיגיטלי',
  strategy_4000:  'פגישת אסטרטגיה',
  premium_14000:  'יום צילום פרמיום',
};

// ── Diagnosis Popup ───────────────────────────────────────────────────────────

interface DiagMatch {
  product_key: string;
  match_pct: number;
  recommendation: 'yes' | 'maybe_later' | 'no';
  reason: string;
}
interface DiagData {
  synthesis: string;
  product_matches: DiagMatch[];
  suggested_whatsapp: string;
  generated_at?: string;
}

function DiagnosisPopup({ lead, onClose }: { lead: PriorityLead; onClose: () => void }) {
  const [data, setData]       = useState<DiagData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    async function run() {
      // Check cache first
      try {
        const cache = await fetch(`/api/admin/truesignal-diagnosis?userId=${lead.id}`).then(r => r.json());
        if (cache.cached) {
          setData({ synthesis: cache.synthesis, product_matches: cache.product_matches, suggested_whatsapp: cache.suggested_whatsapp, generated_at: cache.generated_at });
          setLoading(false);
          return;
        }
      } catch { /* fall through to fresh run */ }

      // Auto-run fresh diagnosis
      try {
        const res  = await fetch('/api/admin/truesignal-diagnosis', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: lead.id }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? 'ניתוח נכשל');
        setData({ synthesis: d.synthesis, product_matches: d.product_matches, suggested_whatsapp: d.suggested_whatsapp, generated_at: d.generated_at });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'שגיאה');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [lead.id]);

  async function copyWA() {
    if (!data) return;
    await navigator.clipboard.writeText(data.suggested_whatsapp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const REC: Record<string, { color: string; icon: string; border: string; bg: string }> = {
    yes:         { color: '#4ade80', icon: '✓', border: 'rgba(74,222,128,0.3)',  bg: 'rgba(74,222,128,0.05)' },
    maybe_later: { color: '#fbbf24', icon: '~', border: '#2C323E',               bg: 'transparent' },
    no:          { color: '#f87171', icon: '✗', border: '#2C323E',               bg: 'transparent' },
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,12,20,0.88)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        dir="rtl"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#141820', border: '1px solid #2C323E', borderRadius: 16,
          width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
          padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#EDE9E1' }}>{lead.name ?? lead.email}</div>
            <div style={{ fontSize: 12, color: '#9E9990', marginTop: 3 }}>{lead.email}</div>
            <div style={{ fontSize: 13, color: '#E8B94A', marginTop: 6, fontWeight: 700 }}>
              ✦ תיק אבחון <span dir="ltr" style={{ unicodeBidi: 'embed' }}>TrueSignal©</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <Link href={`/admin/users/${lead.id}`} style={{
              fontSize: 12, color: '#9E9990', textDecoration: 'none',
              padding: '5px 10px', borderRadius: 7, border: '1px solid #2C323E',
            }}>
              פרופיל מלא ↗
            </Link>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: '#9E9990',
              fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            }}>×</button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              border: '2px solid rgba(232,185,74,0.2)', borderTopColor: '#E8B94A',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: 14, color: '#9E9990' }}>מנתח את הליד...</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>זה עשוי לקחת כ-15 שניות</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <>
            {/* Synthesis */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E7C3A', letterSpacing: '0.07em', marginBottom: 10, textTransform: 'uppercase' }}>Synthesis</div>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: '#EDE9E1', margin: 0, borderRight: '2px solid rgba(232,185,74,0.4)', paddingRight: 14 }}>
                {data.synthesis}
              </p>
            </div>

            {/* Product matches */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E7C3A', letterSpacing: '0.07em', marginBottom: 10, textTransform: 'uppercase' }}>התאמת מוצר</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.product_matches.map(pm => {
                  const s = REC[pm.recommendation] ?? REC.maybe_later;
                  return (
                    <div key={pm.product_key} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: `1px solid ${s.border}`, background: s.bg,
                      borderRadius: 8, padding: '9px 12px',
                    }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: s.color, width: 46, textAlign: 'center', flexShrink: 0 }}>
                        {pm.match_pct}%
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#EDE9E1' }}>
                          {DIAG_PRODUCT_NAMES[pm.product_key] ?? pm.product_key}
                        </div>
                        <div style={{ fontSize: 12, color: '#9E9990', marginTop: 2, lineHeight: 1.4 }}>{pm.reason}</div>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>
                        {s.icon}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WhatsApp opener */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9E7C3A', letterSpacing: '0.07em', marginBottom: 10, textTransform: 'uppercase' }}>פתיחת שיחה בוואטסאפ</div>
              <div style={{ position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid #2C323E', padding: '12px 14px' }}>
                <button onClick={copyWA} style={{
                  position: 'absolute', top: 8, left: 10,
                  background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(44,50,62,0.8)',
                  color: copied ? '#4ade80' : '#9E9990',
                  border: `1px solid ${copied ? 'rgba(74,222,128,0.4)' : '#2C323E'}`,
                  borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                }}>
                  {copied ? 'הועתק ✓' : 'העתק'}
                </button>
                <p style={{ fontSize: 13, lineHeight: 1.8, color: '#EDE9E1', margin: 0, paddingLeft: 60, whiteSpace: 'pre-wrap' }}>
                  {data.suggested_whatsapp}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Lead Card ─────────────────────────────────────────────────────────────────

function PriorityLeadCard({ lead, onAnalyze }: { lead: PriorityLead; onAnalyze: () => void }) {
  const tierColor  = PRIORITY_TIERS.find(t => t.product === lead.quiz_product)?.color ?? '#9E9990';
  const showAnalyze = lead.priority >= 2; // strategy / premium / partnership

  return (
    <div style={{ position: 'relative' }}>
      <Link href={`/admin/users/${lead.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          ...cardStyle,
          borderRight: `3px solid ${tierColor}`,
          padding: '14px 18px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
          cursor: 'pointer', transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1D2430')}
          onMouseLeave={e => (e.currentTarget.style.background = '#141820')}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#EDE9E1' }}>{lead.name ?? '—'}</span>
              <StatusBadge status={lead.status} />
              {lead.match_percent != null && (
                <span style={{
                  fontSize: 11, fontWeight: 700, color: tierColor,
                  background: tierColor + '18', border: `1px solid ${tierColor}33`,
                  borderRadius: 6, padding: '1px 7px',
                }}>
                  {lead.match_percent}% התאמה
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: '#9E9990', marginBottom: 2 }}>{lead.email}</div>
            <div style={{ fontSize: 12, color: '#9E9990' }}>{relativeTime(lead.created_at)}</div>
          </div>
          {/* Spacer to keep content away from action buttons */}
          <div style={{ width: showAnalyze ? 240 : (lead.phone ? 150 : 60), flexShrink: 0 }} />
        </div>
      </Link>

      {/* Action buttons — absolutely positioned, outside Link */}
      <div style={{
        position: 'absolute', top: '50%', left: 18, transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start',
      }}>
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 11px', borderRadius: 7, fontSize: 13, fontWeight: 700,
              background: '#1D2430', border: '1px solid #2C323E',
              color: '#34A853', textDecoration: 'none',
            }}
          >
            📞 {lead.phone}
          </a>
        )}
        {showAnalyze && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onAnalyze(); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg, #E8B94A, #C9964A)',
              color: '#1A1206', border: 'none', cursor: 'pointer',
            }}
          >
            ✦ קבל ניתוח
          </button>
        )}
        {!lead.phone && !showAnalyze && (
          <span style={{ fontSize: 12, color: '#9E9990' }}>אין טלפון</span>
        )}
      </div>
    </div>
  );
}

// ── Priority Leads Tab ────────────────────────────────────────────────────────

function PriorityLeadsTab() {
  const [leads, setLeads]       = useState<PriorityLead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeLead, setActive] = useState<PriorityLead | null>(null);

  useEffect(() => {
    fetch('/api/admin/priority-leads')
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ ...cardStyle, color: '#9E9990', fontSize: 13 }}>טוען לידים...</div>;
  }

  if (leads.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', color: '#9E9990', padding: 40 }}>
        אין לידים בעדיפות גבוהה
      </div>
    );
  }

  return (
    <>
      {activeLead && (
        <DiagnosisPopup lead={activeLead} onClose={() => setActive(null)} />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 13, color: '#9E9990' }}>{leads.length} לידים לטיפול</div>

        {PRIORITY_TIERS.map(tier => {
          const tierLeads = leads.filter(l => l.quiz_product === tier.product);
          if (tierLeads.length === 0) return null;
          return (
            <div key={tier.product}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: tier.color, letterSpacing: '0.05em' }}>
                  {tier.label.toUpperCase()} · {tierLeads.length}
                </span>
                <div style={{ flex: 1, height: 1, background: tier.color + '33' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tierLeads.map(l => (
                  <PriorityLeadCard key={l.id} lead={l} onAnalyze={() => setActive(l)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
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
  { id: 'priority',   label: 'עדיפות 🔥' },
  { id: 'dashboard',  label: 'דאשבורד' },
  { id: 'pipeline',   label: 'פייפליין' },
  { id: 'reminders',  label: 'תזכורות' },
] as const;
type TabId = typeof TABS[number]['id'];

export default function CrmPage() {
  const [tab, setTab] = useState<TabId>('priority');

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
      {tab === 'priority'   && <PriorityLeadsTab />}
      {tab === 'dashboard'  && <DashboardTab />}
      {tab === 'pipeline'   && <PipelineTab />}
      {tab === 'reminders'  && <RemindersTab />}
    </div>
  );
}
