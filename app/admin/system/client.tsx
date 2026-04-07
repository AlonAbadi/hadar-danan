'use client';

import { PageHeader, KpiGrid, KpiCard, SectionCard, DataTable, Badge, EmptyState } from '@/components/admin/ui';

const API_INTEGRATIONS = [
  { name: 'Supabase', envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], icon: '🟢' },
  { name: 'Cardcom', envVars: ['CARDCOM_TERMINAL_NUMBER', 'CARDCOM_API_NAME'], icon: '💳' },
  { name: 'Resend', envVars: ['RESEND_API_KEY'], icon: '📧' },
  { name: 'Meta Ads', envVars: ['META_ADS_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'], icon: '📘' },
  { name: 'Google Ads', envVars: ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_DEVELOPER_TOKEN'], icon: '🔍' },
  { name: 'GA4', envVars: ['GA4_PROPERTY_ID'], icon: '📊' },
  { name: 'Calendly', envVars: ['CALENDLY_API_TOKEN'], icon: '📅' },
  { name: 'Vimeo', envVars: ['VIMEO_ACCESS_TOKEN'], icon: '🎬' },
  { name: 'WhatsApp Business', envVars: ['WHATSAPP_BUSINESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'], icon: '💬' },
  { name: 'Vercel', envVars: ['VERCEL_PROJECT_ID'], icon: '▲' },
];

export default function SystemClient({ errors, events }: { errors: any[]; events: any[] }) {
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
          {API_INTEGRATIONS.map((api) => {
            // In production, check actual env vars server-side
            const isCore = ['Supabase', 'Resend'].includes(api.name);
            return (
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
                <Badge variant={isCore ? 'success' : 'warning'}>
                  {isCore ? 'מחובר' : 'ממתין'}
                </Badge>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#eff6ff',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#6b7280',
          lineHeight: '1.8',
        }}>
          <strong style={{ color: '#2563eb' }}>env vars נדרשים:</strong><br />
          {API_INTEGRATIONS.filter((a) => !['Supabase', 'Resend'].includes(a.name))
            .map((a) => `${a.name}: ${a.envVars.join(', ')}`)
            .join(' | ')}
        </div>
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
