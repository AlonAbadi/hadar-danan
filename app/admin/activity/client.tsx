'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader, KpiCard, KpiGrid, SectionCard, Badge } from '@/components/admin/ui';
import type { ActivityReport, UserActivity } from '@/lib/admin/activity';

const TIER_LABELS: Record<UserActivity['tier'], string> = {
  hot: '🔥 חם',
  active: 'פעיל',
  occasional: 'מזדמן',
  dormant: 'רדום',
};
const TIER_BADGE: Record<UserActivity['tier'], 'gold' | 'success' | 'info' | 'default'> = {
  hot: 'gold',
  active: 'success',
  occasional: 'info',
  dormant: 'default',
};

const PAGE_LABELS: Record<string, string> = {
  '/': 'דף הבית',
  '/signal': 'מנוע האות',
  '/quiz': 'קוויז',
  '/challenge': 'אתגר',
  '/training': 'הדרכה',
  '/training/watch': 'צפייה בהדרכה',
  '/course': 'קורס',
  '/workshop': 'סדנה',
  '/strategy': 'אסטרטגיה',
  '/hive': 'הכוורת',
  '/account': 'אזור אישי',
  '/kaveret': 'כוורת האות',
};

function relativeTime(iso: string | null): string {
  if (!iso) return 'ללא פעילות';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `לפני ${Math.max(mins, 1)} דק׳`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'אתמול';
  if (days < 30) return `לפני ${days} ימים`;
  const months = Math.floor(days / 30);
  return `לפני ${months} חוד׳`;
}

