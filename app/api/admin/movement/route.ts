/**
 * POST /api/admin/movement
 *
 * Generates a Hadar-flavored directing brief from a 1–3 sentence customer
 * description. Behind admin Basic Auth (matches the rest of /api/admin/*).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateMovementBrief } from "@/lib/movement-engine";
import { createServerClient } from "@/lib/supabase/server";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

const BodySchema = z.object({
  description: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const brief = await generateMovementBrief(body.data.description);
    return NextResponse.json({ brief });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await createServerClient().from("error_logs").insert({
      context: "api/admin/movement",
      error:   message,
      payload: { description: body.data.description.slice(0, 300) },
    });
    return NextResponse.json({ error: "Engine failed", detail: message }, { status: 502 });
  }
}
