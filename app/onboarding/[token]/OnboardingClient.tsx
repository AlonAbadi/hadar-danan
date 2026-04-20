"use client";

import { useState } from "react";

interface Product { name: string; price: number }
interface Testimonial { name: string; quote: string }
interface DocFile { name: string; url: string; type: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OnboardingClient({ app, token }: { app: Record<string, any>; token: string }) {
  const [whatsapp, setWhatsapp] = useState<string>(app.whatsapp ?? "");
  const [niche, setNiche] = useState<string>(app.niche ?? "");
  const [audience, setAudience] = useState<string>(app.target_audience ?? "");
  const [tone, setTone] = useState<string>(app.tone_keywords ?? "");
  const [products, setProducts] = useState<Product[]>(
    app.products?.length ? app.products : [{ name: "", price: 0 }, { name: "", price: 0 }, { name: "", price: 0 }]
  );
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    app.testimonials?.length ? app.testimonials : [{ name: "", quote: "" }, { name: "", quote: "" }]
  );
  const [businessType, setBusinessType] = useState<string>(app.business_type ?? "");
  const [businessId, setBusinessId] = useState<string>(app.business_id ?? "");
  const [businessAddress, setBusinessAddress] = useState<string>(app.business_address ?? "");
  const [documents, setDocuments] = useState<DocFile[]>(app.documents ?? []);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!app.onboarding_submitted_at);
  const [error, setError] = useState<string | null>(null);

  const alreadySubmitted = !!app.onboarding_submitted_at;

  const s = {
    page: { minHeight: "100vh", background: "#f4f7fb", fontFamily: "'Assistant', Arial, sans-serif", direction: "rtl" as const, padding: "0 0 60px" },
    header: { background: "#0a0a0f", padding: "24px 32px", marginBottom: 0 },
    wrapper: { maxWidth: 620, margin: "0 auto", padding: "0 16px" },
    card: { background: "#fff", borderRadius: 16, padding: "28px 28px", marginTop: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
    label: { fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 6, display: "block" },
    input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", color: "#1f2937", fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, background: "#fafafa" },
    textarea: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "12px 14px", color: "#1f2937", fontSize: 15, fontFamily: "inherit", outline: "none", resize: "vertical" as const, minHeight: 90, boxSizing: "border-box" as const, background: "#fafafa" },
    section: { fontSize: 17, fontWeight: 800, color: "#1f2937", marginBottom: 18 },
    divider: { height: 1, background: "#f3f4f6", margin: "24px 0" },
  };

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("token", token);
      const res = await fetch("/api/onboarding/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [...prev, { name: data.name, url: data.url, type: data.type }]);
      }
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  }

  async function handleSubmit() {
    if (!niche.trim()) { setError("נא למלא את שדה התחום / הנישה"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/onboarding/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp,
          niche,
          target_audience: audience,
          tone_keywords: tone,
          products: products.filter(p => p.name.trim()),
          testimonials: testimonials.filter(t => t.name.trim() && t.quote.trim()),
          documents,
          business_type: businessType,
          business_id: businessId,
          business_address: businessAddress,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "שגיאה בשמירה");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("שגיאת רשת — נסי שוב");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && !alreadySubmitted) {
    return (
      <div dir="rtl" style={s.page}>
        <div style={s.header}>
          <div style={s.wrapper}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>BeeGood · Atelier</div>
          </div>
        </div>
        <div style={{ ...s.wrapper, paddingTop: 60, textAlign: "center" }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1f2937", marginBottom: 12 }}>תודה, {app.name}!</div>
          <div style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
            קיבלנו את כל הפרטים שלך. הצוות יסקור אותם ויצור איתך קשר בקרוב עם האתר שלך.
          </div>
          <div style={{ marginTop: 32, background: "#fff", borderRadius: 16, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 4 }}>השלב הבא</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>Claude יבנה את הזהות הדיגיטלית שלך על בסיס המידע שסיפקת</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.wrapper}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>BeeGood · Atelier</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>שלום {app.name} 👋</div>
          <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 6 }}>מלאי את הטופס כדי שנוכל לבנות את הזהות הדיגיטלית שלך</div>
        </div>
      </div>

      <div style={s.wrapper}>
        {alreadySubmitted && (
          <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 12, padding: "14px 18px", marginTop: 20, fontSize: 14, color: "#065f46", fontWeight: 600 }}>
            ✓ שלחת את הטופס כבר — ניתן לעדכן ולשלוח שוב
          </div>
        )}

        {/* Contact */}
        <div style={s.card}>
          <div style={s.section}>פרטי יצירת קשר</div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>WhatsApp (מספר נייד)</label>
            <input style={s.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="05X-XXXXXXX" dir="ltr" />
          </div>
          <div>
            <label style={s.label}>Instagram</label>
            <input style={{ ...s.input, background: "#f9fafb", color: "#9ca3af", cursor: "default" }} value={app.instagram} readOnly dir="ltr" />
          </div>
        </div>

        {/* Brand & Identity */}
        <div style={s.card}>
          <div style={s.section}>מיתוג וזהות</div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>תחום / נישה *</label>
            <input style={s.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="למשל: מאמנת תזונה לנשים אחרי לידה" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>קהל יעד</label>
            <textarea style={s.textarea} value={audience} onChange={e => setAudience(e.target.value)} placeholder="למשל: נשים גילאי 30-45 שרוצות לרזות בלי דיאטה" />
          </div>
          <div>
            <label style={s.label}>טון וסגנון</label>
            <input style={s.input} value={tone} onChange={e => setTone(e.target.value)} placeholder="למשל: חמה, ישירה, מעצימה" />
          </div>
        </div>

        {/* Products */}
        <div style={s.card}>
          <div style={s.section}>המוצרים שלי</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>רשמי את המוצרים או השירותים שאת מציעה — שם ומחיר</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((p, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 110px 36px", gap: 8, alignItems: "center" }}>
                <input style={s.input} value={p.name} onChange={e => setProducts(products.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder={`מוצר ${i + 1}`} />
                <input style={{ ...s.input, direction: "ltr", textAlign: "right" }} type="number" value={p.price || ""} onChange={e => setProducts(products.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} placeholder="₪" />
                <button type="button" onClick={() => setProducts(products.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0, textAlign: "center" }}>×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setProducts([...products, { name: "", price: 0 }])} style={{ marginTop: 12, background: "transparent", border: "1.5px dashed #e5e7eb", borderRadius: 10, color: "#9ca3af", padding: "10px 18px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            + הוסף מוצר
          </button>
        </div>

        {/* Testimonials */}
        <div style={s.card}>
          <div style={s.section}>עדויות לקוחות</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>ציטוטים אמיתיים מלקוחות מרוצות — ככל שיותר, כך טוב יותר</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 16, position: "relative" }}>
                <button type="button" onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))} style={{ position: "absolute", top: 10, left: 12, background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ ...s.label, marginBottom: 4 }}>שם הלקוחה</label>
                  <input style={s.input} value={t.name} onChange={e => setTestimonials(testimonials.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="שם + גיל (אופציונלי)" />
                </div>
                <div>
                  <label style={{ ...s.label, marginBottom: 4 }}>מה היא אמרה?</label>
                  <textarea style={s.textarea} value={t.quote} onChange={e => setTestimonials(testimonials.map((x, j) => j === i ? { ...x, quote: e.target.value } : x))} placeholder="הציטוט שלה..." />
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setTestimonials([...testimonials, { name: "", quote: "" }])} style={{ marginTop: 12, background: "transparent", border: "1.5px dashed #e5e7eb", borderRadius: 10, color: "#9ca3af", padding: "10px 18px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>
            + הוסף עדות
          </button>
        </div>

        {/* Documents */}
        <div style={s.card}>
          <div style={s.section}>מסמכים ותוכן</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
            צרפי קבצים שמתארים את הקול, השיטה והמיתוג שלך — בריף, מצגת, מסמך אסטרטגיה וכד׳ (PDF, Word, טקסט)
          </div>
          {documents.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {documents.map((doc, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", borderRadius: 10, padding: "10px 14px", border: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{doc.type?.includes("pdf") ? "📄" : "📝"}</span>
                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#C9964A", textDecoration: "none", fontWeight: 600 }}>{doc.name}</a>
                  </div>
                  <button type="button" onClick={() => setDocuments(documents.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}
          <label style={{ display: "block", border: "2px dashed #e5e7eb", borderRadius: 12, padding: "20px", textAlign: "center", cursor: "pointer", color: "#9ca3af", fontSize: 14 }}>
            {uploadingDoc ? "⏳ מעלה..." : "לחצי להעלאת קובץ"}
            <div style={{ fontSize: 12, marginTop: 4 }}>PDF, Word, טקסט</div>
            <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={handleDocUpload} disabled={uploadingDoc} />
          </label>
        </div>

        {/* Business details */}
        <div style={s.card}>
          <div style={s.section}>פרטים עסקיים</div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>כתובת עסקית</label>
            <input style={s.input} value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="רחוב, עיר" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>סוג עסק</label>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              {["עוסק מורשה", "חברה בע\"מ"].map(t => (
                <button key={t} type="button" onClick={() => setBusinessType(t)} style={{
                  padding: "10px 18px", borderRadius: 10, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  background: businessType === t ? "#fff8f0" : "#f9fafb",
                  border: `1.5px solid ${businessType === t ? "#C9964A" : "#e5e7eb"}`,
                  color: businessType === t ? "#C9964A" : "#6b7280",
                  fontWeight: businessType === t ? 700 : 400,
                }}>{t}</button>
              ))}
            </div>
          </div>
          {businessType && (
            <div>
              <label style={s.label}>מספר {businessType === "חברה בע\"מ" ? "ח.פ" : "עוסק מורשה"}</label>
              <input style={s.input} value={businessId} onChange={e => setBusinessId(e.target.value)} placeholder="XXXXXXXXX" dir="ltr" />
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={{ marginTop: 24 }}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: "#dc2626" }}>
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%", padding: "18px", borderRadius: 12, border: "none", cursor: submitting ? "default" : "pointer",
              background: submitting ? "#e5e7eb" : "#C9964A",
              color: submitting ? "#9ca3af" : "#fff",
              fontSize: 17, fontWeight: 800, fontFamily: "inherit",
              opacity: submitting ? 0.8 : 1,
            }}
          >
            {submitting ? "⏳ שומר..." : alreadySubmitted ? "עדכן ושלח מחדש ←" : "שלח את הטופס ←"}
          </button>
          <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
            הפרטים שלך שמורים אצלנו בבטחה
          </div>
        </div>
      </div>
    </div>
  );
}
