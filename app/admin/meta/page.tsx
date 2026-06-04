import { Suspense } from 'react';
import {
  getMetaCampaigns,
  getMetaTopAds,
  getMetaDailyTrend,
  getMetaDemographics,
  getMetaPlacements,
  getQuizFunnel,
  getTopAdsByKind,
  aggregateKpis,
} from '@/lib/admin/meta-queries';
import MetaClient from './client';

export const dynamic = 'force-dynamic';

export default async function MetaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = range || '30d';

  const [campaigns, ads, daily, demo, placements, quizFunnel, topByKind] = await Promise.all([
    getMetaCampaigns(dateRange),
    getMetaTopAds(dateRange, 15),
    getMetaDailyTrend(dateRange),
    getMetaDemographics(dateRange),
    getMetaPlacements(dateRange),
    getQuizFunnel(dateRange),
    getTopAdsByKind(dateRange),
  ]);

  const kpis = campaigns.rows ? aggregateKpis(campaigns.rows) : null;

  return (
    <Suspense>
      <MetaClient
        campaigns={campaigns}
        ads={ads}
        daily={daily}
        demo={demo}
        placements={placements}
        quizFunnel={quizFunnel}
        topByKind={topByKind}
        kpis={kpis}
        dateRange={dateRange}
      />
    </Suspense>
  );
}
