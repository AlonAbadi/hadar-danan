import { getUserActivityReport } from '@/lib/admin/activity';
import ActivityClient from './client';

// ISR: the report aggregates the event log — refresh at most
// every 15 minutes so repeat admin loads don't hit the DB (NANO compute)
export const revalidate = 900;

export default async function ActivityPage() {
  const report = await getUserActivityReport(180);
  return <ActivityClient report={report} />;
}
