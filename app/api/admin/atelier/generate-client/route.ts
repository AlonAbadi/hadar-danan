import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY חסר" }, { status: 500 });
  }

  const body = await req.json();
  const { app, generated, selectedPalette } = body;

  if (!app?.name || !generated) {
    return NextResponse.json({ error: "חסרים נתונים" }, { status: 400 });
  }

  const palette = generated.palettes?.find((p: { id: string }) => p.id === selectedPalette)
    ?? generated.palettes?.[0]
    ?? { bg: "#0D1018", accent: "#C9964A", text: "#EDE9E1", muted: "#9E9990" };

  const productsText = Array.isArray(app.products)
    ? app.products.filter((p: { name: string }) => p.name)
        .map((p: { name: string; price: number }) => `${p.name} — ₪${p.price}`)
        .join(", ")
    : "";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are a TypeScript and Next.js expert. Your task: write a complete, ready-to-use \`lib/client.ts\` file for a new beegood client.

Instructions:
- Output ONLY TypeScript code — no explanations, no markdown fences
- Every value must be complete and real — no placeholders
- Follow the structure below EXACTLY — same key names, same file extensions, same import expressions
- Use the provided data to create real, compelling marketing copy
- All text in Hebrew (except name_en, domain)
- For modules: output true or false (not strings, not placeholders)

Client data:
- Name: ${app.name}
- Instagram: ${app.instagram ?? "unknown"}
- Niche: ${app.niche ?? ""}
- Target audience: ${app.target_audience ?? ""}
- WhatsApp: ${app.whatsapp ?? "972XXXXXXXXX"}
- Business type: ${app.business_type ?? "עוסק מורשה"}
- Tax ID: ${app.business_id ?? "XXXXXXXXX"}
- Domain: ${app.domain ?? "example.com"}

Products: ${productsText || "none specified"}
Active modules: ${Array.isArray(app.modules) ? app.modules.join(", ") : ""}

Generated content:
- Hero headline: ${generated.hero?.headline ?? ""}
- Hero subtitle: ${generated.hero?.sub ?? ""}
- About title: ${generated.about?.title ?? ""}
- About body: ${generated.about?.body ?? ""}
- Free training: ${generated.free_training?.title ?? "הדרכה חינמית"} — ${generated.free_training?.description ?? ""}
- Welcome email subject: ${generated.emails?.welcome?.subject ?? ""}
- Social proof: ${generated.social_proof?.stat1?.number ?? "250+"} ${generated.social_proof?.stat1?.label ?? "לקוחות"}, ${generated.social_proof?.stat2?.number ?? "4"} ${generated.social_proof?.stat2?.label ?? "שנים"}, ${generated.social_proof?.stat3?.number ?? "97%"} ${generated.social_proof?.stat3?.label ?? "ממליצים"}
- Tagline (below stats): describe in 5-8 Hebrew words the unique value of ${app.name}

Selected color palette (${palette.name ?? ""}):
- bg: ${palette.bg}
- accent: ${palette.accent}
- text (fg): ${palette.text}
- muted (fg_muted): ${palette.muted}

Choose the design_preset that best matches this palette:
- dark_gold  → dark background + warm gold/amber accent
- warm_earth → light/cream background + warm terracotta/orange accent
- cool_slate → dark background + cool blue/electric accent
- rose_blush → light/cream background + pink/rose/red accent

Then derive all additional colors (bg_dark, card, card_soft, border, accent_light, accent_dark, fg, fg_muted) consistent with the chosen preset and the palette above.

Output the complete file in exactly this format:

export const CLIENT = {

  // ─── Brand ───────────────────────────────────────────────
  name:          "FILL",
  name_en:       "FILL",
  legal_name:    "FILL",
  company_id:    "FILL",
  domain:        "FILL",
  whatsapp:      "FILL",

  // ─── Meta & SEO ──────────────────────────────────────────
  meta: {
    title:       "FILL",
    description: "FILL",
    og_image:    "/og-image.jpg",
  },

  // ─── Design Preset ───────────────────────────────────────
  design_preset: "dark_gold" as import("@/lib/design-presets").DesignPreset,

  color_overrides: undefined as
    | Partial<Pick<import("@/lib/design-presets").PresetTokens, "accent" | "accent_light" | "accent_dark" | "btn_text">>
    | undefined,

  // ─── Colors ──────────────────────────────────────────────
  colors: {
    bg:           "FILL",
    bg_dark:      "FILL",
    card:         "FILL",
    card_soft:    "FILL",
    border:       "FILL",
    accent:       "FILL",
    accent_light: "FILL",
    accent_dark:  "FILL",
    fg:           "FILL",
    fg_muted:     "FILL",
  },

  // ─── Hero ────────────────────────────────────────────────
  hero: {
    image:       "/hero.jpg",
    image_alt:   "FILL",
    headline_a:  "FILL",
    headline_b:  "FILL",
    desc_a:      "FILL",
    desc_b:      "FILL",
    cta_a:       "FILL ←",
    cta_b:       "FILL ←",
  },

  // ─── Social proof ────────────────────────────────────────
  social_proof: {
    stat1: { number: "FILL", label: "FILL" },
    stat2: { number: "FILL", label: "FILL" },
    stat3: { number: "FILL", label: "FILL" },
    tagline: "FILL",
  },

  // ─── Products ────────────────────────────────────────────
  products: {
    training:    { title: "FILL", slug: "/training",    price: 0,     description: "FILL", image: "/training.jpg",    vimeo_id: "" },
    challenge:   { title: "FILL", slug: "/challenge",   price: 197,   description: "FILL", image: "/challenge.jpg",   vimeo_id: "" },
    workshop:    { title: "FILL", slug: "/workshop",    price: 1080,  description: "FILL", image: "/workshop.jpg" },
    course:      { title: "FILL", slug: "/course",      price: 1800,  description: "FILL", image: "/course.jpg" },
    strategy:    { title: "FILL", slug: "/strategy",    price: 4000,  description: "FILL", image: "/strategy.jpg",    vimeo_id: "" },
    premium:     { title: "FILL", slug: "/premium",     price: 14000, description: "FILL", image: "/premium.jpg" },
    partnership: { title: "FILL", slug: "/partnership", price: 10000, description: "FILL", image: "/partnership.jpg" },
    hive:        { title: "FILL", slug: "/hive",        price_basic: 97, price_discounted: 29, description: "FILL", image: "/hive.jpg" },
  },

  // ─── About ───────────────────────────────────────────────
  about: {
    title:   "FILL",
    tagline: "FILL",
    body:    "FILL",
    image:   "/about.jpg",
  },

  // ─── Email ───────────────────────────────────────────────
  email: {
    from_name:  "FILL",
    from_email: "noreply@FILL",
    signature:  "FILL · ישראל",
  },

  // ─── Analytics ───────────────────────────────────────────
  analytics: {
    meta_pixel_id:     "",
    ga_measurement_id: "",
  },

  // ─── Modules ─────────────────────────────────────────────
  modules: {
    quiz:            FILL_BOOL,
    hive:            FILL_BOOL,
    challenge:       FILL_BOOL,
    course:          FILL_BOOL,
    workshop:        FILL_BOOL,
    strategy:        FILL_BOOL,
    premium:         FILL_BOOL,
    partnership:     FILL_BOOL,
    deals:           false,
    ab_testing:      true,
    video_analytics: FILL_BOOL,
  },

} as const;

Replace every FILL with the real Hebrew value, every FILL_BOOL with true or false, and replace "dark_gold" in design_preset with the correct preset name. Keep all other tokens (import expressions, file paths, key names) exactly as written.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```typescript\s*/i, "").replace(/^```ts\s*/i, "").replace(/\s*```$/i, "").trim();

    return NextResponse.json({ code: cleaned });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-client] error:", msg);
    return NextResponse.json({ error: `שגיאה: ${msg}` }, { status: 500 });
  }
}
