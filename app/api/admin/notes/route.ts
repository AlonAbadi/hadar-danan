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

// notes table added in migration 013 — cast to any until types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const notesTable = (supabase: ReturnType<typeof createServerClient>) => (supabase as any).from('notes');

// GET /api/admin/notes?user_id=...
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  const user_id = new URL(req.url).searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'חסר user_id' }, { status: 400 });
  }

  try {
    const { data: notes, error } = await notesTable(supabase)
      .select('id, author, content, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ notes: notes ?? [] });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/notes GET',
      error: String(error),
      payload: { user_id },
    });
    return NextResponse.json({ error: 'שגיאה בטעינת ההערות' }, { status: 500 });
  }
}

// POST /api/admin/notes
export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  let body: { user_id?: string; author?: string; content?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON לא תקין' }, { status: 400 });
  }

  const { user_id, author, content } = body;

  if (!user_id || !author || !content) {
    return NextResponse.json({ error: 'חסרים שדות חובה: user_id, author, content' }, { status: 400 });
  }

  try {
    const { data: note, error } = await notesTable(supabase)
      .insert({ user_id, author, content })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/notes POST',
      error: String(error),
      payload: { user_id, author },
    });
    return NextResponse.json({ error: 'שגיאה ביצירת ההערה' }, { status: 500 });
  }
}
