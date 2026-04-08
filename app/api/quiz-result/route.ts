import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Link anonymous quiz results to a newly authenticated user.
// Only updates rows where user_id IS NULL to avoid overwriting existing links.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { anonymous_id, user_id } = body as { anonymous_id?: string; user_id?: string };

    if (!anonymous_id || !user_id) {
      return NextResponse.json({ error: 'anonymous_id and user_id are required' }, { status: 400 });
    }
    if (!UUID_RE.test(user_id)) {
      return NextResponse.json({ error: 'invalid user_id' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('quiz_results')
      .update({ user_id })
      .eq('anonymous_id', anonymous_id)
      .is('user_id', null)
      .select('id');

    if (error) {
      await supabase.from('error_logs').insert({
        context: '/api/quiz-result PATCH',
        error: error.message,
        payload: { anonymous_id, user_id },
      });
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated_count: (data ?? []).length });
  } catch (err) {
    const supabase = createServerClient();
    await supabase.from('error_logs').insert({
      context: '/api/quiz-result PATCH',
      error: String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, anonymous_id, answers, scores, recommended_product, second_product, match_percent } = body;

    if (!recommended_product || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error } = await supabase.from('quiz_results').insert({
      user_id:              user_id ?? null,
      anonymous_id:         anonymous_id ?? null,
      answers:              answers ?? {},
      scores:               scores ?? {},
      recommended_product,
      second_product:       second_product ?? null,
      match_percent:        match_percent ?? 0,
    });

    if (error) {
      await supabase.from('error_logs').insert({
        context: '/api/quiz-result',
        error: error.message,
        payload: { recommended_product },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const supabase = createServerClient();
    await supabase.from('error_logs').insert({
      context: '/api/quiz-result',
      error: String(err),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
