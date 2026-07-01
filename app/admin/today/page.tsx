import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { getImmediateLeads } from "@/lib/admin/immediate-leads";
import HandoffQueue, { type HandoffLeadView } from "./HandoffQueue";

export const dynamic = "force-dynamic";

const C = {
  bg: "#0D1018", card: "#141820", fg: "#EDE9E1", muted: "#AAB0BD",
  gold: "#E8B94A", goldM: "#C9964A", line: "#2C323E", lineGold: "rgba(232,185,74,0.30)",
};

export default async function AdminTodayPage() {
  const supabase = createServerClient();
  const leads = await getImmediateLeads(supabase);

  const view: HandoffLeadView[] = leads.map((l) => ({
    userId:     l.userId,
    name:       l.name,
    occupation: l.occupation,
    source:     l.source,
    reason:     l.reason,
    at:         l.at,
    stage:      l.stage,
    waPhone:    l.waPhone,
    waText:     l.waText,
    userHref:   l.userHref,
  }));

  const queueCount = view.filter((l) => l.stage === "queue").length;

  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant), Assistant, sans-serif", minHeight: "100vh", background: C.bg, padding: 32, color: C.fg }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>לידים לטיפול מיידי</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4, maxWidth: 640, lineHeight: 1.6 }}>
            הלידים החמים שהמנוע סימן כשווי-פגישה — מהאות ומהקוויז, במקום אחד. לחיצה על "שלח ווטסאפ" מנסחת הודעה אישית מהדר ומעבירה ל"נשלח ווטסאפ". מי שסגר פגישה ושילם — יורד מהרשימה אוטומטית.
          </div>
        </div>
        <Link href="/admin" style={{
          fontSize: 13, color: C.goldM, textDecoration: "none",
          padding: "8px 14px", borderRadius: 9, border: `1px solid ${C.line}`, whiteSpace: "nowrap",
        }}>← חזרה לניהול</Link>
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22,
        background: "rgba(232,185,74,0.08)", border: `1px solid ${C.lineGold}`,
        borderRadius: 999, padding: "6px 16px",
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.gold }}>{queueCount}</span>
        <span style={{ fontSize: 13, color: C.muted }}>ממתינים לפנייה</span>
      </div>

      <HandoffQueue leads={view} />
    </div>
  );
}
