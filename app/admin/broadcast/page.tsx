import { getBroadcastStats } from '@/lib/admin/queries';
import BroadcastClient from './client';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const stats = await getBroadcastStats();
  return <BroadcastClient stats={stats} />;
}
