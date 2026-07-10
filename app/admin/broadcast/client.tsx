'use client';

import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, PercentBar, EmptyState } from '@/components/admin/ui';
import type { BroadcastOverviewStats, BroadcastPerScriptStat } from '@/lib/admin/queries';

// Canonical 7-video structure per shoot-day-engine.ts. Used to label rows even
// when a video_number has 0 rows in the DB yet.
const VIDEO_LABELS: Record<number, { title: string; profile: string; type: string }> = {
  1: { title: 'משפט הזהות',       profile: 'tight',    type: 'IDENTITY' },
  2: { title: 'הוק עמוד 1',        profile: 'tight',    type: 'PILLAR_HOOK' },
  3: { title: 'הוק עמוד 2',        profile: 'standard', type: 'PILLAR_HOOK' },
  4: { title: 'סיפור-תיק',         profile: 'long',     type: 'STORY' },
  5: { title: 'הרגע הרגשי',       profile: 'long',     type: 'STORY' },
  6: { title: 'Framework',         profile: 'long',     type: 'FRAMEWORK' },
  7: { title: 'CTA',               profile: 'tight',    type: 'CTA' },
};

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function fmtNum(n: number, digits = 1): string {
  return n.toFixed(digits);
}

function profileVariant(p: string): 'gold' | 'default' | 'success' {
  if (p === 'tight')    return 'gold';
  if (p === 'long')     return 'success';
  return 'default';
}
function activityVariant(e: string): 'default' | 'gold' | 'success' | 'warning' {
  if (e === 'take')       return 'default';
  if (e === 'edit_ready') return 'gold';
  if (e === 'downloaded') return 'warning';
  return 'success';   // published
}

