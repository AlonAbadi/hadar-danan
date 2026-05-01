import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  const sid = req.nextUrl.searchParams.get("sid");
  const url = req.nextUrl.searchParams.get("url");

  const destination = url ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  if (uid && sid) {
    try {
      const supabase = createServerClient();

      const { data: log } = await supabase
        .from("email_logs")
        .select("id, status")
        .eq("user_id", uid)
        .eq("sequence_id", sid)
        .maybeSingle();

      if (log) {
        const updates: Array<PromiseLike<unknown>> = [];

        // Mark opened if not yet (click implies open)
        if (log.status === "sent") {
          updates.push(
            supabase
              .from("email_logs")
              .update({ status: "opened" })
              .eq("id", log.id)
              .then(),
            supabase.from("events").insert({
              user_id: uid,
              type: "EMAIL_OPENED",
              metadata: { sequence_id: sid, email_log_id: log.id },
            }).then()
          );
        }

        // Always record the click event
        updates.push(
          supabase.from("events").insert({
            user_id: uid,
            type: "LINK_CLICKED",
            metadata: { sequence_id: sid, url: destination },
          }).then()
        );

        await Promise.all(updates);
      }
    } catch {
      // Never block the redirect
    }
  }

  return NextResponse.redirect(destination);
}
