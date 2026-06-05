import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { applyQuizSideEffects } from '@/lib/quiz/side-effects';

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

    const updatedCount = (data ?? []).length;

    if (updatedCount > 0) {
      try {
        const { data: qr } = await supabase
          .from('quiz_results')
          .select('recommended_product, second_product, match_percent, answers')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (qr?.recommended_product) {
          await applyQuizSideEffects(supabase, {
            user_id,
            recommended_product: qr.recommended_product,
            second_product:      qr.second_product ?? null,
            match_percent:       qr.match_percent ?? null,
            answers:             qr.answers ?? {},
          });
        }
      } catch {}
    }

    return NextResponse.json({ success: true, updated_count: updatedCount });
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
    const {
      user_id, anonymous_id, answers, scores, recommended_product, second_product, match_percent,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_adset, utm_ad, click_id,
    } = body;

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
      utm_source:           utm_source   ? String(utm_source).slice(0, 100)   : null,
      utm_medium:           utm_medium   ? String(utm_medium).slice(0, 100)   : null,
      utm_campaign:         utm_campaign ? String(utm_campaign).slice(0, 100) : null,
      utm_content:          utm_content  ? String(utm_content).slice(0, 100)  : null,
      utm_term:             utm_term     ? String(utm_term).slice(0, 100)     : null,
      utm_adset:            utm_adset    ? String(utm_adset).slice(0, 100)    : null,
      utm_ad:               utm_ad       ? String(utm_ad).slice(0, 100)       : null,
      click_id:             click_id     ? String(click_id).slice(0, 200)     : null,
    });

    if (error) {
      await supabase.from('error_logs').insert({
        context: '/api/quiz-result',
        error: error.message,
        payload: { recommended_product },
      });
    }

    if (!error && user_id) {
      try {
        await applyQuizSideEffects(supabase, {
          user_id,
          recommended_product,
          second_product: second_product ?? null,
          match_percent:  match_percent  ?? null,
          answers:        answers        ?? {},
        });
      } catch {}
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
