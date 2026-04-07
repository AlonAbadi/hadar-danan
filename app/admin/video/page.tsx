import { getVimeoAnalytics, getVideoEventStats } from '@/lib/admin/queries';
import VideoClient from './client';

export const dynamic = 'force-dynamic';

export default async function VideoPage() {
  const [vimeo, eventStats] = await Promise.all([
    getVimeoAnalytics(),
    getVideoEventStats(),
  ]);
  return <VideoClient vimeo={vimeo} eventStats={eventStats} />;
}
