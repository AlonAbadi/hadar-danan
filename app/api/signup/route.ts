import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SignupSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendCapiEvent } from "@/lib/meta-capi";
import { Resend } from "resend";

const PRODUCT_NAME: Record<string, string> = {
  challenge_197:  "אתגר 7 ימים (₪197)",
  workshop_1080:  "סדנה יום אחד (₪1,080)",
  course_1800:    "קורס דיגיטלי (₪1,800)",
  strategy_4000:  "פגישת אסטרטגיה (₪4,000)",
  premium_14000:  "יום צילום פרמיום (₪14,000)",
};
// quiz_results.recommended_product stores short keys — normalize to full product keys
const QUIZ_KEY_MAP: Record<string, string> = {
  challenge:  "challenge_197",
  workshop:   "workshop_1080",
  course:     "course_1800",
  strategy:   "strategy_4000",
  premium:    "premium_14000",
  partnership: "partnership",
};
const HOT_PRODUCTS = new Set(["strategy_4000", "premium_14000", "partnership"]);
const HADAR_EMAIL  = "hadard1113@gmail.com";
const ALON_EMAIL   = "alonabadi9@gmail.com";

function phoneLinks(phone: string): string {
  const wa = phone.replace(/\D/g, "").replace(/^0/, "972");
  return `<a href="tel:${phone}" style="color:#4285F4">📞 ${phone}</a> &nbsp;·&nbsp; <a href="https://wa.me/${wa}" style="color:#25D366">💬 WhatsApp</a>`;
}

interface NewLeadParams {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmAdset?: string | null;
  utmAd?: string | null;
  quizProduct?: string | null;
  quizMatch?: number | null;
  watchedVideo?: boolean;
}

function utmRow(label: string, value: string | null | undefined) {
  return value ? `<p style="margin:4px 0"><strong>${label}:</strong> <span style="color:#C9964A">${value}</span></p>` : "";
}

