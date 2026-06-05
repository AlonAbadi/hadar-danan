import { getErrorLogs, getEvents } from '@/lib/admin/queries';
import SystemClient, { type ApiIntegration } from './client';

const INTEGRATION_DEFS: { name: string; icon: string; envVars: string[] }[] = [
  { name: 'Supabase',           icon: '🟢', envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] },
  { name: 'Resend',             icon: '📧', envVars: ['RESEND_API_KEY'] },
  { name: 'Cardcom',            icon: '💳', envVars: ['CARDCOM_TERMINAL', 'CARDCOM_API_NAME'] },
  { name: 'UChat (WhatsApp)',   icon: '💬', envVars: ['UCHAT_API_KEY'] },
  { name: 'Anthropic (Claude)', icon: '🤖', envVars: ['ANTHROPIC_API_KEY'] },
  { name: 'Meta CAPI',          icon: '📘', envVars: ['META_CAPI_TOKEN', 'NEXT_PUBLIC_META_PIXEL_ID'] },
  { name: 'Meta Ads',           icon: '📊', envVars: ['META_ADS_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'] },
  { name: 'Google Ads',         icon: '🔍', envVars: ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_DEVELOPER_TOKEN'] },
  { name: 'Vimeo',              icon: '🎬', envVars: ['VIMEO_ACCESS_TOKEN'] },
  { name: 'Vercel',             icon: '▲',  envVars: ['VERCEL_TOKEN', 'VERCEL_TEAM_ID'] },
  { name: 'GitHub',             icon: '🐙', envVars: ['GITHUB_TOKEN', 'GITHUB_OWNER'] },
];

export default async function SystemPage() {
  const [errors, events] = await Promise.all([
    getErrorLogs(50),
    getEvents(30),
  ]);

  const integrations: ApiIntegration[] = INTEGRATION_DEFS.map((def) => {
    const missing = def.envVars.filter((key) => !process.env[key]);
    return {
      name:      def.name,
      icon:      def.icon,
      envVars:   def.envVars,
      connected: missing.length === 0,
      missing,
    };
  });

  return <SystemClient errors={errors} events={events} integrations={integrations} />;
}
