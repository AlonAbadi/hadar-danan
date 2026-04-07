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

// reminders table added in migration 013 — cast to any until types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const remindersTable = (supabase: ReturnType<typeof createServerClient>) => (supabase as any).from('reminders');

// GET /api/admin/reminders?assigned_to=...&completed=false
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const assigned_to = searchParams.get('assigned_to');
  const completed   = searchParams.get('completed') === 'true';

  try {
    let query = remindersTable(supabase)
      .select('id, user_id, assigned_to, task, due_at, completed_at, created_at')
      .order('due_at', { ascending: true });

    if (assigned_to) query = query.eq('assigned_to', assigned_to);

    if (completed) {
      query = query.not('completed_at', 'is', null);
    } else {
      query = query.is('completed_at', null);
    }

    const { data: reminders, error } = await query;
    if (error) throw error;
    return NextResponse.json({ reminders: reminders ?? [] });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/reminders GET',
      error: String(error),
      payload: { assigned_to, completed },
    });
    return NextResponse.json({ error: 'שגיאה בטעינת התזכורות' }, { status: 500 });
  }
}

// POST /api/admin/reminders
export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  let body: { user_id?: string; assigned_to?: string; task?: string; due_at?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON לא תקין' }, { status: 400 });
  }

  const { user_id, assigned_to, task, due_at } = body;

  if (!assigned_to || !task || !due_at) {
    return NextResponse.json({ error: 'חסרים שדות חובה: assigned_to, task, due_at' }, { status: 400 });
  }

  try {
    const { data: reminder, error } = await remindersTable(supabase)
      .insert({ user_id: user_id ?? null, assigned_to, task, due_at })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/reminders POST',
      error: String(error),
      payload: { assigned_to, task, due_at },
    });
    return NextResponse.json({ error: 'שגיאה ביצירת התזכורת' }, { status: 500 });
  }
}

// PATCH /api/admin/reminders
export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  let body: { id?: string; completed_at?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON לא תקין' }, { status: 400 });
  }

  const { id, completed_at } = body;

  if (!id || !completed_at) {
    return NextResponse.json({ error: 'חסרים שדות חובה: id, completed_at' }, { status: 400 });
  }

  try {
    const { data: reminder, error } = await remindersTable(supabase)
      .update({ completed_at })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ reminder });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: 'api/admin/reminders PATCH',
      error: String(error),
      payload: { id },
    });
    return NextResponse.json({ error: 'שגיאה בעדכון התזכורת' }, { status: 500 });
  }
}
