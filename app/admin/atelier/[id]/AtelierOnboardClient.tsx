"use client";

import { useState, useEffect } from "react";

interface Analysis {
  fit_score: number;
  fit_label: string;
  niche_guess: string;
  audience_guess: string;
  strengths: string[];
  questions: string[];
  one_liner: string;
}

interface Product { name: string; price: number }

const PRESET_PRODUCTS: Product[] = [
  { name: "הדרכה חינמית", price: 0 },
  { name: "אתגר 7 ימים", price: 197 },
  { name: "סדנה יום אחד", price: 1080 },
  { name: "קורס דיגיטלי", price: 1800 },
  { name: "פגישת אסטרטגיה", price: 4000 },
  { name: "יום צילום פרמיום", price: 14000 },
  { name: "שותפות אסטרטגית", price: 10000 },
  { name: "מנוי חודשי (כוורת)", price: 97 },
];
interface Module { id: string; name: string; description: string; category: string }

const PRESET_MODULES: Module[] = [
  { id: "coupons",      name: "קופונים ודילים",        description: "קודי הנחה למשפיעניות ושותפים",         category: "שיווק" },
  { id: "quiz",         name: "Quiz אבחון",             description: "3 שאלות שמפנות לקורס המתאים",          category: "שיווק" },
  { id: "hive",         name: "קהילה חודשית (כוורת)",  description: "מנוי חודשי עם תוכן בלעדי",              category: "קהילה" },
  { id: "affiliate",    name: "תוכנית שותפים",          description: "קישורי אפיליאייט עם עמלות",             category: "שיווק" },
  { id: "challenge",    name: "אתגר ימים",              description: "אתגר קצר עם וידאו יומי",                category: "תוכן" },
  { id: "course",       name: "קורס וידאו",             description: "קורס מודולרי עם נגן מאובטח",            category: "תוכן" },
  { id: "ab_testing",   name: "A/B Testing",            description: "ניסויים על כותרות ו-CTAs",              category: "אנליטיקה" },
  { id: "whatsapp",     name: "WhatsApp אוטומציה",      description: "הודעות אוטומטיות לסגירת עגלות",         category: "שיווק" },
  { id: "strategy",     name: "הזמנת פגישה",            description: "יומן ותשלום לפגישות אסטרטגיה",          category: "מכירות" },
  { id: "premium_day",  name: "יום פרמיום",             description: "הזמנה ותשלום ליום צילום/עבודה",         category: "מכירות" },
  { id: "partnership",  name: "שותפות אסטרטגית",       description: "טופס ליד לשותפות עסקית גדולה",          category: "מכירות" },
  { id: "video_analytics", name: "אנליטיקת וידאו",     description: "מעקב צפייה, נפילות וסיום",              category: "אנליטיקה" },
];

const MODULE_CATEGORIES = ["שיווק", "תוכן", "קהילה", "מכירות", "אנליטיקה"];

