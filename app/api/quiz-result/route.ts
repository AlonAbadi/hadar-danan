import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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
