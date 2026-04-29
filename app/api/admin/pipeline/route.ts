import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { UserStatus } from '@/lib/supabase/types';

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

const VALID_STATUSES: UserStatus[] = [
  'lead', 'engaged', 'high_intent', 'buyer', 'booked', 'premium_lead', 'partnership_lead',
];

// GET /api/admin/pipeline
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get('status');
  const search      = searchParams.get('search');
  const limit       = Math.min(parseInt(searchParams.get('limit')  ?? '50', 10), 200);
  const offset      = parseInt(searchParams.get('offset') ?? '0', 10);

  const status = statusParam && VALID_STATUSES.includes(statusParam as UserStatus)
    ? (statusParam as UserStatus)
    : null;

  try {
    let query = supabase
      .from('users')
      .select(
        'id, name, email, phone, status, hive_status, created_at, utm_source, utm_campaign',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status)  query = query.eq('status', status);
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: users, error, count } = await query;

    if (error) {
      await supabase.from('error_logs').insert({
        context: 'api/admin/pipeline',
        error: String(error),
        payload: { status, search, limit, offset },
      });
      return NextResponse.json({ users: [], total: 0 });
    }

    // Fetch purchase summaries + quiz results for these users
    const userIds: string[] = (users ?? []).map((u) => u.id);
    const purchaseMap: Record<string, { count: number; total_spent: number }> = {};
    const quizMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const [{ data: purchases }, { data: quizByUser }, { data: identityRows }] = await Promise.all([
        supabase.from('purchases').select('user_id, status, amount').in('user_id', userIds),
        supabase.from('quiz_results').select('user_id, recommended_product').in('user_id', userIds).order('created_at', { ascending: false }),
        supabase.from('identities').select('user_id, anonymous_id').in('user_id', userIds),
      ]);

      for (const p of purchases ?? []) {
        if (!purchaseMap[p.user_id]) purchaseMap[p.user_id] = { count: 0, total_spent: 0 };
        purchaseMap[p.user_id].count++;
        if (p.status === 'completed') {
          purchaseMap[p.user_id].total_spent += p.amount ?? 0;
        }
      }

      // Primary: quiz_results.user_id match
      for (const q of quizByUser ?? []) {
        if (q.user_id && !quizMap[q.user_id]) {
          quizMap[q.user_id] = q.recommended_product;
        }
      }

      // Fallback: match via identities → anonymous_id
      const anonIds = (identityRows ?? []).map(i => i.anonymous_id).filter(Boolean);
      if (anonIds.length > 0) {
        const { data: quizByAnon } = await supabase
          .from('quiz_results')
          .select('anonymous_id, recommended_product')
          .in('anonymous_id', anonIds)
          .order('created_at', { ascending: false });

        // Build anon_id → user_id map
        const anonToUser: Record<string, string> = {};
        for (const row of identityRows ?? []) {
          if (row.anonymous_id && row.user_id) anonToUser[row.anonymous_id] = row.user_id;
        }

        for (const q of quizByAnon ?? []) {
          if (!q.anonymous_id) continue;
          const uid = anonToUser[q.anonymous_id];
          if (uid && !quizMap[uid]) {
            quizMap[uid] = q.recommended_product;
          }
        }
      }
    }

    const result = (users ?? []).map((u) => ({
      ...u,
      last_activity_at: null as string | null,
      purchase_count:   purchaseMap[u.id]?.count ?? 0,
      total_spent:      purchaseMap[u.id]?.total_spent ?? 0,
      quiz_product:     quizMap[u.id] ?? null,
    }));

    return NextResponse.json({ users: result, total: count ?? 0 });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/pipeline',
      error: String(error),
      payload: { status, search, limit, offset },
    });
    return NextResponse.json({ users: [], total: 0 });
  }
}
