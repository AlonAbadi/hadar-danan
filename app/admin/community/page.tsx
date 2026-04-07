import { getHiveStats } from '@/lib/admin/queries';
import CommunityClient from './client';

export default async function CommunityPage() {
  const hive = await getHiveStats();
  return <CommunityClient hive={hive} />;
}
