import { getLeads, getQuizResults } from '@/lib/admin/queries';
import LeadsClient from './client';

export default async function LeadsPage() {
  const [leadsData, quizData] = await Promise.all([
    getLeads({ page: 1, perPage: 500 }),
    getQuizResults(50),
  ]);
  return <LeadsClient initialLeads={leadsData} quizData={quizData} />;
}
