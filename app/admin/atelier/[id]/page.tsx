"use client";

import { useState, useEffect } from "react";

interface Product { name: string; price: number }
interface Testimonial { name: string; quote: string }
interface Palette {
  id: string; name: string;
  bg: string; accent: string; text: string; muted: string;
  rationale: string;
}
interface Generated {
  hero: { headline: string; sub: string };
  about: { title: string; body: string };
  free_training: { title: string; description: string };
  emails: {
    welcome: { subject: string; preview: string };
    followup_24h: { subject: string; preview: string };
    cart_abandon: { subject: string; preview: string };
  };
  quiz_questions: { question: string; options: string[] }[];
  social_proof: {
    stat1: { number: string; label: string };
    stat2: { number: string; label: string };
    stat3: { number: string; label: string };
  };
  palettes: Palette[];
}

interface Application {
  id: string; name: string; phone: string; instagram: string;
  story: string; status: string; created_at: string;
  niche?: string; target_audience?: string; tone_keywords?: string;
  products?: Product[]; testimonials?: Testimonial[];
  generated_content?: Generated; selected_palette?: string;
}

const s = {
  page: { minHeight: "100vh", background: "#0D1018", padding: "32px", fontFamily: "var(--font-assistant), Assistant, sans-serif" } as React.CSSProperties,
  back: { color: "#9E9990", fontSize: 13, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", fontFamily: "inherit" } as React.CSSProperties,
  card: { background: "#141820", border: "1px solid #2C323E", borderRadius: 12, padding: 28, marginBottom: 20 } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6 },
  input: { width: "100%", background: "#1D2430", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 14px", color: "#EDE9E1", fontSize: 14, fontFamily: "inherit", outline: "none" } as React.CSSProperties,
  textarea: { width: "100%", background: "#1D2430", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 14px", color: "#EDE9E1", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" as const, minHeight: 80 } as React.CSSProperties,
  btn: { padding: "12px 28px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14 } as React.CSSProperties,
  section: { fontSize: 18, fontWeight: 800, color: "#EDE9E1", marginBottom: 20 },
  muted: { fontSize: 13, color: "#9E9990" },
};

export default function AtelierDetailPage({ params }: { params: { id: string } }) {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [products, setProducts] = useState<Product[]>([
    { name: "", price: 0 }, { name: "", price: 0 }, { name: "", price: 0 },
  ]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    { name: "", quote: "" }, { name: "", quote: "" },
  ]);

  // Generate state
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/atelier/applications?id=${params.id}`)
      .then(r => r.json())
      .then(d => {
        const a: Application = d.application;
        if (a) {
          setApp(a);
          if (a.niche) setNiche(a.niche);
          if (a.target_audience) setAudience(a.target_audience);
          if (a.tone_keywords) setTone(a.tone_keywords);
          if (a.products) setProducts(a.products);
          if (a.testimonials) setTestimonials(a.testimonials);
          if (a.generated_content) setGenerated(a.generated_content);
          if (a.selected_palette) setSelectedPalette(a.selected_palette);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleGenerate() {
    if (!app) return;
    setGenerating(true);
    setGenError(null);
    setGenerated(null);
    try {
      const res = await fetch("/api/admin/atelier/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: app.id,
          name: app.name,
          niche, target_audience: audience, tone_keywords: tone,
          products: products.filter(p => p.name),
          testimonials: testimonials.filter(t => t.name && t.quote),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setGenError(data.error ?? "שגיאה"); return; }
      setGenerated(data.generated);
    } catch {
      setGenError("שגיאת רשת");
    } finally {
      setGenerating(false);
    }
  }

  async function savePalette(paletteId: string) {
    setSelectedPalette(paletteId);
    await fetch(`/api/admin/atelier/applications?id=${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_palette: paletteId }),
    });
  }

  if (loading) return <div style={{ ...s.page, color: "#9E9990" }}>טוען...</div>;
  if (!app) return <div style={{ ...s.page, color: "#9E9990" }}>לא נמצא</div>;

  return (
    <div dir="rtl" style={s.page}>
      <button style={s.back} onClick={() => window.history.back()}>← חזרה לרשימה</button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#EDE9E1" }}>{app.name}</div>
        <div style={{ fontSize: 13, color: "#9E9990", marginTop: 4 }}>{app.instagram} · {app.phone}</div>
        <div style={{
          display: "inline-block", marginTop: 10, padding: "3px 14px", borderRadius: 9999,
          fontSize: 12, fontWeight: 700,
          background: app.status === "accepted" ? "#34A85322" : "#C9964A22",
          color: app.status === "accepted" ? "#34A853" : "#C9964A",
          border: `1px solid ${app.status === "accepted" ? "#34A85344" : "#C9964A44"}`,
        }}>
          {app.status === "accepted" ? "התקבלה" : app.status}
        </div>
      </div>

      {/* Story */}
      <div style={s.card}>
        <div style={s.label}>הסיפור שלה</div>
        <div style={{ fontSize: 15, color: "#EDE9E1", lineHeight: 1.75, marginTop: 6 }}>{app.story}</div>
      </div>

      {/* Onboarding form */}
      <div style={s.card}>
        <div style={s.section}>בריף לאתר</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <div style={s.label}>תחום / נישה *</div>
            <input style={s.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="למשל: מאמנת תזונה לנשים אחרי לידה" />
          </div>
          <div>
            <div style={s.label}>קהל יעד *</div>
            <input style={s.input} value={audience} onChange={e => setAudience(e.target.value)} placeholder="למשל: נשים 30-45 שרוצות לרזות בלי דיאטה" />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={s.label}>טון וסגנון</div>
          <input style={s.input} value={tone} onChange={e => setTone(e.target.value)} placeholder="למשל: חמה, ישירה, מעצימה, לא שיפוטית" />
        </div>

        {/* Products */}
        <div style={{ marginBottom: 20 }}>
          <div style={s.label}>מוצרים במשפך</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {products.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
                <input style={s.input} value={p.name} onChange={e => setProducts(products.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={`מוצר ${i + 1}`} />
                <input style={{ ...s.input, direction: "ltr" }} type="number" value={p.price || ""} onChange={e => setProducts(products.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} placeholder="מחיר ₪" />
              </div>
            ))}
            <button onClick={() => setProducts([...products, { name: "", price: 0 }])} style={{ ...s.btn, background: "transparent", border: "1px dashed #2C323E", color: "#9E9990", padding: "8px 16px" }}>+ מוצר נוסף</button>
          </div>
        </div>

        {/* Testimonials */}
        <div style={{ marginBottom: 28 }}>
          <div style={s.label}>עדויות לקוחות</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: "#1D2430", border: "1px solid #2C323E", borderRadius: 8, padding: 14 }}>
                <input style={{ ...s.input, background: "transparent", border: "none", padding: "0 0 8px 0", borderBottom: "1px solid #2C323E", marginBottom: 8 }} value={t.name} onChange={e => setTestimonials(testimonials.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="שם הלקוחה" />
                <textarea style={{ ...s.textarea, background: "transparent", border: "none", padding: 0, minHeight: 60 }} value={t.quote} onChange={e => setTestimonials(testimonials.map((x, j) => j === i ? { ...x, quote: e.target.value } : x))} placeholder="הציטוט שלה..." />
              </div>
            ))}
            <button onClick={() => setTestimonials([...testimonials, { name: "", quote: "" }])} style={{ ...s.btn, background: "transparent", border: "1px dashed #2C323E", color: "#9E9990", padding: "8px 16px" }}>+ עדות נוספת</button>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !niche}
          style={{ ...s.btn, background: generating ? "#2C323E" : "linear-gradient(135deg, #E8B94A, #C9964A)", color: generating ? "#9E9990" : "#0D1018", width: "100%", padding: "16px", fontSize: 16 }}
        >
          {generating ? "⏳ יוצר עם Claude..." : "✨ צור אתר עם Claude"}
        </button>
        {genError && <div style={{ color: "#EA4335", marginTop: 10, fontSize: 13 }}>{genError}</div>}
      </div>

      {/* Results */}
      {generated && (
        <>
          {/* Palettes */}
          <div style={s.card}>
            <div style={s.section}>בחר פלטת צבעים</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {generated.palettes.map(p => (
                <button
                  key={p.id}
                  onClick={() => savePalette(p.id)}
                  style={{
                    background: p.bg, border: `3px solid ${selectedPalette === p.id ? p.accent : "transparent"}`,
                    borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "right",
                    boxShadow: selectedPalette === p.id ? `0 0 0 2px ${p.accent}` : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.text, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[p.bg, p.accent, p.text, p.muted].map((c, i) => (
                      <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: "1px solid rgba(0,0,0,0.1)" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: p.muted, lineHeight: 1.5 }}>{p.rationale}</div>
                  {selectedPalette === p.id && (
                    <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: p.accent }}>✓ נבחרה</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Copy preview */}
          <div style={s.card}>
            <div style={s.section}>תוכן שנוצר</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div style={{ background: "#1D2430", borderRadius: 10, padding: 20 }}>
                <div style={s.label}>דף הבית — Hero</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1", margin: "12px 0 8px" }}>{generated.hero.headline}</div>
                <div style={{ fontSize: 14, color: "#9E9990", lineHeight: 1.6 }}>{generated.hero.sub}</div>
              </div>
              <div style={{ background: "#1D2430", borderRadius: 10, padding: 20 }}>
                <div style={s.label}>עמוד About</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#EDE9E1", margin: "12px 0 8px" }}>{generated.about.title}</div>
                <div style={{ fontSize: 14, color: "#9E9990", lineHeight: 1.6 }}>{generated.about.body}</div>
              </div>
            </div>

            {/* Emails */}
            <div style={{ marginBottom: 20 }}>
              <div style={s.label}>מיילים אוטומטיים</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {[
                  { key: "welcome", label: "ברוכים הבאים", data: generated.emails.welcome },
                  { key: "followup", label: "פולו-אפ 24 שעות", data: generated.emails.followup_24h },
                  { key: "abandon", label: "עגלה נטושה", data: generated.emails.cart_abandon },
                ].map(e => (
                  <div key={e.key} style={{ background: "#1D2430", borderRadius: 8, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ fontSize: 12, color: "#C9964A", fontWeight: 700 }}>{e.label}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#EDE9E1", marginBottom: 4 }}>נושא: {e.data.subject}</div>
                    <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.6 }}>{e.data.preview}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz */}
            <div style={{ marginBottom: 20 }}>
              <div style={s.label}>שאלות Quiz</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {generated.quiz_questions.map((q, i) => (
                  <div key={i} style={{ background: "#1D2430", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#EDE9E1", marginBottom: 8 }}>{i + 1}. {q.question}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {q.options.map((o, j) => (
                        <span key={j} style={{ padding: "4px 12px", borderRadius: 20, background: "#2C323E", fontSize: 12, color: "#9E9990" }}>{o}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social proof */}
            <div>
              <div style={s.label}>Social Proof</div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                {Object.values(generated.social_proof).map((stat: { number: string; label: string }, i) => (
                  <div key={i} style={{ background: "#1D2430", borderRadius: 8, padding: "14px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#C9964A" }}>{stat.number}</div>
                    <div style={{ fontSize: 12, color: "#9E9990" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div style={{ ...s.card, borderColor: "#34A85344" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#34A853", marginBottom: 16 }}>✓ תוכן נוצר — השלבים הבאים</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "git clone beegood-template → " + app.name.toLowerCase().replace(/\s/g, "-"),
                "הצב lib/client.ts עם התוכן שנוצר",
                "העלה תמונות ל-/public",
                "צור Supabase project חדש + הרץ migrations",
                "צור Vercel project + הגדר env vars",
                "הגדר דומיין + DNS",
                "הגדר Resend domain + DNS records",
                "הגדר Google OAuth",
                "קבל Cardcom terminal מהלקוחה",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "#9E9990" }}>
                  <span style={{ color: "#C9964A", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ fontFamily: i === 0 ? "monospace" : "inherit", color: i === 0 ? "#E8B94A" : "#9E9990" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
