import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getSourceAnalytics, getMetaAdsData, getGoogleAdsData } from '@/lib/admin/queries';
import { getGA4Data } from '@/lib/admin/ga4-server';
import AcquisitionClient from './client';

export default async function AcquisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = range || '30d';

  const [sources, metaAds, googleAds, ga4] = await Promise.all([
    getSourceAnalytics(dateRange),
    getMetaAdsData(dateRange),
    getGoogleAdsData(dateRange),
    getGA4Data(dateRange),
  ]);

  return (
    <Suspense>
      <AcquisitionClient
        sources={sources}
        metaAds={metaAds}
        googleAds={googleAds}
        ga4={ga4}
        dateRange={dateRange}
      />
    </Suspense>
  );
}
