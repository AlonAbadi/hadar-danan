import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { bayesianStats } from '@/lib/admin/ab-agent';

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

// PATCH /api/admin/ab-proposals/[id]
// Actions: 'approve' | 'stop' | 'pause' | 'resume' | 'update'
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { id } = await params;
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const action = body.action as string;
  const now = new Date().toISOString();

  try {
    let updates: Record<string, unknown> = {};

    if (action === 'approve') {
      updates = {
        status: 'running',
        approved_at: now,
        started_at: now,
      };

    } else if (action === 'stop') {
      // Fetch current stats to determine winner
      const { data: current } = await supabase
        .from('ab_proposals')
        .select('visitors_a, conversions_a, visitors_b, conversions_b')
        .eq('id', id)
        .single();

      let winner: string | null = 'none';
      let confidence = 0;

      if (current) {
        const stats = bayesianStats(
          current.visitors_a, current.conversions_a,
          current.visitors_b, current.conversions_b
        );
        confidence = stats.confidence;
        winner = stats.confidence >= 95 ? stats.winner : 'none';
      }

      updates = { status: 'completed', completed_at: now, confidence, winner };

    } else if (action === 'pause') {
      updates = { status: 'paused' };

    } else if (action === 'resume') {
      updates = { status: 'running' };

    } else if (action === 'update') {
      // Allow editing these fields
      const allowed = [
        'title', 'hypothesis', 'variant_a', 'variant_b', 'metric',
        'page_or_element', 'priority', 'estimated_traffic', 'days_to_significance',
        'reasoning', 'visitors_a', 'visitors_b', 'conversions_a', 'conversions_b',
      ];
      for (const key of allowed) {
        if (key in body) updates[key] = body[key];
      }

      // Recalculate confidence if visitor/conversion counts were updated
      if ('visitors_a' in body || 'conversions_a' in body || 'visitors_b' in body || 'conversions_b' in body) {
        const { data: current } = await supabase
          .from('ab_proposals')
          .select('visitors_a, conversions_a, visitors_b, conversions_b')
          .eq('id', id)
          .single();

        if (current) {
          const va = (updates.visitors_a as number) ?? current.visitors_a;
          const ca = (updates.conversions_a as number) ?? current.conversions_a;
          const vb = (updates.visitors_b as number) ?? current.visitors_b;
          const cb = (updates.conversions_b as number) ?? current.conversions_b;
          const stats = bayesianStats(va, ca, vb, cb);
          updates.confidence = stats.confidence;
          if (stats.confidence >= 95) updates.winner = stats.winner;
        }
      }
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates to apply' }, { status: 400 });
    }

    const { data: proposal, error } = await supabase
      .from('ab_proposals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ proposal });
  } catch (error) {
    await supabase.from('error_logs').insert({
      context: `api/admin/ab-proposals/${id}`,
      error: String(error),
      payload: { action },
    });
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
