import { getRevenueStats, getFunnelData, getHiveStats, getTimeToConversion, getSourceAnalytics } from '@/lib/admin/queries';
import OverviewClient from './client';

export default async function AdminOverviewPage() {
  const [revenue, funnel, hive, timeToConversion, sources] = await Promise.all([
    getRevenueStats('30d'),
    getFunnelData('30d'),
    getHiveStats(),
    getTimeToConversion(),
    getSourceAnalytics('30d'),
  ]);

  return (
    <OverviewClient
      revenue={revenue}
      funnel={funnel}
      hive={hive}
      timeToConversion={timeToConversion}
      sources={sources}
    />
  );
}
