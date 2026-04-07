import { getSourceAnalytics, getMetaAdsData, getGoogleAdsData, getGA4Data } from '@/lib/admin/queries';
import AcquisitionClient from './client';

export default async function AcquisitionPage() {
  const [sources, metaAds, googleAds, ga4] = await Promise.all([
    getSourceAnalytics('30d'),
    getMetaAdsData('30d'),
    getGoogleAdsData('30d'),
    getGA4Data('30d'),
  ]);

  return (
    <AcquisitionClient
      sources={sources}
      metaAds={metaAds}
      googleAds={googleAds}
      ga4={ga4}
    />
  );
}
