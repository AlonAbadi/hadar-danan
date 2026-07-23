import { getBroadcastStats } from '@/lib/admin/queries';
import { getBroadcastMaterials } from '@/lib/admin/broadcast-materials';
import BroadcastClient from './client';

export const dynamic = 'force-dynamic';

export default async function BroadcastPage() {
  const [stats, materials] = await Promise.all([getBroadcastStats(), getBroadcastMaterials()]);
  return <BroadcastClient stats={stats} materials={materials} />;
}