export default function BroadcastClient({ stats }: { stats: BroadcastOverviewStats }) {
  const {
    total_users, total_takes, total_edits_started, total_edits_ready, total_edits_failed,
    total_downloaded, total_published, overall_publish_rate, overall_takes_per_ready,
    per_script, recent_activity,
  } = stats;

  // Merge canonical structure with observed data so we always render 7 rows.
  const rowsByNumber = new Map(per_script.map((r) => [r.video_number, r] as const));
  const scriptRows: BroadcastPerScriptStat[] = Array.from({ length: 7 }, (_, i) => {
    const n = i + 1;
    return rowsByNumber.get(n) ?? {
      video_number: n, takes: 0, distinct_users: 0,
      edits_started: 0, edits_ready: 0, edits_failed: 0, edits_downloaded: 0, published: 0,
      publish_rate: 0, takes_per_ready: 0,
    };
  });

  // Any non-canonical video_numbers (8-12 from legacy plans) get appended.
  const extras = per_script.filter((r) => r.video_number > 7);
  const allRows = [...scriptRows, ...extras];

  const anyActivity = total_takes > 0;

  return (
    <div style={{ padding: '32px 48px', color: '#EDE9E1' }}>
      <PageHeader
        title="חדר השידור"
        titleEn="Broadcast Room Analytics"
        subtitle="איזה תסריטים באמת מייצרים רילסים מפורסמים — feedback loop למנוע הדר"
      />

      <KpiGrid cols={4}>
        <KpiCard label="משתמשים שצילמו"     value={total_users.toLocaleString()}       icon="👥" />
        <KpiCard label="סה״כ טייקים"        value={total_takes.toLocaleString()}       icon="🎬" />
        <KpiCard label="סה״כ פורסמו"         value={total_published.toLocaleString()}   icon="✅"
          variant={total_published > 0 ? 'success' : undefined} />
        <KpiCard label="Publish Rate ממוצע" value={fmtPct(overall_publish_rate)}       icon="📊"
          variant={overall_publish_rate >= 0.5 ? 'success' : overall_publish_rate >= 0.25 ? 'gold' : 'danger'} />
      </KpiGrid>

      <KpiGrid cols={4}>
        <KpiCard label="Edits התחילו"        value={total_edits_started.toLocaleString()} icon="⚙️" />
        <KpiCard label="Edits מוכנים"        value={total_edits_ready.toLocaleString()}   icon="🎥" />
        <KpiCard label="Edits נכשלו"         value={total_edits_failed.toLocaleString()}  icon="⚠️"
          variant={total_edits_failed > total_edits_ready * 0.15 ? 'danger' : undefined} />
        <KpiCard label="Takes / Ready"       value={fmtNum(overall_takes_per_ready, 1)}   icon="🔁"
          variant={overall_takes_per_ready <= 2 ? 'success' : overall_takes_per_ready <= 3 ? 'gold' : 'danger'} />
      </KpiGrid>

      {!anyActivity && (
        <SectionCard title="עוד אין נתונים" titleEn="No broadcast activity yet">
          <EmptyState
            icon="🎬"
            title="עוד אין נתונים על שידור"
            description="כשלקוחות יתחילו לצלם דרך חדר השידור, יופיעו כאן ה-analytics per-script. הפרוטוקול: publish_rate < 25% על תסריט מסוים = מועמד לשיפור המנוע."
          />
        </SectionCard>
      )}

      {anyActivity && (
        <SectionCard
          title="ביצועים לפי תסריט (Video Number)"
          titleEn="Per-Script Performance"
        >
          <DataTable
            columns={[
              { key: 'v',       label: 'סרטון',       align: 'right' },
              { key: 'profile', label: 'פרופיל',      align: 'right' },
              { key: 'users',   label: 'משתמשים',    align: 'right' },
              { key: 'takes',   label: 'טייקים',     align: 'right' },
              { key: 'ready',   label: 'Edits מוכנים', align: 'right' },
              { key: 'failed',  label: 'נכשלו',       align: 'right' },
              { key: 'dl',      label: 'הורדו',       align: 'right' },
              { key: 'pub',     label: 'פורסמו',      align: 'right' },
              { key: 'pubRate', label: 'Publish Rate', align: 'right' },
              { key: 'tpr',     label: 'Takes/Ready',  align: 'right' },
            ]}
            rows={allRows.map((r) => {
              const meta = VIDEO_LABELS[r.video_number] ?? { title: `Video ${r.video_number}`, profile: '?', type: '?' };
              return {
                key: `v${r.video_number}`,
                v: (
                  <div>
                    <div style={{ fontWeight: 700 }}>#{r.video_number} · {meta.title}</div>
                    <div style={{ fontSize: 11, color: '#9E9990' }}>{meta.type}</div>
                  </div>
                ),
                profile: (
                  <Badge variant={profileVariant(meta.profile)}>{meta.profile}</Badge>
                ),
                users:   r.distinct_users || <span style={{ color: '#5A5F6B' }}>0</span>,
                takes:   r.takes          || <span style={{ color: '#5A5F6B' }}>0</span>,
                ready:   r.edits_ready    || <span style={{ color: '#5A5F6B' }}>0</span>,
                failed:  r.edits_failed
                  ? <span style={{ color: r.edits_failed > 0 ? '#FF8888' : undefined }}>{r.edits_failed}</span>
                  : <span style={{ color: '#5A5F6B' }}>0</span>,
                dl:      r.edits_downloaded || <span style={{ color: '#5A5F6B' }}>0</span>,
                pub:     r.published ? <strong style={{ color: '#7FD49B' }}>{r.published}</strong> : <span style={{ color: '#5A5F6B' }}>0</span>,
                pubRate: r.edits_ready > 0
                  ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 60 }}>
                          <PercentBar value={r.publish_rate * 100} color={r.publish_rate >= 0.5 ? '#7FD49B' : r.publish_rate >= 0.25 ? '#C9964A' : '#FF8888'} />
                        </div>
                        <span style={{ fontSize: 12, minWidth: 34 }}>{fmtPct(r.publish_rate)}</span>
                      </div>
                    )
                  : <span style={{ color: '#5A5F6B' }}>—</span>,
                tpr:     r.edits_ready > 0
                  ? <span style={{
                      color: r.takes_per_ready <= 2 ? '#7FD49B'
                           : r.takes_per_ready <= 3 ? '#E8B94A'
                           : '#FF8888',
                    }}>{fmtNum(r.takes_per_ready, 1)}</span>
                  : <span style={{ color: '#5A5F6B' }}>—</span>,
              };
            })}
          />
          <div style={{ marginTop: 12, fontSize: 12, color: '#9E9990', lineHeight: 1.6 }}>
            <strong style={{ color: '#EDE9E1' }}>איך קוראים את הטבלה:</strong> Publish Rate {'>'}50% = תסריט חזק.
            Publish Rate {'<'}25% = מועמד לשיפור המנוע (הפרומפט של Video #N צריך רענון).
            Takes/Ready {'>'}3 = הלקוחות מקליטים שוב ושוב עד שיצא — סימן שהתסריט לא זורם טוב לפה שלהם.
          </div>
        </SectionCard>
      )}

      {recent_activity.length > 0 && (
        <SectionCard title="פעילות אחרונה" titleEn="Recent Activity (last 20 events)">
          <DataTable
            columns={[
              { key: 'at',    label: 'זמן',       align: 'right' },
              { key: 'event', label: 'אירוע',    align: 'right' },
              { key: 'v',     label: 'סרטון',    align: 'right' },
            ]}
            rows={recent_activity.map((e, i) => {
              const label =
                e.event === 'take'       ? 'טייק חדש' :
                e.event === 'edit_ready' ? 'עריכה הושלמה' :
                e.event === 'downloaded' ? 'הורד למחשב' :
                                            'פורסם ✓';
              const meta = VIDEO_LABELS[e.video_number];
              return {
                key: `${e.at}-${i}`,
                at: <span style={{ fontSize: 12, color: '#9E9990' }}>{new Date(e.at).toLocaleString('he-IL')}</span>,
                event: <Badge variant={activityVariant(e.event)}>{label}</Badge>,
                v: meta ? `#${e.video_number} · ${meta.title}` : `#${e.video_number}`,
              };
            })}
          />
        </SectionCard>
      )}

      <div style={{
        marginTop: 32, padding: '16px 20px',
        background: 'rgba(232,185,74,0.04)', border: '1px solid rgba(232,185,74,0.2)',
        borderRadius: 10, fontSize: 13, color: '#EDE9E1', lineHeight: 1.7,
      }}>
        <strong style={{ color: '#E8B94A' }}>Feedback loop for engine improvement:</strong>{' '}
        פעם בשבועיים, בדוק אילו scripts יש להם publish_rate נמוך (&lt;25%) או takes_per_ready גבוה (&gt;3).
        אלו מועמדים ראשונים לרענון פרומפט. שיפור המנוע ב-<code>lib/prompts/shoot-day-engine.ts</code>
        עבור Video #N ספציפי + rebuild → מדוד שוב אחרי חודש.
      </div>
    </div>
  );
}
