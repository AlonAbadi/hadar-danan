import { getFunnelData, getTimeToConversion } from '@/lib/admin/queries';
import FunnelClient from './client';

export default async function FunnelPage() {
  const [funnel, ttc] = await Promise.all([
    getFunnelData('30d'),
    getTimeToConversion(),
  ]);

  return <FunnelClient funnel={funnel} timeToConversion={ttc} />;
}