function formatMinutes(min: number): string {
  if (min < 1) return 'פחות מדקה';
  if (min < 60) return `${min} דק׳`;
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} שע׳`;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? '#E8B94A' : score >= 40 ? '#34A853' : score >= 15 ? '#4285F4' : '#5B6270';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
      <span style={{ fontWeight: 800, color, fontSize: 14, width: 26, textAlign: 'left' }}>{score}</span>
      <div style={{ flex: 1, height: 5, background: '#1D2430', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

const PAGE_SIZE = 50;

export default function ActivityClient({ report }: { report: ActivityReport }) {
  const [tier, setTier] = useState<'all' | UserActivity['tier']>('all');
  const [search, setSearch] = useState('');
  const [showInternal, setShowInternal] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const external = useMemo(() => report.users.filter((u) => !u.isInternal), [report.users]);

  const kpis = useMemo(() => {
    const active = external.filter((u) => u.visits > 0);
    const returned = external.filter((u) => u.visits >= 2);
    const totalReturnSessions = external.reduce((s, u) => s + Math.max(u.visits - 1, 0), 0);
    const emailReturnSessions = external.reduce((s, u) => s + Math.min(u.emailVisits, Math.max(u.visits - 1, 0)), 0);
    const avgMinutes = active.length
      ? Math.round(active.reduce((s, u) => s + u.totalMinutes, 0) / active.length)
      : 0;
    return {
      registered: external.length,
      active: active.length,
      returned: returned.length,
      hot: external.filter((u) => u.tier === 'hot').length,
      avgMinutes,
      emailShare: totalReturnSessions ? Math.round((emailReturnSessions / totalReturnSessions) * 100) : 0,
    };
  }, [external]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return report.users.filter((u) => {
      if (!showInternal && u.isInternal) return false;
      if (tier !== 'all' && u.tier !== tier) return false;
      if (q && !u.email.toLowerCase().includes(q) && !(u.name ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [report.users, tier, search, showInternal]);

  const visible = filtered.slice(0, limit);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { all: external.length };
    for (const u of external) counts[u.tier] = (counts[u.tier] ?? 0) + 1;
    return counts;
  }, [external]);

  return (
    <div style={{ padding: '28px 48px', maxWidth: 1300, margin: '0 auto' }}>
      <PageHeader
        title="פעילות משתמשים רשומים"
        titleEn="User Activity"
        subtitle={`ביקורים, זמן באתר ומקורות הגעה ב-${report.daysBack} הימים האחרונים. ביקור = רצף אירועים עם פער של עד 30 דקות.`}
      />

      <KpiGrid cols={6}>
        <KpiCard label="משתמשים רשומים" value={kpis.registered} icon="👥" />
        <KpiCard label="עם פעילות באתר" value={kpis.active} icon="🟢" variant="success" />
        <KpiCard label="חזרו 2+ פעמים" value={kpis.returned} icon="🔁" variant="info" />
        <KpiCard label="משתמשים חמים" value={kpis.hot} icon="🔥" variant="gold" />
        <KpiCard label="זמן ממוצע באתר" value={formatMinutes(kpis.avgMinutes)} icon="⏱️" />
        <KpiCard label="חזרות דרך אימייל" value={`${kpis.emailShare}%`} icon="📧" variant="gold" />
      </KpiGrid>

      <SectionCard
        title="דירוג לפי היקף פעילות"
        titleEn="Activity score = frequency 35 + depth 25 + recency 25 + intent 15"
        noPadding
        actions={
          <>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setLimit(PAGE_SIZE); }}
              placeholder="חיפוש שם או אימייל..."
              style={{
                background: '#1D2430', border: '1px solid #2C323E', borderRadius: 8,
                color: '#EDE9E1', fontSize: 12, padding: '6px 12px', width: 190, outline: 'none',
              }}
            />
            <button
              onClick={() => setShowInternal((v) => !v)}
              style={{
                background: showInternal ? '#C9964A22' : '#1D2430',
                border: `1px solid ${showInternal ? '#C9964A' : '#2C323E'}`,
                borderRadius: 8, color: showInternal ? '#E8B94A' : '#AAB0BD',
                fontSize: 11, padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              חשבונות פנימיים
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', gap: 6, padding: '12px 20px', borderBottom: '1px solid #2C323E', flexWrap: 'wrap' }}>
          {(['all', 'hot', 'active', 'occasional', 'dormant'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTier(t); setLimit(PAGE_SIZE); }}
              style={{
                background: tier === t ? '#C9964A22' : 'transparent',
                border: `1px solid ${tier === t ? '#C9964A' : '#2C323E'}`,
                borderRadius: 20, color: tier === t ? '#E8B94A' : '#AAB0BD',
                fontSize: 12, padding: '5px 14px', cursor: 'pointer',
              }}
            >
              {t === 'all' ? 'הכל' : TIER_LABELS[t]}
              <span style={{ opacity: 0.6, marginRight: 5 }}>{tierCounts[t] ?? 0}</span>
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['#', 'משתמש', 'ציון פעילות', 'רמה', 'ביקורים', 'זמן באתר', 'ביקור אחרון', 'מקור הגעה', 'חזרות מאימייל', 'עמודים'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'right', fontWeight: 600, color: '#AAB0BD', fontSize: 11,
                    padding: '10px 14px', background: '#1D2430', borderBottom: '1px solid #2C323E', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#AAB0BD' }}>אין משתמשים תואמים</td></tr>
              )}
              {visible.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #2C323E' }}>
                  <td style={{ padding: '10px 14px', color: '#5B6270', fontSize: 11 }}>{i + 1}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Link href={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ color: '#EDE9E1', fontWeight: 600 }}>
                        {u.name || u.email.split('@')[0]}
                        {u.isInternal && <span style={{ color: '#5B6270', fontSize: 10, marginRight: 6 }}>(פנימי)</span>}
                      </div>
                      <div style={{ color: '#AAB0BD', fontSize: 11, direction: 'ltr', textAlign: 'right' }}>{u.email}</div>
                    </Link>
                  </td>
                  <td style={{ padding: '10px 14px' }}><ScoreBar score={u.score} /></td>
                  <td style={{ padding: '10px 14px' }}><Badge variant={TIER_BADGE[u.tier]}>{TIER_LABELS[u.tier]}</Badge></td>
                  <td style={{ padding: '10px 14px', color: '#EDE9E1', fontWeight: 700 }}>{u.visits}</td>
                  <td style={{ padding: '10px 14px', color: '#EDE9E1' }}>{formatMinutes(u.totalMinutes)}</td>
                  <td style={{ padding: '10px 14px', color: '#AAB0BD', whiteSpace: 'nowrap' }}>{relativeTime(u.lastSeen)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: '#EDE9E1', fontSize: 12 }}>{u.source}</span>
                    {u.referrers.length > 0 && (
                      <div style={{ color: '#5B6270', fontSize: 10, direction: 'ltr', textAlign: 'right' }}>
                        {u.referrers.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', color: u.emailVisits > 0 ? '#E8B94A' : '#5B6270' }}>
                    {u.visits > 0 ? `${u.emailVisits}/${u.visits}` : '-'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#AAB0BD', fontSize: 11, maxWidth: 210, whiteSpace: 'normal' }}>
                    {u.distinctPages.map((p) => PAGE_LABELS[p] ?? p).join(' · ') || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > limit && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <button
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              style={{
                background: '#1D2430', border: '1px solid #C9964A', borderRadius: 8,
                color: '#E8B94A', fontSize: 13, fontWeight: 700, padding: '8px 24px', cursor: 'pointer',
              }}
            >
              הצג עוד ({filtered.length - limit} נוספים)
            </button>
          </div>
        )}
      </SectionCard>

      <div style={{ color: '#5B6270', fontSize: 11, textAlign: 'center', paddingBottom: 24 }}>
        {report.truncated && 'חלק מהאירועים הישנים ביותר בחלון לא נכללו (תקרת שורות). '}
        הנתונים מתעדכנים אחת ל-15 דקות. זמן באתר הוא הערכה לפי טווח האירועים בכל ביקור.
      </div>
    </div>
  );
}