interface PhysicalProduct { name: string; price: number; description: string; image_url: string }
interface DocFile { name: string; url: string; type: string }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AtelierOnboardClient({ app }: { app: Record<string, any> }) {
  const [niche, setNiche] = useState<string>(app.niche ?? "");
  const [audience, setAudience] = useState<string>(app.target_audience ?? "");
  const [tone, setTone] = useState<string>(app.tone_keywords ?? "");
  const [products, setProducts] = useState<Product[]>(
    app.products ?? [{ name: "", price: 0 }, { name: "", price: 0 }, { name: "", price: 0 }]
  );
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    app.testimonials ?? [{ name: "", quote: "" }, { name: "", quote: "" }]
  );
  const [modules, setModules] = useState<string[]>(app.modules ?? []);
  const [whatsapp, setWhatsapp] = useState<string>(app.whatsapp ?? "");
  const [businessType, setBusinessType] = useState<string>(app.business_type ?? "");
  const [businessId, setBusinessId] = useState<string>(app.business_id ?? "");
  const [businessAddress, setBusinessAddress] = useState<string>(app.business_address ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState<string>(app.hero_image_url ?? "");
  const [documents, setDocuments] = useState<DocFile[]>(app.documents ?? []);
  const [physicalProducts, setPhysicalProducts] = useState<PhysicalProduct[]>(
    app.physical_products ?? []
  );
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<Generated | null>(app.generated_content ?? null);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(app.selected_palette ?? null);
  const [genError, setGenError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(app.ai_analysis ?? null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (app.ai_analysis) return; // already cached — skip API call
    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/admin/atelier/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: app.name, instagram: app.instagram, story: app.story }),
      });
      const d = await res.json();
      if (d.analysis) {
        setAnalysis(d.analysis);
        // save to DB so next load uses cache
        await fetch(`/api/admin/atelier/applications?id=${app.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ai_analysis: d.analysis }),
        });
      }
    } catch { /* silent */ }
    finally { setAnalyzing(false); }
  }

  const s = {
    page: { minHeight: "100vh", background: "#0D1018", padding: "32px", fontFamily: "var(--font-assistant), Assistant, sans-serif" } as React.CSSProperties,
    card: { background: "#141820", border: "1px solid #2C323E", borderRadius: 12, padding: 28, marginBottom: 20 } as React.CSSProperties,
    label: { fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6 },
    input: { width: "100%", background: "#1D2430", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 14px", color: "#EDE9E1", fontSize: 14, fontFamily: "inherit", outline: "none" } as React.CSSProperties,
    textarea: { width: "100%", background: "#1D2430", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 14px", color: "#EDE9E1", fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" as const, minHeight: 80 } as React.CSSProperties,
    btn: { padding: "12px 28px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 14 } as React.CSSProperties,
    section: { fontSize: 18, fontWeight: 800, color: "#EDE9E1", marginBottom: 20 },
  };

  async function handleGenerate() {
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
          modules,
          whatsapp, business_type: businessType, business_id: businessId,
          business_address: businessAddress,
          physical_products: physicalProducts.filter(p => p.name),
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

  async function uploadFile(file: File, folder: string): Promise<{ url: string; name: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const res = await fetch("/api/admin/atelier/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    return res.json();
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    const result = await uploadFile(file, `hero/${app.id}`);
    if (result) {
      setHeroImageUrl(result.url);
      await fetch(`/api/admin/atelier/applications?id=${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero_image_url: result.url }),
      });
    }
    setUploadingHero(false);
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    const result = await uploadFile(file, `docs/${app.id}`);
    if (result) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const type = ext === "pdf" ? "pdf" : "word";
      const newDocs = [...documents, { name: result.name, url: result.url, type }];
      setDocuments(newDocs);
      await fetch(`/api/admin/atelier/applications?id=${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: newDocs }),
      });
    }
    setUploadingDoc(false);
  }

  async function handlePhysicalProductImageUpload(idx: number, file: File) {
    const result = await uploadFile(file, `products/${app.id}`);
    if (result) {
      setPhysicalProducts(physicalProducts.map((p, i) => i === idx ? { ...p, image_url: result.url } : p));
    }
  }

  async function savePalette(paletteId: string) {
    setSelectedPalette(paletteId);
    await fetch(`/api/admin/atelier/applications?id=${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_palette: paletteId }),
    });
  }

  return (
    <div dir="rtl" style={s.page}>
      <button style={{ color: "#9E9990", fontSize: 13, cursor: "pointer", marginBottom: 24, display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", fontFamily: "inherit" }} onClick={() => window.history.back()}>
        ← חזרה לרשימה
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#EDE9E1" }}>{app.name}</div>
        <div style={{ fontSize: 13, color: "#9E9990", marginTop: 4 }}>{app.instagram} · {app.phone}</div>
      </div>

      {/* AI Analysis */}
      <div style={{ ...s.card, borderColor: analyzing ? "#2C323E" : analysis ? "#C9964A44" : "#2C323E" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#EDE9E1" }}>ניתוח ליד — Claude</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {analyzing && <div style={{ fontSize: 12, color: "#9E9990" }}>⏳ מנתח...</div>}
            {!analyzing && <button type="button" onClick={runAnalysis} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 12, padding: 0 }} title="הרץ מחדש">↻ רענן</button>}
          </div>
          {analysis && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", border: `3px solid ${analysis.fit_score >= 7 ? "#34A853" : analysis.fit_score >= 5 ? "#E8B94A" : "#9E9990"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "#EDE9E1",
              }}>{analysis.fit_score}</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: analysis.fit_score >= 7 ? "#34A853" : analysis.fit_score >= 5 ? "#E8B94A" : "#9E9990" }}>{analysis.fit_label}</span>
            </div>
          )}
        </div>

        {analysis && (
          <>
            <div style={{ background: "#1D2430", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 15, color: "#EDE9E1", lineHeight: 1.6, fontStyle: "italic" }}>
              &ldquo;{analysis.one_liner}&rdquo;
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8 }}>נישה משוערת</div>
                <div style={{ fontSize: 14, color: "#EDE9E1" }}>{analysis.niche_guess}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8 }}>קהל משוער</div>
                <div style={{ fontSize: 14, color: "#EDE9E1" }}>{analysis.audience_guess}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8 }}>חוזקות</div>
                {analysis.strengths.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#EDE9E1" }}>
                    <span style={{ color: "#34A853" }}>✓</span> {s}
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9E9990", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 8 }}>שאלות לשיחת גילוי</div>
                {analysis.questions.map((q, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: "#EDE9E1" }}>
                    <span style={{ color: "#C9964A" }}>{i + 1}.</span> {q}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Story */}
      <div style={s.card}>
        <div style={s.label}>הסיפור שלה</div>
        <div style={{ fontSize: 15, color: "#EDE9E1", lineHeight: 1.75, marginTop: 6 }}>{app.story}</div>
      </div>

      {/* Business details */}
      <div style={s.card}>
        <div style={s.section}>פרטים עסקיים</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <div style={s.label}>WhatsApp (מספר נייד)</div>
            <input style={s.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="05X-XXXXXXX" dir="ltr" />
          </div>
          <div>
            <div style={s.label}>כתובת עסקית</div>
            <input style={s.input} value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="רחוב, עיר" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
          <div>
            <div style={s.label}>סוג עסק</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {["עוסק מורשה", "חברה בע\"מ"].map(t => (
                <button key={t} type="button" onClick={() => setBusinessType(t)} style={{
                  padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  background: businessType === t ? "rgba(201,150,74,0.15)" : "#1D2430",
                  border: `1px solid ${businessType === t ? "#C9964A" : "#2C323E"}`,
                  color: businessType === t ? "#C9964A" : "#9E9990", fontWeight: businessType === t ? 700 : 400,
                }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={s.label}>מספר {businessType === "חברה בע\"מ" ? "ח.פ" : "עוסק מורשה"}</div>
            <input style={s.input} value={businessId} onChange={e => setBusinessId(e.target.value)} placeholder="XXXXXXXXX" dir="ltr" />
          </div>
        </div>
      </div>

      {/* Media & documents */}
      <div style={s.card}>
        <div style={s.section}>מדיה ומסמכים</div>

        {/* Hero image */}
        <div style={{ marginBottom: 24 }}>
          <div style={s.label}>תמונת Hero לאתר</div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 10 }}>
            {heroImageUrl ? (
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImageUrl} alt="hero" style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #2C323E" }} />
                <button type="button" onClick={() => setHeroImageUrl("")} style={{ position: "absolute", top: -8, left: -8, background: "#EA4335", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              </div>
            ) : (
              <div style={{ width: 120, height: 80, borderRadius: 8, border: "2px dashed #2C323E", display: "flex", alignItems: "center", justifyContent: "center", color: "#9E9990", fontSize: 12 }}>
                {uploadingHero ? "⏳" : "אין תמונה"}
              </div>
            )}
            <label style={{ ...s.btn, background: "#1D2430", border: "1px solid #2C323E", color: "#9E9990", cursor: "pointer", padding: "10px 18px" }}>
              {uploadingHero ? "מעלה..." : "בחר תמונה"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleHeroUpload} disabled={uploadingHero} />
            </label>
          </div>
        </div>

        {/* Documents */}
        <div>
          <div style={s.label}>קבצי תוכן / בריף (Word / PDF)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "10px 0" }}>
            {documents.map((doc, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1D2430", borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{doc.type === "pdf" ? "📄" : "📝"}</span>
                  <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#C9964A", textDecoration: "none" }}>{doc.name}</a>
                </div>
                <button type="button" onClick={() => setDocuments(documents.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
          <label style={{ ...s.btn, background: "transparent", border: "1px dashed #2C323E", color: "#9E9990", padding: "8px 16px", fontSize: 13, cursor: "pointer", display: "inline-block" }}>
            {uploadingDoc ? "⏳ מעלה..." : "+ הוסף קובץ"}
            <input type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleDocUpload} disabled={uploadingDoc} />
          </label>
        </div>
      </div>

      {/* Physical products */}
      <div style={s.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={s.section}>מוצרים פיזיים (1–3)</div>
          {physicalProducts.length < 3 && (
            <button type="button" onClick={() => setPhysicalProducts([...physicalProducts, { name: "", price: 0, description: "", image_url: "" }])}
              style={{ ...s.btn, background: "transparent", border: "1px dashed #2C323E", color: "#9E9990", padding: "8px 16px", fontSize: 13 }}>
              + הוסף מוצר
            </button>
          )}
        </div>
        {physicalProducts.length === 0 && (
          <div style={{ color: "#9E9990", fontSize: 13, textAlign: "center", padding: "20px 0" }}>בושם, תכשיט, מוצר ברנד של המשפיענית — עד 3 מוצרים</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {physicalProducts.map((p, i) => (
            <div key={i} style={{ background: "#1D2430", borderRadius: 10, padding: 16, display: "grid", gridTemplateColumns: "80px 1fr", gap: 14 }}>
              {/* Image upload */}
              <label style={{ cursor: "pointer" }}>
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #2C323E" }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed #2C323E", display: "flex", alignItems: "center", justifyContent: "center", color: "#9E9990", fontSize: 11, textAlign: "center" }}>תמונה</div>
                )}
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) handlePhysicalProductImageUpload(i, e.target.files[0]); }} />
              </label>
              {/* Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                  <input style={s.input} value={p.name} onChange={e => setPhysicalProducts(physicalProducts.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="שם המוצר" />
                  <input style={{ ...s.input, direction: "ltr" }} type="number" value={p.price || ""} onChange={e => setPhysicalProducts(physicalProducts.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} placeholder="₪" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...s.input, flex: 1 }} value={p.description} onChange={e => setPhysicalProducts(physicalProducts.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} placeholder="תיאור קצר — רכיבים, ייחוד..." />
                  <button type="button" onClick={() => setPhysicalProducts(physicalProducts.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 18, padding: "0 8px" }}>×</button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
            <div style={s.label}>קהל יעד</div>
            <input style={s.input} value={audience} onChange={e => setAudience(e.target.value)} placeholder="למשל: נשים 30-45 שרוצות לרזות בלי דיאטה" />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={s.label}>טון וסגנון</div>
          <input style={s.input} value={tone} onChange={e => setTone(e.target.value)} placeholder="למשל: חמה, ישירה, מעצימה" />
        </div>

        {/* Modules */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={s.label}>מודולים פעילים</div>
            <span style={{ fontSize: 12, color: "#9E9990" }}>{modules.length} נבחרו</span>
          </div>
          {MODULE_CATEGORIES.map(cat => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#9E9990", marginBottom: 8, fontWeight: 700, letterSpacing: "0.05em" }}>{cat}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESET_MODULES.filter(m => m.category === cat).map(mod => {
                  const on = modules.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      title={mod.description}
                      onClick={() => setModules(on ? modules.filter(id => id !== mod.id) : [...modules, mod.id])}
                      style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                        fontFamily: "inherit", transition: "all 0.15s",
                        background: on ? "rgba(201,150,74,0.12)" : "#1D2430",
                        border: `1px solid ${on ? "#C9964A" : "#2C323E"}`,
                        color: on ? "#C9964A" : "#9E9990",
                        fontWeight: on ? 700 : 400,
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, textAlign: "right",
                      }}
                    >
                      <span>{on ? "✓ " : ""}{mod.name}</span>
                      <span style={{ fontSize: 11, opacity: 0.65, fontWeight: 400 }}>{mod.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Products */}
        <div style={{ marginBottom: 20 }}>
          <div style={s.label}>מוצרים במשפך</div>

          {/* Presets */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 14px" }}>
            {PRESET_PRODUCTS.map(preset => {
              const isSelected = products.some(p => p.name === preset.name);
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setProducts(products.filter(p => p.name !== preset.name));
                    } else {
                      setProducts([...products.filter(p => p.name), { ...preset }]);
                    }
                  }}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.15s",
                    background: isSelected ? "rgba(201,150,74,0.15)" : "#1D2430",
                    border: `1px solid ${isSelected ? "#C9964A" : "#2C323E"}`,
                    color: isSelected ? "#C9964A" : "#9E9990",
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {isSelected ? "✓ " : ""}{preset.name}
                  {preset.price > 0 && <span style={{ marginRight: 4, opacity: 0.7, fontSize: 11 }}>₪{preset.price.toLocaleString()}</span>}
                  {preset.price === 0 && <span style={{ marginRight: 4, opacity: 0.7, fontSize: 11 }}>חינם</span>}
                </button>
              );
            })}
          </div>

          {/* Selected + editable */}
          {products.filter(p => p.name).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {products.filter(p => p.name).map((p, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 8, alignItems: "center" }}>
                  <input style={s.input} value={p.name} onChange={e => setProducts(products.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input style={{ ...s.input, direction: "ltr" }} type="number" value={p.price || ""} onChange={e => setProducts(products.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))} placeholder="₪" />
                  <button type="button" onClick={() => setProducts(products.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={() => setProducts([...products.filter(p => p.name), { name: "", price: 0 }])} style={{ ...s.btn, background: "transparent", border: "1px dashed #2C323E", color: "#9E9990", padding: "7px 14px", fontSize: 13 }}>+ הוסף מוצר ידני</button>
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
                <button key={p.id} onClick={() => savePalette(p.id)} style={{ background: p.bg, border: `3px solid ${selectedPalette === p.id ? p.accent : "transparent"}`, borderRadius: 12, padding: 20, cursor: "pointer", textAlign: "right", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.text, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    {[p.bg, p.accent, p.text, p.muted].map((c, i) => (
                      <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: "1px solid rgba(0,0,0,0.1)" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: p.muted, lineHeight: 1.5 }}>{p.rationale}</div>
                  {selectedPalette === p.id && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: p.accent }}>✓ נבחרה</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Copy */}
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

            <div style={{ marginBottom: 20 }}>
              <div style={s.label}>מיילים אוטומטיים</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {[
                  { label: "ברוכים הבאים", data: generated.emails.welcome },
                  { label: "פולו-אפ 24 שעות", data: generated.emails.followup_24h },
                  { label: "עגלה נטושה", data: generated.emails.cart_abandon },
                ].map((e, i) => (
                  <div key={i} style={{ background: "#1D2430", borderRadius: 8, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#C9964A", fontWeight: 700, marginBottom: 6 }}>{e.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#EDE9E1", marginBottom: 4 }}>נושא: {e.data.subject}</div>
                    <div style={{ fontSize: 13, color: "#9E9990", lineHeight: 1.6 }}>{e.data.preview}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={s.label}>שאלות Quiz</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                {generated.quiz_questions.map((q, i) => (
                  <div key={i} style={{ background: "#1D2430", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#EDE9E1", marginBottom: 8 }}>{i + 1}. {q.question}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {q.options.map((o, j) => <span key={j} style={{ padding: "4px 12px", borderRadius: 20, background: "#2C323E", fontSize: 12, color: "#9E9990" }}>{o}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

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

          {/* Checklist */}
          <div style={{ ...s.card, borderColor: "#34A85344" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#34A853", marginBottom: 16 }}>✓ תוכן נוצר — השלבים הבאים</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { text: `git clone beegood-template → ${app.name.toLowerCase().replace(/\s/g, "-")}`, mono: true },
                { text: "הצב lib/client.ts עם התוכן שנוצר" },
                { text: "העלה תמונות ל-/public" },
                { text: "צור Supabase project חדש + הרץ migrations" },
                { text: "צור Vercel project + הגדר env vars" },
                { text: "הגדר דומיין + DNS" },
                { text: "הגדר Resend domain + DNS records" },
                { text: "הגדר Google OAuth" },
                { text: "קבל Cardcom terminal מהלקוחה" },
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                  <span style={{ color: "#C9964A", fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                  <span style={{ fontFamily: step.mono ? "monospace" : "inherit", color: step.mono ? "#E8B94A" : "#9E9990" }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
