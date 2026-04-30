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

const PRIORITY: Record<string, number> = {
  partnership: 4,
  premium:     3,
  strategy:    2,
  course:      1,
};

const HIGH_VALUE_PRODUCTS = ['course', 'strategy', 'premium', 'partnership'];

export interface PriorityLead {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  quiz_product: string | null;
  match_percent: number | null;
  priority: number;
}

const ARCHIVE_STATUSES = new Set(['handled', 'not_relevant']);
const ALWAYS_EXCLUDE   = new Set(['buyer', 'booked']);

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  const showArchived = new URL(req.url).searchParams.get('archived') === 'true';

  try {
    const [{ data: quizRows }, { data: specialStatusUsers }] = await Promise.all([
      supabase
        .from('quiz_results')
        .select('user_id, recommended_product, match_percent, created_at')
        .in('recommended_product', HIGH_VALUE_PRODUCTS)
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('users')
        .select('id')
        .in('status', ['premium_lead', 'partnership_lead']),
    ]);

    const quizProductMap: Record<string, { product: string; match_percent: number | null }> = {};
    for (const qr of quizRows ?? []) {
      if (qr.user_id && !quizProductMap[qr.user_id]) {
        quizProductMap[qr.user_id] = {
          product: qr.recommended_product,
          match_percent: qr.match_percent ?? null,
        };
      }
    }

    const quizUserIds   = (quizRows ?? []).map(q => q.user_id as string);
    const specialUserIds = (specialStatusUsers ?? []).map(u => u.id);
    const allUserIds    = [...new Set([...quizUserIds, ...specialUserIds])];

    if (allUserIds.length === 0) {
      return NextResponse.json({ leads: [], archivedCount: 0 });
    }

    const [{ data: users }, { data: purchases }] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, email, phone, status, created_at')
        .in('id', allUserIds),
      supabase
        .from('purchases')
        .select('user_id')
        .in('user_id', allUserIds)
        .eq('status', 'completed'),
    ]);

    const buyerIds = new Set((purchases ?? []).map(p => p.user_id));

    const mapped: PriorityLead[] = (users ?? [])
      .filter(u => !buyerIds.has(u.id) && !ALWAYS_EXCLUDE.has(u.status))
      .map(u => {
        let product = quizProductMap[u.id]?.product ?? null;
        if (!product) {
          if (u.status === 'premium_lead')          product = 'premium';
          else if (u.status === 'partnership_lead') product = 'partnership';
        }
        return {
          id:            u.id,
          name:          u.name,
          email:         u.email,
          phone:         u.phone,
          status:        u.status,
          created_at:    u.created_at,
          quiz_product:  product,
          match_percent: quizProductMap[u.id]?.match_percent ?? null,
          priority:      PRIORITY[product ?? ''] ?? 0,
        };
      })
      .filter(u => u.priority > 0);

    const active   = mapped.filter(u => !ARCHIVE_STATUSES.has(u.status));
    const archived = mapped.filter(u =>  ARCHIVE_STATUSES.has(u.status));

    const sort = (arr: PriorityLead[]) =>
      arr.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    return NextResponse.json({
      leads:         sort(showArchived ? archived : active),
      archivedCount: archived.length,
    });
  } catch (error) {
    return NextResponse.json({ leads: [], archivedCount: 0, error: String(error) });
  }
}