function notifyNewLead(p: NewLeadParams) {
  const adminUrl  = `https://www.beegood.online/admin/users/${p.userId}`;
  const hasUtm    = p.utmSource || p.utmMedium || p.utmCampaign || p.utmAdset || p.utmAd;
  const isHot     = !!p.quizProduct && HOT_PRODUCTS.has(p.quizProduct);
  const productHe = p.quizProduct ? (PRODUCT_NAME[p.quizProduct] ?? p.quizProduct) : null;

  const subject = isHot
    ? `🔥 ליד חם: ${p.name} — ${productHe}`
    : `🎯 ליד חדש: ${p.name}`;

  const quizSection = p.quizProduct ? `
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
    <p style="margin:4px 0;font-size:13px;color:#888">קוויז:</p>
    <p style="margin:4px 0"><strong>מוצר מומלץ:</strong> <span style="color:${isHot ? "#e05555" : "#C9964A"};font-weight:bold">${productHe}</span></p>
    ${p.quizMatch ? `<p style="margin:4px 0"><strong>התאמה:</strong> ${p.quizMatch}%</p>` : ""}
    ${p.watchedVideo ? `<p style="margin:4px 0"><strong>סרטון:</strong> ✅ צפה בהדרכה החינמית</p>` : ""}
  ` : p.watchedVideo ? `
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
    <p style="margin:4px 0"><strong>סרטון:</strong> ✅ צפה בהדרכה החינמית</p>
  ` : "";

  const to: string[] = isHot ? [ALON_EMAIL, HADAR_EMAIL] : [ALON_EMAIL];

  new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
    to,
    subject,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:480px">
      <h2 style="color:${isHot ? "#e05555" : "#C9964A"};margin-bottom:16px">${isHot ? "🔥 ליד חם!" : "ליד חדש נכנס 🎯"}</h2>
      <p style="margin:4px 0"><strong>שם:</strong> ${p.name}</p>
      <p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${p.email}" style="color:#4285F4">${p.email}</a></p>
      ${p.phone ? `<p style="margin:4px 0"><strong>טלפון:</strong> ${phoneLinks(p.phone)}</p>` : ""}
      ${quizSection}
      ${hasUtm ? `<hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <p style="margin:4px 0;font-size:13px;color:#888">מקורות:</p>
      ${utmRow("מקור", p.utmSource)}
      ${utmRow("מדיום", p.utmMedium)}
      ${utmRow("קמפיין", p.utmCampaign)}
      ${utmRow("אד-סט", p.utmAdset)}
      ${utmRow("אד", p.utmAd)}` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:12px 0"/>
      <a href="${adminUrl}" style="display:inline-block;background:${isHot ? "#e05555" : "#C9964A"};color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח פרופיל באדמין ←</a>
    </div>`,
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 5 requests / minute per IP ──────────────
  const ip = getClientIp(req);
  if (!rateLimit(`signup:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "יותר מדי ניסיונות. נסה שוב בעוד דקה." },
      { status: 429 }
    );
  }

  // ── Parse & validate ────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = issue.message;
    }
    return NextResponse.json({ errors }, { status: 422 });
  }

  const {
    name,
    email,
    phone,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    utm_adset,
    utm_ad,
    click_id,
    anonymous_id,
    marketing_consent,
  } = parsed.data;

  // Sanitize ab_variant — DB constraint only allows 'A' or 'B'
  const raw_variant = parsed.data.ab_variant;
  const ab_variant = (raw_variant === "A" || raw_variant === "B") ? raw_variant : null;

  const supabase = createServerClient();

  try {
    // ── Find-or-create user (avoids relying on a unique constraint) ──────────
    const { data: existing } = await supabase
      .from("users")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    let user: { id: string; status: string };
    let isNewUser = false;

    if (existing) {
      // Update mutable fields; preserve status if already advanced beyond 'lead'
      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update({
          name,
          phone,
          last_seen_at: new Date().toISOString(),
          ...(utm_source   ? { utm_source }   : {}),
          ...(utm_medium   ? { utm_medium }   : {}),
          ...(utm_campaign ? { utm_campaign } : {}),
          ...(utm_content  ? { utm_content }  : {}),
          ...(utm_term     ? { utm_term }     : {}),
          ...(utm_adset    ? { utm_adset }    : {}),
          ...(utm_ad       ? { utm_ad }       : {}),
          ...(click_id     ? { click_id }     : {}),
          ...(ab_variant   ? { ab_variant }   : {}),
          ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
        })
        .eq("id", existing.id)
        .select("id, status")
        .single();
      if (updateErr) throw new Error(updateErr.message);
      user = updated!;
    } else {
      // New user
      const { data: inserted, error: insertErr } = await supabase
        .from("users")
        .insert({
          email,
          name,
          phone,
          ab_variant:   ab_variant   ?? null,
          utm_source:   utm_source   ?? null,
          utm_medium:   utm_medium   ?? null,
          utm_campaign: utm_campaign ?? null,
          utm_content:  utm_content  ?? null,
          utm_term:     utm_term     ?? null,
          utm_adset:    utm_adset    ?? null,
          utm_ad:       utm_ad       ?? null,
          click_id:     click_id     ?? null,
          status: "lead",
          last_seen_at: new Date().toISOString(),
          ...(marketing_consent ? { marketing_consent: true, consent_at: new Date().toISOString() } : {}),
        })
        .select("id, status")
        .single();
      if (insertErr) throw new Error(insertErr.message);
      user = inserted!;
      isNewUser = true;
    }

    // ── Merge anonymous identity → user ─────────────────────
    if (anonymous_id) {
      await supabase
        .from("identities")
        .upsert(
          {
            anonymous_id,
            user_id: user.id,
            email,
            phone,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "anonymous_id" }
        );
    }

    // ── Fire USER_SIGNED_UP event ────────────────────────────
    await supabase.from("events").insert({
      user_id: user.id,
      anonymous_id: anonymous_id ?? null,
      type: "USER_SIGNED_UP",
      metadata: {
        ab_variant: ab_variant ?? null,
        utm_source: utm_source ?? null,
      },
    });

    // ── Enqueue welcome email job (immediate) ────────────────
    // Find the welcome sequence step
    const { data: welcomeSeq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "USER_SIGNED_UP")
      .eq("delay_hours", 0)
      .eq("active", true)
      .single();

    if (welcomeSeq) {
      await supabase.from("jobs").insert({
        type: "SEND_EMAIL",
        payload: {
          user_id: user.id,
          email,
          name,
          sequence_id: welcomeSeq.id,
          subject: welcomeSeq.subject,
          template_key: welcomeSeq.template_key,
        },
        run_at: new Date().toISOString(),
        status: "pending",
      });
    }

    // ── Enqueue follow-up email jobs at their scheduled times ─
    const { data: followups } = await supabase
      .from("email_sequences")
      .select("id, delay_hours, subject, template_key")
      .eq("trigger_event", "USER_SIGNED_UP")
      .gt("delay_hours", 0)
      .eq("active", true);

    if (followups?.length) {
      const jobs = followups.map((seq) => ({
        type: "SEND_EMAIL",
        payload: {
          user_id: user.id,
          email,
          name,
          sequence_id: seq.id,
          subject: seq.subject,
          template_key: seq.template_key,
        },
        run_at: new Date(
          Date.now() + seq.delay_hours * 60 * 60 * 1000
        ).toISOString(),
        status: "pending" as const,
      }));
      await supabase.from("jobs").insert(jobs);
    }

    const fbp = req.cookies.get("_fbp")?.value;
    const fbc = req.cookies.get("_fbc")?.value;
    const ua  = req.headers.get("user-agent") ?? undefined;

    if (isNewUser) {
      // Collect ALL anonymous_ids linked to this user (quiz may have been taken in a different session)
      const { data: linkedIdentities } = await supabase
        .from("identities")
        .select("anonymous_id")
        .eq("user_id", user.id);
      const anonIds = [...new Set([
        ...(anonymous_id ? [anonymous_id] : []),
        ...(linkedIdentities?.map((i) => i.anonymous_id) ?? []),
      ])];

      const [quizRes, videoRes] = await Promise.all([
        anonIds.length
          ? supabase.from("quiz_results")
              .select("recommended_product, match_percent")
              .in("anonymous_id", anonIds)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        anonIds.length
          ? supabase.from("video_events")
              .select("id")
              .in("anon_id", anonIds)
              .in("event_type", ["watch_progress", "completed"])
              .gte("percent_watched", 0.3)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const rawProduct = quizRes.data?.recommended_product ?? null;
      const quizProduct = rawProduct ? (QUIZ_KEY_MAP[rawProduct] ?? rawProduct) : null;

      notifyNewLead({
        userId: user.id,
        name,
        email,
        phone,
        utmSource:   utm_source   ?? null,
        utmMedium:   utm_medium   ?? null,
        utmCampaign: utm_campaign ?? null,
        utmAdset:    utm_adset    ?? null,
        utmAd:       utm_ad       ?? null,
        quizProduct,
        quizMatch:   quizRes.data?.match_percent ?? null,
        watchedVideo: !!videoRes.data,
      });
    }

    await sendCapiEvent({
      eventName: "Lead",
      eventId:   user.id,
      userData:  { email, phone: phone ?? undefined, fbp, fbc, clientUserAgent: ua },
    });

    await sendCapiEvent({
      eventName: "CompleteRegistration",
      eventId:   `reg_${user.id}`,
      userData:  { email, phone: phone ?? undefined, fbp, fbc, clientUserAgent: ua },
    });

    return NextResponse.json({ ok: true, user_id: user.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : (err && typeof err === "object" ? JSON.stringify(err) : String(err));

    try {
      await supabase.from("error_logs").insert({
        context: "api/signup",
        error: message,
        payload: { email, ip },
      });
    } catch {}

    return NextResponse.json(
      { error: "שגיאת שרת, נסה שוב" },
      { status: 500 }
    );
  }
}
