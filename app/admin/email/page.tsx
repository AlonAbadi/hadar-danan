import { getEmailStats } from '@/lib/admin/queries';
import EmailClient from './client';

export default async function EmailPage() {
  const stats = await getEmailStats();
  return <EmailClient stats={stats} />;
}
