import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PRODUCT_MAP } from '@/lib/admin/queries';

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch { return false; }
}

function getDateFilter(range?: string | null): string {
  const now = new Date();
  switch (range) {
    case 'today': return new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    case '7d':    return new Date(now.getTime() - 7  * 86400000).toISOString();
    case '30d':   return new Date(now.getTime() - 30 * 86400000).toISOString();
    case '90d':   return new Date(now.getTime() - 90 * 86400000).toISOString();
    default:      return '2020-01-01T00:00:00Z';
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const dateRange = new URL(req.url).searchParams.get('dateRange') ?? '30d';
  const since = getDateFilter(dateRange);
  const supabase = createServerClient();

  const [{ data: purchases }, { data: prevPurchases }] = await Promise.all([
    supabase
      .from('purchases')
      .select('id, amount, product, created_at, user_id')
      .eq('status', 'completed')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchases')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', (() => {
        const days = dateRange === 'today' ? 1 : dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
        return new Date(Date.now() - days * 2 * 86400000).toISOString();
      })())
      .lt('created_at', since),
  ]);

  const total     = purchases?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const prevTotal = prevPurchases?.reduce((s, p) => s + (p.amount ?? 0), 0) ?? 0;
  const change    = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

  // Group by product
  const byProduct: Record<string, { revenue: number; count: number; name: string }> = {};
  for (const p of purchases ?? []) {
    const pid = p.product as string;
    if (!byProduct[pid]) byProduct[pid] = { revenue: 0, count: 0, name: PRODUCT_MAP[pid]?.name ?? pid };
    byProduct[pid].revenue += p.amount ?? 0;
    byProduct[pid].count++;
  }

  // Fetch user names for recent purchases
  const userIds = [...new Set((purchases ?? []).map(p => p.user_id).filter(Boolean))];
  const { data: users } = userIds.length > 0
    ? await supabase.from('users').select('id, name, email').in('id', userIds)
    : { data: [] };

  const userMap: Record<string, { name: string | null; email: string }> = {};
  for (const u of users ?? []) userMap[u.id] = { name: u.name, email: u.email };

  const recentPurchases = (purchases ?? []).slice(0, 50).map(p => ({
    id:         p.id,
    user_id:    p.user_id,
    name:       userMap[p.user_id]?.name ?? null,
    email:      userMap[p.user_id]?.email ?? p.user_id,
    product:    p.product,
    productName: PRODUCT_MAP[p.product as string]?.name ?? p.product,
    amount:     p.amount ?? 0,
    created_at: p.created_at,
  }));

  return NextResponse.json({
    total,
    change,
    orderCount: purchases?.length ?? 0,
    byProduct,
    recentPurchases,
  });
}
