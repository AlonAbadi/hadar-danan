import { getErrorLogs, getEvents } from '@/lib/admin/queries';
import SystemClient from './client';

export default async function SystemPage() {
  const [errors, events] = await Promise.all([
    getErrorLogs(50),
    getEvents(30),
  ]);
  return <SystemClient errors={errors} events={events} />;
}
