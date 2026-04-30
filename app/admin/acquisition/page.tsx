import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getSourceAnalytics, getMetaAdsData, getGoogleAdsData, getQuizStats, getTrainingVideoStats } from '@/lib/admin/queries';
import { getGA4Data } from '@/lib/admin/ga4-server';
import AcquisitionClient from './client';

export default async function AcquisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = range || '30d';

  const [sourceData, metaAds, googleAds, ga4, quiz, trainingVideo] = await Promise.all([
    getSourceAnalytics(dateRange),
    getMetaAdsData(dateRange),
    getGoogleAdsData(dateRange),
    getGA4Data(dateRange),
    getQuizStats(dateRange),
    getTrainingVideoStats(dateRange),
  ]);

  return (
    <Suspense>
      <AcquisitionClient
        sources={sourceData.sources}
        campaigns={sourceData.campaigns}
        metaAds={metaAds}
        googleAds={googleAds}
        ga4={ga4}
        quiz={quiz}
        trainingVideo={trainingVideo}
        dateRange={dateRange}
      />
    </Suspense>
  );
}
