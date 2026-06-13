import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { HivePricingSection } from "./HivePricingSection";

export const metadata: Metadata = {
  title: "הכוורת | קהילה חודשית של בעלי עסקים — הדר דנן",
  description:
    "מנוי חודשי לכלים ושיטה שמחזירים לך את הבידול האמיתי שלך. מנוע האות, ספריית בינג', ומפגש חודשי עם הדר.",
  alternates: { canonical: "/hive" },
};

const C = {
  bg:    "#080C14",
  card:  "#141820",
  gold:  "#E8B94A",
  goldM: "#C9964A",
  fg:    "#EDE9E1",
  muted: "#AAB0BD",
  line:  "rgba(232,185,74,0.14)",
};

// Active members shouldn't see the pricing page — they already pay. Route them
// straight to the community/members hub. URL flag ?stay=1 escapes the redirect
// (useful for testing/admin previews).
export default async function HivePage({ searchParams }: { searchParams: Promise<{ stay?: string }> }) {
  const sp = await searchParams;
  if (sp?.stay !== "1") {
    try {
      const cookieStore = await cookies();
      const sb = createSSRClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
      );
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const db = createServerClient();
        const { data: userData } = await db
          .from("users")
          .select("hive_status")
          .eq("auth_id", user.id)
          .maybeSingle();
        if (userData?.hive_status === "active") {
          redirect("/hive/members");
        }
      }
    } catch {
      // Session check failed — fall through and render the marketing page.
    }
  }

  return (
    <main
      dir="rtl"
      className="font-assistant"
      style={{ background: C.bg, color: C.fg, minHeight: "100svh" }}
    >
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", padding: "72px 24px 56px", textAlign: "center", overflow: "hidden" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            top:      "-20%",
            left:     "50%",
            transform: "translateX(-50%)",
            width:    "140vw",
            height:   "70vh",
            background: "radial-gradient(ellipse at center, rgba(232,185,74,0.08), transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", zIndex: 1 }}>
          <div
            style={{
              display:       "inline-block",
              fontSize:      12,
              letterSpacing: 1.6,
              color:         C.goldM,
              marginBottom:  16,
              textTransform: "uppercase",
            }}
          >
            <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
          </div>

          <h1
            style={{
              fontSize:   "clamp(2.1rem, 5vw, 3.2rem)",
              fontWeight: 800,
              lineHeight: 1.2,
              margin:     "0 0 18px",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldM}, #9E7C3A)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            הכוורת
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.6, color: C.fg, opacity: 0.95, margin: "0 0 14px" }}>
            לא קהילה של עוד תוכן. קהילה של הבהירות שלך.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, maxWidth: 560, margin: "0 auto 32px" }}>
            מנוי חודשי לכלים ושיטה שמחזירים לך את הבידול האמיתי שלך. בלב הכוורת עומד מנוע האות, אבחון אישי שמחזיר לך את מה שרק אתה יכול לתת.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signal"
              style={{
                background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
                color:        "#2a1d05",
                fontWeight:   800,
                fontSize:     16,
                borderRadius: 999,
                padding:      "14px 32px",
                textDecoration: "none",
                boxShadow:    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
              }}
            >
              להתחיל מהאות שלך ←
            </Link>
            <a
              href="#pricing"
              style={{
                background:   "transparent",
                color:        C.muted,
                fontWeight:   600,
                fontSize:     15,
                borderRadius: 999,
                padding:      "14px 28px",
                textDecoration: "none",
                border:       `1px solid ${C.line}`,
              }}
            >
              לראות מסלולים
            </a>
          </div>
          <p style={{ fontSize: 13, color: C.muted, margin: "16px 0 0" }}>
            האבחון חינם. אין כרטיס אשראי, אין הצטרפות מחויבת.
          </p>
        </div>
      </section>

      {/* ── What's in the Hive ─────────────────────────────── */}
      <section style={{ padding: "48px 24px", maxWidth: 880, margin: "0 auto" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>
          מה מחכה לך בפנים
        </h2>
        <p style={{ textAlign: "center", color: C.muted, fontSize: 15, margin: "0 0 36px" }}>
          ארבעה דברים. כל אחד עומד בזכות עצמו.
        </p>

        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap:                 16,
          }}
        >
          <PillarCard
            title="מנוע האות"
            body="חמש שאלות. אבחון אישי לפי שיטת TrueSignal©. מחזיר לך את הבידול שלך בלי שהדר צריכה להיות בחדר."
          />
          <PillarCard
            title="ספריית בינג'"
            body="תכנים מהשיטה. לא קורסים מוקלטים, פרקי עומק על איך לזהות ולחדד את האות בפועל."
          />
          <PillarCard
            title="רעיונות תוכן חודשיים"
            body="שני רעיונות תוכן מותאמים לאות הספציפי שלך. לא רעיונות כלליים. לא עוד מאה קווים."
          />
          <PillarCard
            title="גישה ישירה (במסלול המלא)"
            body="מפגש Zoom חודשי עם הדר וקבוצת WhatsApp פעילה של חברי הכוורת."
          />
        </div>
      </section>

      {/* ── Why us strip ─────────────────────────────────────── */}
      <section style={{ padding: "12px 24px 32px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div
          style={{
            background:   `linear-gradient(145deg, ${C.card}, #111620)`,
            border:       `1px solid ${C.line}`,
            borderRadius: 18,
            padding:      "26px 22px",
          }}
        >
          <p style={{ fontSize: 16, lineHeight: 1.7, color: C.fg, margin: 0 }}>
            יש מנויים חודשיים שמלמדים אותך לבנות חנות.
            <br />
            יש כאלה שמלמדים אותך להריץ קמפיינים.
            <br />
            <strong style={{ color: C.gold }}>הכוורת מלמדת אותך מה רק אתה יכול לתת.</strong>
          </p>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section style={{ padding: "32px 0 16px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "0 0 32px" }}>
          מסלולים
        </h2>
        <HivePricingSection />
      </section>

      {/* ── Footer note ──────────────────────────────────────── */}
      <section style={{ padding: "16px 24px 80px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: C.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
          ביטול בכל עת, ללא קנס. החזר מלא תוך 14 יום.
          <br />
          <Link href="/hive/terms" style={{ color: C.goldM, textDecoration: "none" }}>
            תנאי מנוי הכוורת
          </Link>
        </p>
      </section>
    </main>
  );
}

function PillarCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        background:   C.card,
        border:       `1px solid ${C.line}`,
        borderRadius: 16,
        padding:      "22px 22px",
      }}
    >
      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px", color: C.gold }}>
        {title}
      </h3>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: C.fg, opacity: 0.9, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
