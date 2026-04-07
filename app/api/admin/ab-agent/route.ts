import { NextRequest, NextResponse } from 'next/server';
import { analyzeAndPropose, checkAutoStop } from '@/lib/admin/ab-agent';
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

// POST /api/admin/ab-agent
// Runs the agent analysis and generates new proposals
export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const newProposals = await analyzeAndPropose();
    const autoStop = await checkAutoStop();

    return NextResponse.json({
      proposals: newProposals,
      generated: newProposals.length,
      auto_stopped: autoStop.stopped.length,
      message: newProposals.length > 0
        ? `הסוכן יצר ${newProposals.length} הצעות חדשות`
        : 'לא נמצאו הצעות חדשות - כל ההצעות הקיימות מכסות את נקודות הניתוח הנוכחיות',
    });
  } catch (error) {
    const supabase = createServerClient();
    await supabase.from('error_logs').insert({
      context: 'api/admin/ab-agent',
      error: String(error),
      payload: {},
    });
    return NextResponse.json({ error: 'Agent analysis failed' }, { status: 500 });
  }
}
