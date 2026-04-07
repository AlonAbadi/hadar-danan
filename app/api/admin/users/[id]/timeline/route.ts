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

// GET /api/admin/users/[id]/timeline
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { id } = await params;

  try {
    const [eventsRes, purchasesRes, emailsRes] = await Promise.all([
      supabase
        .from('events')
        .select('id, type, created_at, metadata')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('purchases')
        .select('id, product, status, amount, created_at, cardcom_ref')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('email_logs')
        .select('id, sequence_id, status, sent_at')
        .eq('user_id', id)
        .order('sent_at', { ascending: false })
        .limit(50),
    ]);

    if (eventsRes.error)    throw eventsRes.error;
    if (purchasesRes.error) throw purchasesRes.error;
    if (emailsRes.error)    throw emailsRes.error;

    const timeline = [
      ...(eventsRes.data ?? []).map((e) => ({
        kind:       'event' as const,
        id:         e.id,
        type:       e.type,
        created_at: e.created_at,
        payload:    e.metadata,
      })),
      ...(purchasesRes.data ?? []).map((p) => ({
        kind:       'purchase' as const,
        id:         p.id,
        type:       p.product,
        created_at: p.created_at,
        payload:    { status: p.status, amount: p.amount, cardcom_ref: p.cardcom_ref },
      })),
      ...(emailsRes.data ?? []).map((m) => ({
        kind:       'email' as const,
        id:         m.id,
        type:       m.sequence_id ?? 'email',
        created_at: m.sent_at,
        payload:    { status: m.status },
      })),
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    return NextResponse.json({ timeline });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: `api/admin/users/${id}/timeline`,
      error: String(error),
      payload: { user_id: id },
    });
    return NextResponse.json({ error: 'שגיאה בטעינת הטיימליין' }, { status: 500 });
  }
}
