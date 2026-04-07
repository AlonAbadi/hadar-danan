import { getABProposals, getABTests } from '@/lib/admin/queries';
import ABTestingClient from './client';

export const dynamic = 'force-dynamic';

export default async function ABTestingPage() {
  const [proposals, liveTests] = await Promise.all([
    getABProposals(),
    getABTests(),
  ]);
  return <ABTestingClient proposals={proposals} liveTests={liveTests} />;
}
