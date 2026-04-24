import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

// GET → check if migration 027 has been applied
export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (sb as any)
    .from("atelier_applications")
    .select("pipeline_status")
    .limit(1);

  const applied = !error || !error.message.includes("pipeline_status");

  return NextResponse.json({
    migration_027_applied: applied,
    ...(applied ? {} : {
      action_required: "Run migration 027 in Supabase SQL Editor",
      sql_editor_url: "https://supabase.com/dashboard/project/rufzcpwzolitoqqhdmrx/sql/new",
      sql: SQL_027,
    }),
  });
}

const SQL_027 = `
ALTER TABLE atelier_applications
  ADD COLUMN IF NOT EXISTS pipeline_status     TEXT    NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS generated_client_ts TEXT,
  ADD COLUMN IF NOT EXISTS error_detail        TEXT,
  ADD COLUMN IF NOT EXISTS orchestration_log   JSONB   NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_atelier_pipeline_status ON atelier_applications(pipeline_status);

UPDATE atelier_applications SET pipeline_status = 'deployed'
  WHERE preview_url IS NOT NULL AND pipeline_status = 'pending';
UPDATE atelier_applications SET pipeline_status = 'awaiting_approval'
  WHERE generated_content IS NOT NULL AND preview_url IS NULL AND pipeline_status = 'pending';
UPDATE atelier_applications SET pipeline_status = 'onboarding_complete'
  WHERE onboarding_submitted_at IS NOT NULL AND generated_content IS NULL AND pipeline_status = 'pending';
UPDATE atelier_applications SET pipeline_status = 'onboarding_sent'
  WHERE onboarding_token IS NOT NULL AND onboarding_submitted_at IS NULL AND pipeline_status = 'pending';
`;
