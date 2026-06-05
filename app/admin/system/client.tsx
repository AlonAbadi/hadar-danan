'use client';

import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, EmptyState } from '@/components/admin/ui';

export type ApiIntegration = {
  name:      string;
  icon:      string;
  envVars:   string[];
  connected: boolean;
  missing:   string[];
};

export default function SystemClient({
  errors,
  events,
  integrations,
}: {
  errors: any[];
  events: any[];
  integrations: ApiIntegration[];
}) {
  const errorCount = errors.length;
  const criticalErrors = errors.filter((e) => e.level === 'error').length;
  const warnings = errors.filter((e) => e.level === 'warning').length;

  return (
    <div>
      <PageHeader
        title="מערכת ולוגים"
        titleEn="System & Logs"
        subtitle="שגיאות, אירועים, בריאות API ומצב המערכת"
      />

      <KpiGrid cols={4}>
        <KpiCard label="שגיאות (50 אחרונות)" value={errorCount} icon="🔴" variant={criticalErrors > 0 ? 'danger' : 'success'} />
        <KpiCard label="שגיאות קריטיות" value={criticalErrors} icon="⚠️" variant={criticalErrors > 0 ? 'danger' : 'default'} />
        <KpiCard label="אזהרות" value={warnings} icon="🟡" variant={warnings > 0 ? 'gold' : 'default'} />
        <KpiCard label="אירועים אחרונים" value={events.length} icon="📡" />
      </KpiGrid>

      {/* API Health */}
      <SectionCard title="סטטוס חיבורי API" titleEn="API Integration Status">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {integrations.map((api) => (
            <div key={api.name} style={{
              padding: '12px 16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{api.icon}</span>
                <span style={{ fontSize: '13px', color: '#374151' }}>{api.name}</span>
              </div>
              <Badge variant={api.connected ? 'success' : 'warning'}>
                {api.connected ? 'מחובר' : 'חסר'}
              </Badge>
            </div>
          ))}
        </div>

        {integrations.some((a) => !a.connected) && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#92400e',
            lineHeight: '1.8',
          }}>
            <strong style={{ color: '#b45309' }}>env vars חסרים:</strong><br />
            {integrations.filter((a) => !a.connected)
              .map((a) => `${a.name}: ${a.missing.join(', ')}`)
              .join(' | ')}
          </div>
        )}
      </SectionCard>

      {/* Error Logs */}
      <SectionCard title="לוג שגיאות" titleEn="Error Logs" noPadding>
        {errors.length === 0 ? (
          <EmptyState icon="✅" title="אין שגיאות" description="המערכת פועלת תקין" />
        ) : (
          <DataTable
            columns={[
              { key: 'level', label: 'רמה', width: '8%', align: 'center' },
              { key: 'message', label: 'הודעה', width: '35%' },
              { key: 'context', label: 'הקשר', width: '20%' },
              { key: 'time', label: 'זמן', width: '15%', align: 'center' },
            ]}
            rows={errors.slice(0, 30).map((e) => ({
              level: (
                <Badge variant={e.level === 'error' ? 'danger' : e.level === 'warning' ? 'warning' : 'info'}>
                  {e.level}
                </Badge>
              ),
              message: (
                <span style={{ fontSize: '12px', color: '#374151', fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>
                  {e.message?.substring(0, 80)}{e.message?.length > 80 ? '...' : ''}
                </span>
              ),
              context: <span style={{ fontSize: '11px', color: '#9ca3af' }}>{e.context || '-'}</span>,
              time: (
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {new Date(e.created_at).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              ),
            }))}
          />
        )}
      </SectionCard>

      {/* Events Feed */}
      <SectionCard title="אירועים אחרונים" titleEn="Events Feed" noPadding>
        <DataTable
          columns={[
            { key: 'type', label: 'סוג', width: '20%' },
            { key: 'userId', label: 'User ID', width: '15%' },
            { key: 'metadata', label: 'מטא-דאטה', width: '35%' },
            { key: 'time', label: 'זמן', width: '15%', align: 'center' },
          ]}
          rows={events.slice(0, 20).map((e) => ({
            type: <Badge variant="info">{e.type}</Badge>,
            userId: (
              <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>
                {e.user_id?.substring(0, 8) || e.anonymous_id?.substring(0, 8) || '-'}
              </span>
            ),
            metadata: (
              <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', direction: 'ltr', display: 'inline-block' }}>
                {e.metadata ? JSON.stringify(e.metadata).substring(0, 60) : '-'}
              </span>
            ),
            time: (
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                {new Date(e.created_at).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            ),
          }))}
          emptyMessage="אין אירועים"
        />
      </SectionCard>
    </div>
  );
}
