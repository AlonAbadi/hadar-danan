import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

// GET /api/admin/stats
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [leadsRes, salesRes, pendingRes, totalUsersRes, buyersRes] = await Promise.all([
      // leads_today
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfToday),

      // sales_this_month
      supabase
        .from('purchases')
        .select('amount')
        .eq('status', 'completed')
        .gte('created_at', startOfMonth),

      // pending_action — filter by status only (last_activity_at may not exist yet)
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .in('status', ['high_intent', 'premium_lead', 'partnership_lead']),

      // total users
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true }),

      // completed purchases
      supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
    ]);

    // Collect first error if any, but still return partial data
    const firstError = leadsRes.error ?? salesRes.error ?? pendingRes.error ?? totalUsersRes.error ?? buyersRes.error;
    if (firstError) {
      await supabase.from('error_logs').insert({
        context: 'api/admin/stats',
        error: String(firstError),
        payload: {},
      });
    }

    const leads_today      = leadsRes.count ?? 0;
    const sales_this_month = (salesRes.data ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);
    const pending_action   = pendingRes.count ?? 0;
    const total_users      = totalUsersRes.count ?? 0;
    const total_buyers     = buyersRes.count ?? 0;
    const conversion_rate  = total_users > 0
      ? Math.round((total_buyers / total_users) * 100 * 10) / 10
      : 0;

    return NextResponse.json({ leads_today, sales_this_month, pending_action, conversion_rate });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/stats',
      error: String(error),
      payload: {},
    });
    return NextResponse.json(
      { leads_today: 0, sales_this_month: 0, pending_action: 0, conversion_rate: 0 }
    );
  }
}
