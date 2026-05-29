import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
import { getSourceAnalytics, getGoogleAdsData, getQuizStats, getTrainingVideoStats } from '@/lib/admin/queries';
import { getGA4Data } from '@/lib/admin/ga4-server';
import AcquisitionClient from './client';

export default async function AcquisitionPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range } = await searchParams;
  const dateRange = range || '30d';

  // Meta Ads integration disabled until System User token is regenerated
  // with ads_read scope on the ad account (current token has CAPI scope only).
  const [sourceData, googleAds, ga4, quiz, trainingVideo] = await Promise.all([
    getSourceAnalytics(dateRange),
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
        googleAds={googleAds}
        ga4={ga4}
        quiz={quiz}
        trainingVideo={trainingVideo}
        dateRange={dateRange}
      />
    </Suspense>
  );
}
