import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function getRequestIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = (body ?? {}) as { email?: unknown };
  const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!isValidEmail(emailStr)) {
    return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
  }

  const ip = getRequestIp(req);
  if (!rateLimit(`en-os-notify:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 },
    );
  }

  const db = createServerClient();

  // Upsert lead. Only writes utm_source on a new row, never overwrites an
  // existing utm_source so the original acquisition attribution survives.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (db as any)
    .from("users")
    .select("id, utm_source")
    .eq("email", emailStr)
    .maybeSingle();

  if (existing?.id) {
    if (!existing.utm_source) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).from("users").update({ utm_source: "en_os_waitlist" }).eq("id", existing.id);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insErr } = await (db as any).from("users").insert({
      email:      emailStr,
      status:     "lead",
      utm_source: "en_os_waitlist",
    });
    if (insErr) {
      await db.from("error_logs").insert({
        context: "api/en/os/notify POST - user insert",
        error:   String(insErr?.message ?? insErr),
        payload: { emailStr },
      });
      return NextResponse.json({ error: "Couldn't save your email. Try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
