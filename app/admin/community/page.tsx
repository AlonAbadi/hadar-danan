/**
 * /admin/community — כוורת האות (the ₪590 one-time activation product).
 *
 * Rewritten 2026-07-04 (Alon): the old monthly Hive (₪29/97/149 tiers, MRR)
 * is retired and removed from every surface. This page now shows the only
 * hive that exists — כוורת האות — with the full member list.
 * Legacy monthly members (if any still carry a hive_tier) are labeled so
 * nobody's access is lost silently.
 */
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeFrom(supabase: ReturnType<typeof createServerClient>, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

const C = {
  bg: "#0D1018", card: "#141820", gold: "#E8B94A", goldMid: "#C9964A",
  fg: "#EDE9E1", muted: "#9E9990", line: "#2C323E",
};

const TIER_LEGACY: Record<string, string> = {
  discounted_29: "מנוי ישן ₪29",
  basic_97:      "מנוי ישן ₪97",
  basic_59:      "מנוי ישן ₪59",
  full_149:      "מנוי ישן ₪149",
};

export default async function CommunityPage() {
  const supabase = createServerClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [membersRes, purchasesRes] = await Promise.all([
    safeFrom(supabase, "users")
      .select("id, name, email, phone, hive_tier, hive_status, hive_started_at, occupation")
      .eq("hive_status", "active")
      .neq("is_test", true)
      .order("hive_started_at", { ascending: false }),
    safeFrom(supabase, "purchases")
      .select("user_id, amount, amount_paid, created_at, status")
      .eq("product", "signal_hive_590")
      .eq("status", "completed")
      .neq("is_test", true),
  ]);

  type Member = {
    id: string; name: string | null; email: string | null; phone: string | null;
    hive_tier: string | null; hive_started_at: string | null; occupation: string | null;
  };
  type Purchase = { user_id: string | null; amount: number | null; amount_paid: number | null; created_at: string };

  const members   = (membersRes.data ?? []) as Member[];
  const purchases = (purchasesRes.data ?? []) as Purchase[];
  const paidByUser = new Map<string, Purchase>();
  for (const p of purchases) if (p.user_id) paidByUser.set(p.user_id, p);

  const revenue      = purchases.reduce((s, p) => s + Number(p.amount_paid ?? p.amount ?? 0), 0);
  const newThisMonth = members.filter((m) => m.hive_started_at && new Date(m.hive_started_at) >= monthStart).length;
  const legacyCount  = members.filter((m) => m.hive_tier && TIER_LEGACY[m.hive_tier]).length;

  const waLink = (phone: string | null) => {
    if (!phone) return null;
    const d = phone.replace(/\D/g, "").replace(/^0/, "972");
    return d.length >= 11 ? `https://wa.me/${d}` : null;
  };

  return (
    <div dir="rtl" className="font-assistant" style={{ minHeight: "100vh", background: C.bg, color: C.fg, padding: "40px 20px" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.gold, margin: 0 }}>כוורת האות 🐝</h1>
          <a href="/admin" style={{ color: C.goldMid, fontSize: 13.5 }}>← ניהול</a>
        </div>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
          מוצר ההפעלה, תשלום אחד של ₪590. הכוורת החודשית הישנה הוסרה מהאתר.
        </p>

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "חברים פעילים", value: members.length },
            { label: "חדשים החודש", value: newThisMonth },
            { label: "רכישות כוורת האות", value: purchases.length },
            { label: "סך הכנסות כוורת האות", value: `₪${revenue.toLocaleString("en-US")}` },
            ...(legacyCount > 0 ? [{ label: "חברי מנוי ישן (לשימור גישה)", value: legacyCount }] : []),
          ].map((s) => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "18px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.gold }}>{s.value}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* member list */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.goldMid, margin: "0 0 14px" }}>
            רשימת החברים ({members.length})
          </h2>
          {members.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 14 }}>אין חברים פעילים עדיין.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13.5, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: C.muted, textAlign: "right" }}>
                    <th style={{ padding: "6px 4px" }}>שם</th>
                    <th style={{ padding: "6px 4px" }}>אימייל</th>
                    <th style={{ padding: "6px 4px" }}>תחום</th>
                    <th style={{ padding: "6px 4px" }}>הצטרפות</th>
                    <th style={{ padding: "6px 4px" }}>מקור</th>
                    <th style={{ padding: "6px 4px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const paid = paidByUser.get(m.id);
                    const source = paid
                      ? `כוורת האות ₪${Number(paid.amount_paid ?? paid.amount ?? 590)}`
                      : (m.hive_tier && TIER_LEGACY[m.hive_tier]) || "הפעלה ידנית";
                    const wa = waLink(m.phone);
                    return (
                      <tr key={m.id} style={{ borderTop: `1px solid ${C.line}` }}>
                        <td style={{ padding: "9px 4px", fontWeight: 700 }}>
                          <a href={`/admin/users/${m.id}`} style={{ color: C.fg, textDecoration: "none" }}>{m.name || "—"}</a>
                        </td>
                        <td style={{ padding: "9px 4px", direction: "ltr", textAlign: "left", color: C.muted }}>{m.email || "—"}</td>
                        <td style={{ padding: "9px 4px", color: C.muted }}>{m.occupation || "—"}</td>
                        <td style={{ padding: "9px 4px", color: C.muted }}>
                          {m.hive_started_at
                            ? new Date(m.hive_started_at).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" })
                            : "—"}
                        </td>
                        <td style={{ padding: "9px 4px" }}>
                          <span style={{
                            background: paid ? "rgba(232,185,74,0.12)" : "rgba(90,160,255,0.12)",
                            color: paid ? C.gold : "#8FBFFF",
                            borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 700,
                          }}>
                            {source}
                          </span>
                        </td>
                        <td style={{ padding: "9px 4px" }}>
                          {wa && (
                            <a href={wa} target="_blank" style={{ color: "#25D366", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                              וואטסאפ ←
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
