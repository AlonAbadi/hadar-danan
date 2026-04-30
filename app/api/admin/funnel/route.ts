import { NextRequest, NextResponse } from 'next/server';
import { getFunnelData, getTimeToConversion } from '@/lib/admin/queries';

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const dateRange = new URL(req.url).searchParams.get('dateRange') ?? '30d';
  const [funnel, timeToConversion] = await Promise.all([
    getFunnelData(dateRange),
    getTimeToConversion(),
  ]);

  return NextResponse.json({ funnel, timeToConversion });
}
