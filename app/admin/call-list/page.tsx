import { createServerClient } from "@/lib/supabase/server";
import CallListClient, { type DayGroup, type CallListRow } from "./CallListClient";

export const dynamic = "force-dynamic";

type CallRow = {
  sent_on:      string;
  user_id:      string;
  score:        number;
  reasons:      unknown;
  brief:        unknown;
  outcome:      string | null;
  outcome_at:   string | null;
  outcome_by:   string | null;
  outcome_note: string | null;
  created_at:   string;
};

type UserRow = {
  id:      string;
  name:    string | null;
  email:   string;
  phone:   string | null;
  status:  string;
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asBrief(v: unknown): { opening: string; talkingPoints: string[]; risk?: string } | null {
  if (!v || typeof v !== "object") return null;
  const o = v as { opening?: unknown; talkingPoints?: unknown; risk?: unknown };
  if (typeof o.opening !== "string") return null;
  const tp = Array.isArray(o.talkingPoints)
    ? o.talkingPoints.filter((x): x is string => typeof x === "string")
    : [];
  return {
    opening:       o.opening,
    talkingPoints: tp,
    risk:          typeof o.risk === "string" ? o.risk : undefined,
  };
}

export default async function CallListPage() {
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: callRows } = await (supabase as any)
    .from("daily_call_list")
    .select("sent_on, user_id, score, reasons, brief, outcome, outcome_at, outcome_by, outcome_note, created_at")
    .order("sent_on", { ascending: false })
    .order("score",   { ascending: false });

  const rows = (callRows ?? []) as CallRow[];
  const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));

  let userMap: Record<string, UserRow> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email, phone, status")
      .in("id", userIds);
    userMap = Object.fromEntries(((users ?? []) as UserRow[]).map(u => [u.id, u]));
  }

  // Group by date
  const byDate: Record<string, CallListRow[]> = {};
  for (const r of rows) {
    const u = userMap[r.user_id];
    if (!u) continue; // user deleted
    if (!byDate[r.sent_on]) byDate[r.sent_on] = [];
    byDate[r.sent_on]!.push({
      sent_on:      r.sent_on,
      user_id:      r.user_id,
      score:        Number(r.score),
      reasons:      asStringArray(r.reasons),
      brief:        asBrief(r.brief),
      outcome:      r.outcome,
      outcome_at:   r.outcome_at,
      outcome_by:   r.outcome_by,
      outcome_note: r.outcome_note,
      user: {
        id:     u.id,
        name:   u.name,
        email:  u.email,
        phone:  u.phone ?? "",
        status: u.status,
      },
    });
  }

  const groups: DayGroup[] = Object.keys(byDate)
    .sort((a, b) => (a < b ? 1 : -1))
    .map(date => {
      const list = byDate[date]!;
      const counts = { handled: 0, not_relevant: 0, booked: 0, pending: 0 };
      for (const r of list) {
        if (r.outcome === "handled")           counts.handled++;
        else if (r.outcome === "not_relevant") counts.not_relevant++;
        else if (r.outcome === "booked")       counts.booked++;
        else                                   counts.pending++;
      }
      return { sent_on: date, rows: list, counts };
    });

  return <CallListClient groups={groups} />;
}
