/**
 * /api/cardcom/webhook
 *
 * Receives payment confirmation from Cardcom.
 * Supports two modes:
 *
 * GET — new verification flow (Cardcom appends ?lowprofilecode=... to our IndicatorUrl)
 *   1. Receive lowprofilecode from Cardcom
 *   2. Call BillGoldGetLowProfileIndicator.aspx to verify payment independently
 *   3. Check OperationResponse=0
 *   4. Fulfill purchase + fire events
 *
 * POST — legacy flow (Cardcom posts full transaction data as form-encoded body)
 *   Kept for backward compatibility with any existing Cardcom configuration.
 *
 * CRITICAL: Always return HTTP 200 to Cardcom even on errors — any non-200
 * causes Cardcom to retry up to 7 times.
 *
 * Idempotent — safe to receive the same webhook multiple times.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendCapiEvent } from "@/lib/meta-capi";
import { consumeCredit } from "@/lib/credit-ladder";
import { sendChallengeWhatsApp } from "@/lib/challenge-whatsapp";
import { Resend } from "resend";
import { extractTokenizedCardFields } from "@/lib/cardcom/lowprofile";
import { createRecurringOrder } from "@/lib/cardcom/recurring";

const PRODUCT_LABELS: Record<string, string> = {
  challenge_197:  "אתגר 7 ימים",
  workshop_1080:  "סדנה יום אחד",
  course_1800:    "קורס דיגיטלי",
  strategy_4000:  "פגישת אסטרטגיה",
  premium_14000:  "יום צילום פרמיום",
  test_1:         "מוצר בדיקה",
};

export function buildPurchaseEmail(opts: {
  userId:        string;
  name:          string | null;
  email:         string | null;
  phone:         string | null;
  product:       string;
  amount:        number;
  invoiceLink:   string | null;
  invoiceNumber: string | null;
}): { subject: string; html: string } {
  const productLabel = PRODUCT_LABELS[opts.product] ?? opts.product;
  const amountFmt    = `₪${(opts.amount ?? 0).toLocaleString("he-IL")}`;
  const displayName  = opts.name ?? opts.email ?? "לקוח";
  const adminUrl     = `https://www.beegood.online/admin/users/${opts.userId}`;
  const phoneWa      = opts.phone ? opts.phone.replace(/\D/g, "").replace(/^0/, "972") : null;
  const phoneLine    = opts.phone
    ? `<p style="margin:4px 0"><strong>טלפון:</strong> <a href="tel:${opts.phone}" style="color:#4285F4">📞 ${opts.phone}</a>${phoneWa ? ` &nbsp;·&nbsp; <a href="https://wa.me/${phoneWa}" style="color:#25D366">💬 WhatsApp</a>` : ""}</p>`
    : "";
  const invoiceLine  = opts.invoiceLink
    ? `<p style="margin:4px 0"><strong>חשבונית:</strong> <a href="${opts.invoiceLink}" style="color:#4285F4">${opts.invoiceNumber ? `#${opts.invoiceNumber}` : "פתח PDF"}</a></p>`
    : opts.invoiceNumber ? `<p style="margin:4px 0"><strong>חשבונית:</strong> #${opts.invoiceNumber}</p>` : "";

  return {
    subject: `💰 עסקה חדשה — ${displayName} · ${productLabel} · ${amountFmt}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.8;max-width:480px">
      <h2 style="color:#34A853;margin-bottom:8px;font-size:22px">💰 עסקה חדשה</h2>
      <p style="margin:0 0 20px;color:#888;font-size:13px">תשלום הושלם בהצלחה</p>

      <div style="background:linear-gradient(135deg,#E8B94A,#9E7C3A);color:#1A1206;padding:16px 20px;border-radius:12px;margin-bottom:18px">
        <p style="margin:0;font-size:14px;font-weight:700;opacity:0.85">${productLabel}</p>
        <p style="margin:6px 0 0;font-size:28px;font-weight:900;letter-spacing:-0.5px">${amountFmt}</p>
      </div>

      <p style="margin:4px 0"><strong>שם:</strong> ${displayName}</p>
      ${opts.email ? `<p style="margin:4px 0"><strong>אימייל:</strong> <a href="mailto:${opts.email}" style="color:#4285F4">${opts.email}</a></p>` : ""}
      ${phoneLine}
      ${invoiceLine}

      <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
      <a href="${adminUrl}" style="display:inline-block;background:#34A853;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">פתח פרופיל באדמין ←</a>
    </div>`,
  };
}

/** Make.com purchase webhook. Fired once per completed transaction so the
 *  no-code automations on Make can hook downstream actions (Sheets log,
 *  Slack ping, etc). Same observability pattern as notifyPurchase — no more
 *  `.catch(() => {})` silent black holes. */
const MAKE_PURCHASE_WEBHOOK_URL = "https://hook.eu1.make.com/a11gotdkyvsbroc3q8zrlx9fcdxapqzk";

async function notifyMakeOfPurchase(
  supabase: ReturnType<typeof createServerClient>,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    const res = await fetch(MAKE_PURCHASE_WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      await supabase.from("error_logs").insert({
        context: "api/cardcom/webhook makeWebhook",
        error:   `Make webhook returned ${res.status}: ${body.slice(0, 300)}`,
        payload: { purchaseId: payload.purchase_id, status: res.status },
      });
    }
  } catch (err) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook makeWebhook",
      error:   err instanceof Error ? err.message : String(err),
      payload: { purchaseId: payload.purchase_id },
    });
  }
}

/** Send the admin "deal closed" alert.
 *
 *  History note: this used to be `.catch(() => {})` which swallowed BOTH
 *  network rejections AND, worse, Resend's `{ data, error }` success-shape
 *  errors that never reject at all. A real challenge purchase landed but
 *  the alert never went out — invisible to the team, invisible to logs.
 *  Now: any failure path lands in error_logs and is visible in /admin/system. */
async function notifyPurchase(
  supabase: ReturnType<typeof createServerClient>,
  opts: {
    userId:        string;
    name:          string | null;
    email:         string | null;
    phone:         string | null;
    product:       string;
    amount:        number;
    invoiceLink:   string | null;
    invoiceNumber: string | null;
  },
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook notifyPurchase",
      error:   "RESEND_API_KEY missing — admin alert skipped",
      payload: { userId: opts.userId, product: opts.product, amount: opts.amount },
    });
    return;
  }

  const { subject, html } = buildPurchaseEmail(opts);

  try {
    const result = await new Resend(apiKey).emails.send({
      from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
      to:   ["alonabadi9@gmail.com", "hadard1113@gmail.com"],
      subject,
      html,
    });
    if (result.error) {
      await supabase.from("error_logs").insert({
        context: "api/cardcom/webhook notifyPurchase",
        error:   `Resend rejected: ${result.error.name ?? "unknown"} — ${result.error.message ?? ""}`,
        payload: { userId: opts.userId, product: opts.product, amount: opts.amount, resendError: result.error },
      });
    }
  } catch (err) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook notifyPurchase",
      error:   err instanceof Error ? err.message : String(err),
      payload: { userId: opts.userId, product: opts.product, amount: opts.amount },
    });
  }
}

// ── Shared fulfillment logic ───────────────────────────────────────────────

async function fulfillPurchase(
  supabase:            ReturnType<typeof createServerClient>,
  purchaseId:          string,
  internalDealNumber:  string | undefined,
  invoiceNumber:       string | null,
  invoiceLink:         string | null,
  rawCardcomData:      Record<string, string>,
): Promise<{ ok: boolean; alreadyProcessed?: boolean }> {
  // Idempotency: skip if InternalDealNumber already recorded
  if (internalDealNumber) {
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("cardcom_ref", internalDealNumber)
      .maybeSingle();

    if (existing) return { ok: true, alreadyProcessed: true };
  }

  console.log("InvoiceNumber from Cardcom:", invoiceNumber);
  console.log("InvoiceLink from Cardcom:", invoiceLink);

  // Mark purchase as completed — include invoice fields in same update
  // (invoice_number/invoice_link columns added in migrations 018/019, cast as any for TS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchase, error: purchaseErr } = await (supabase as any)
    .from("purchases")
    .update({
      status:         "completed",
      cardcom_ref:    internalDealNumber ?? null,
      invoice_number: invoiceNumber ?? null,
      invoice_link:   invoiceLink   ?? null,
    })
    .eq("id", purchaseId)
    .eq("status", "pending")   // only update pending — prevents overwriting refunds
    .select("id, user_id, product, amount, meta_fbp, meta_fbc, meta_client_ip, meta_user_agent, is_test, credit_applied, credit_source_purchase_id")
    .single();

  if (purchaseErr || !purchase) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook fulfillPurchase",
      error:   purchaseErr?.message ?? "Purchase not found or not pending",
      payload: { purchaseId, internalDealNumber, invoiceNumber },
    });
    return { ok: false };
  }

  // v2 isolation: a test purchase (stamped at checkout with the preview
  // secret) completes technically — DB row, product access — but never
  // pages admins, hits Make, fires Meta CAPI, enrolls WhatsApp, or counts
  // in experiments.
  const isTestPurchase = (purchase as { is_test?: boolean }).is_test === true;

  // amount_paid = the billed net, now explicit on every completed row
  // (migration 063 backfilled history; admin math reads amount_paid ?? amount).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("purchases")
    .update({ amount_paid: purchase.amount })
    .eq("id", purchase.id)
    .is("amount_paid", null);

  // Credit ladder — atomic consumption of the source credit. Losing the race
  // (a concurrent purchase consumed it first) NEVER blocks fulfillment: the
  // customer already paid the discounted net. It becomes an undercharge alert.
  const creditApplied = Number((purchase as { credit_applied?: number }).credit_applied ?? 0);
  const creditSource  = (purchase as { credit_source_purchase_id?: string | null }).credit_source_purchase_id ?? null;
  if (creditApplied > 0 && creditSource) {
    const won = await consumeCredit(supabase, creditSource, purchase.id);
    if (!won) {
      await supabase.from("error_logs").insert({
        context: "credit-ladder RACE — undercharged",
        error:   `Purchase ${purchase.id} billed with ₪${creditApplied} credit from ${creditSource}, but the credit was already consumed. Review manually.`,
        payload: { purchase_id: purchase.id, credit_source: creditSource, credit_applied: creditApplied },
      });
      if (!isTestPurchase && process.env.RESEND_API_KEY) {
        const { Resend } = await import("resend");
        new Resend(process.env.RESEND_API_KEY).emails.send({
          from: process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online",
          to: ["alonabadi9@gmail.com"],
          subject: "⚠️ קיזוז כפול — נדרשת בדיקה ידנית",
          html: `<div dir="rtl">רכישה ${purchase.id} (${purchase.product}) חויבה בקיזוז ₪${creditApplied} מרכישה ${creditSource}, אבל הקיזוז כבר נוצל במקביל. הלקוח שילם פחות — לבדוק ידנית.</div>`,
        }).catch(() => {});
      }
    }
  }

  // Look up the buyer's ab_variant so we can attribute the purchase to the
  // right experiment row (e.g. challenge_hero_format primary metric).
  let buyerAbVariant: string | null = null;
  if (purchase.user_id) {
    const { data: buyer } = await supabase
      .from("users")
      .select("ab_variant")
      .eq("id", purchase.user_id)
      .single();
    buyerAbVariant = buyer?.ab_variant ?? null;
  }

  // Pick which experiment this purchase contributes to (if any). The
  // challenge_hero_format experiment concluded 2026-06-19; the follow-on
  // test challenge_proof_position (launched same day) now claims the
  // challenge purchase as its conversion metric.
  const purchaseExperimentName: string | null =
    purchase.product === "challenge_197" ? "challenge_proof_position" : null;

  // Fire PURCHASE_COMPLETED — drives state machine + downstream sequences
  await supabase.from("events").insert({
    user_id:  purchase.user_id,
    type:     "PURCHASE_COMPLETED",
    metadata: {
      product:      purchase.product,
      amount:       purchase.amount,
      cardcom_ref:  internalDealNumber,
      ...(buyerAbVariant ? { ab_variant: buyerAbVariant } : {}),
      ...(purchaseExperimentName ? { experiment_name: purchaseExperimentName } : {}),
    },
  });

  // Direct increment for the AB experiment (webhook bypasses /api/events).
  if (purchaseExperimentName && (buyerAbVariant === "A" || buyerAbVariant === "B")) {
    try {
      await supabase.rpc("increment_experiment", {
        p_name: purchaseExperimentName,
        p_column: buyerAbVariant === "A" ? "conversions_a" : "conversions_b",
      });
    } catch {}
  }

  // Determine product-specific trigger event
  const productEvent =
    purchase.product === "challenge_197"   ? "CHALLENGE_PURCHASED"   :
    purchase.product === "signal_hive_590" ? "SIGNAL_HIVE_PURCHASED" :
    purchase.product === "workshop_1080"   ? "WORKSHOP_PURCHASED"    :
    purchase.product === "course_1800"     ? "COURSE_PURCHASED"      : null;

  // Fetch user data once (shared by all email enqueuing below)
  const { data: user } = await supabase
    .from("users")
    .select("email, name, phone")
    .eq("id", purchase.user_id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";

  // ── Hive subscription: extract token, hand off to Cardcom recurring ─────
  // For hive_basic_59 / hive_full_149 the first payment was Operation=2 (charge
  // + tokenize). We extract the resulting token + card validity from the
  // Cardcom response, save them on the user, then call AddUpdateRecurringOrder
  // so Cardcom takes over the monthly schedule. On success we activate hive_*
  // fields and fire HIVE_JOINED which triggers the existing welcome sequence.
  const isHiveProduct =
    purchase.product === "hive_basic_59" || purchase.product === "hive_full_149";

  if (isHiveProduct && purchase.user_id && user) {
    const tier = purchase.product === "hive_basic_59" ? "basic_59" : "full_149";
    const tokenized = extractTokenizedCardFields(rawCardcomData);

    if (!tokenized.token || !tokenized.validMonth || !tokenized.validYear) {
      await supabase.from("error_logs").insert({
        context: "api/cardcom/webhook hive — missing token fields",
        error:   "LowProfile success but token/validity not returned",
        payload: {
          purchaseId,
          product:    purchase.product,
          tokenized,
        },
      });
    } else {
      // Save card details on the user — needed to construct a new recurring
      // order later (tier upgrade / reactivation after cancel).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("users")
        .update({
          cardcom_token:            tokenized.token,
          cardcom_card_valid_month: tokenized.validMonth,
          cardcom_card_valid_year:  tokenized.validYear,
          cardcom_card_last4:       tokenized.last4Display ?? null,
        })
        .eq("id", purchase.user_id);

      // Schedule the next bill 30 days out — Cardcom owns the calendar after
      // the SOAP call but we also display this on /account.
      const now           = new Date();
      const nextBillIso   = new Date(now.getTime() + 30 * 86400000).toISOString();
      const nextBillDate  = nextBillIso.slice(0, 10);

      const tierLabel     = tier === "basic_59" ? "Hive basic 59" : "Hive full 149";
      const tierAmount    = tier === "basic_59" ? 59 : 149;

      const recurring = await createRecurringOrder({
        customerName:           user.name  ?? "",
        customerEmail:          user.email ?? "",
        customerPhone:          user.phone ?? "",
        token:                  tokenized.token,
        validMonth:             tokenized.validMonth,
        validYear:              tokenized.validYear,
        internalDescription:    tierLabel,
        amount:                 tierAmount,
        nextDateToBill:         nextBillDate,
        invoiceLineDescription: tierLabel,
        returnValue:            purchase.user_id,
      });

      if (!recurring.ok) {
        await supabase.from("error_logs").insert({
          context: "api/cardcom/webhook hive — AddUpdateRecurringOrder",
          error:   recurring.error,
          payload: {
            purchaseId,
            user_id:       purchase.user_id,
            responseCode:  "responseCode" in recurring ? recurring.responseCode : undefined,
            // raw kept short — full SOAP body can be large
            rawHead:       "raw" in recurring ? recurring.raw?.slice(0, 1000) : undefined,
          },
        });
        // Don't fail the request — the first charge already went through. The
        // customer has paid for month 1; we'll fix the recurring side manually
        // if the SOAP call failed. Better than blocking access.
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("users")
          .update({
            cardcom_recurring_id: recurring.recurringId,
            cardcom_account_id:   recurring.accountId,
          })
          .eq("id", purchase.user_id);
      }

      // Activate hive regardless of recurring success — the customer paid
      // month 1, they get month 1 of access. If recurring failed we'll
      // reconcile manually before the next cycle.
      await supabase
        .from("users")
        .update({
          hive_tier:              tier,
          hive_status:            "active",
          hive_started_at:        now.toISOString(),
          hive_next_billing_date: nextBillIso,
        })
        .eq("id", purchase.user_id);

      // Fire HIVE_JOINED — triggers the hive_welcome + day7 sequences.
      await supabase.from("events").insert({
        user_id:  purchase.user_id,
        type:     "HIVE_JOINED",
        metadata: { tier, amount: tierAmount, source: "cardcom_webhook" },
      });

      // Enqueue the welcome + day7 jobs (same pattern as the old /api/hive/join
      // used before we moved activation into the webhook).
      const { data: welcomeSeq } = await supabase
        .from("email_sequences")
        .select("id, subject, template_key")
        .eq("trigger_event", "HIVE_JOINED")
        .eq("delay_hours", 0)
        .eq("active", true)
        .maybeSingle();

      if (welcomeSeq) {
        await supabase.from("jobs").insert({
          type:    "SEND_EMAIL",
          payload: {
            user_id:      purchase.user_id,
            email:        user.email,
            name:         user.name ?? "",
            sequence_id:  welcomeSeq.id,
            subject:      welcomeSeq.subject,
            template_key: welcomeSeq.template_key,
            tier,
            price:        String(tierAmount),
            is_test:      isTestPurchase,
          },
          run_at: new Date().toISOString(),
          status: "pending",
        });
      }

      const { data: followups } = await supabase
        .from("email_sequences")
        .select("id, delay_hours, subject, template_key")
        .eq("trigger_event", "HIVE_JOINED")
        .gt("delay_hours", 0)
        .eq("active", true);

      if (followups?.length) {
        const jobs = followups.map((seq) => ({
          type:    "SEND_EMAIL",
          payload: {
            user_id:      purchase.user_id,
            email:        user.email,
            name:         user.name ?? "",
            sequence_id:  seq.id,
            subject:      seq.subject,
            template_key: seq.template_key,
            tier,
            is_test:      isTestPurchase,
          },
          run_at: new Date(now.getTime() + seq.delay_hours * 3600000).toISOString(),
          status: "pending" as const,
        }));
        await supabase.from("jobs").insert(jobs);
      }
    }
  }

  // Create challenge enrollment + auth account immediately on purchase
  let challengeMagicLink: string | null = null;
  let signalHiveMagicLink: string | null = null;
  let challengeEnrollmentId: string | null = null;
  if (purchase.product === "challenge_197" && !isTestPurchase) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("challenge_enrollments")
      .upsert(
        { user_id: purchase.user_id, enrolled_at: new Date().toISOString(), current_day: 0 },
        { onConflict: "user_id", ignoreDuplicates: true }
      );

    // Fetch enrollment ID for WhatsApp log dedup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: enrollRow } = await (supabase as any)
      .from("challenge_enrollments")
      .select("id")
      .eq("user_id", purchase.user_id)
      .maybeSingle();
    challengeEnrollmentId = enrollRow?.id ?? null;

    // Generate a magic link so the buyer can access challenge content without
    // manually creating a password. generateLink auto-creates the auth.users row
    // if the email isn't registered yet.
    if (user?.email) {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type:    "magiclink",
          email:   user.email,
          options: { redirectTo: `${appUrl}/challenge/content` },
        });
        challengeMagicLink = linkData?.properties?.action_link ?? null;
      } catch {
        // non-fatal — email will fall back to static link
      }
    }
  }

  // כוורת האות — one-time ₪590 activation product. Grants signal-kit (Hive)
  // access by flipping hive_status to 'active' (the /hive/* gate) + a magic link
  // so the buyer lands straight in their kit. The SIGNAL_HIVE_PURCHASED event +
  // welcome email are enqueued by the productEvent path below.
  if (purchase.product === "signal_hive_590") {
    await supabase
      .from("users")
      .update({ hive_status: "active", hive_started_at: new Date().toISOString() })
      .eq("id", purchase.user_id);
    if (user?.email) {
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type:    "magiclink",
          email:   user.email,
          options: { redirectTo: `${appUrl}/hive/signal-kit` },
        });
        signalHiveMagicLink = linkData?.properties?.action_link ?? null;
      } catch {
        // non-fatal — the email falls back to a static /hive/signal-kit link
      }
    }
  }

  if (productEvent) {
    // Insert product-specific event into event log
    await supabase.from("events").insert({
      user_id:  purchase.user_id,
      type:     productEvent,
      metadata: { product: purchase.product, amount: purchase.amount },
    });

    // Enqueue all product-specific email sequences (immediate access email + timed upsell)
    if (user) {
      const { data: productSeqs } = await supabase
        .from("email_sequences")
        .select("id, delay_hours, subject, template_key")
        .eq("trigger_event", productEvent)
        .eq("active", true);

      if (productSeqs?.length) {
        await supabase.from("jobs").insert(
          productSeqs.map(seq => ({
            type:    "SEND_EMAIL",
            payload: {
              user_id:      purchase.user_id,
              email:        user.email,
              name:         user.name ?? "",
              sequence_id:  seq.id,
              subject:      seq.subject,
              template_key: seq.template_key,
              product:      purchase.product,
              amount:       purchase.amount,
              is_test:      isTestPurchase,
              // Inject magic link into the immediate access email (challenge or
              // כוורת האות)
              ...((challengeMagicLink || signalHiveMagicLink) && seq.delay_hours === 0
                ? { access_link: challengeMagicLink ?? signalHiveMagicLink }
                : {}),
            },
            run_at: new Date(Date.now() + seq.delay_hours * 60 * 60 * 1000).toISOString(),
            status: "pending" as const,
          }))
        );
      }
    }
  } else {
    // No product-specific sequence: send generic purchase confirmation
    const { data: confirmSeq } = await supabase
      .from("email_sequences")
      .select("id, subject, template_key")
      .eq("trigger_event", "PURCHASE_COMPLETED")
      .eq("delay_hours", 0)
      .eq("active", true)
      .maybeSingle();

    if (confirmSeq && user) {
      await supabase.from("jobs").insert({
        type:    "SEND_EMAIL",
        payload: {
          user_id:      purchase.user_id,
          email:        user.email,
          name:         user.name ?? "",
          sequence_id:  confirmSeq.id,
          subject:      confirmSeq.subject,
          template_key: confirmSeq.template_key,
          product:      purchase.product,
          amount:       purchase.amount,
          is_test:      isTestPurchase,
        },
        run_at: new Date().toISOString(),
        status: "pending" as const,
      });
    }
  }

  // Advance state machine: high_intent → buyer
  await supabase
    .from("users")
    .update({ status: "buyer" })
    .eq("id", purchase.user_id)
    .eq("status", "high_intent");

  // Notify Alon + Hadar of the closed deal. The status-change email in
  // /api/events doesn't fire here because the webhook updates status
  // directly (it doesn't go through POST /api/events), so without this
  // call the team would only see the "started checkout" alert and never
  // a deal-closed confirmation. The same query pulls UTM fields used by
  // the Make.com purchase webhook below.
  const { data: buyer } = await supabase
    .from("users")
    .select("name, email, phone, utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_adset, utm_ad, click_id")
    .eq("id", purchase.user_id)
    .single();
  if (buyer && !isTestPurchase) {
    await notifyPurchase(supabase, {
      userId:        purchase.user_id,
      name:          buyer.name,
      email:         buyer.email,
      phone:         buyer.phone,
      product:       purchase.product,
      amount:        purchase.amount,
      invoiceLink:   invoiceLink,
      invoiceNumber: invoiceNumber,
    });

    // Forward the closed deal to the Make.com purchase automation. Sent
    // unconditionally for every completed transaction.
    await notifyMakeOfPurchase(supabase, {
      purchase_id:    purchase.id,
      cardcom_ref:    internalDealNumber ?? null,
      product:        purchase.product,
      product_label:  PRODUCT_LABELS[purchase.product] ?? purchase.product,
      amount:         purchase.amount,
      currency:       "ILS",
      invoice_number: invoiceNumber,
      invoice_link:   invoiceLink,
      user_id:        purchase.user_id,
      name:           buyer.name,
      email:          buyer.email,
      phone:          buyer.phone,
      utm_source:     buyer.utm_source   ?? null,
      utm_medium:     buyer.utm_medium   ?? null,
      utm_campaign:   buyer.utm_campaign ?? null,
      utm_content:    buyer.utm_content  ?? null,
      utm_term:       buyer.utm_term     ?? null,
      utm_adset:      buyer.utm_adset    ?? null,
      utm_ad:         buyer.utm_ad       ?? null,
      click_id:       buyer.click_id     ?? null,
      completed_at:   new Date().toISOString(),
      source:         "cardcom_webhook",
    });
  }

  // Fire Purchase to Meta Conversions API (server-side, not blocked by iOS/adblockers)
  // event_id = purchase.id — deduplicates with browser pixel firing on success page
  const { data: userForCapi } = await supabase
    .from("users")
    .select("email, phone, name, click_id")
    .eq("id", purchase.user_id)
    .single();

  if (userForCapi) {
    // Build fbc from stored fbclid if the browser cookie wasn't captured at checkout
    const fbc = purchase.meta_fbc
      ?? (userForCapi.click_id ? `fb.1.${Date.now()}.${userForCapi.click_id}` : undefined);

    const firstName = userForCapi.name?.trim().split(" ")[0] || undefined;

    const sharedUserData = {
      email:           userForCapi.email ?? undefined,
      phone:           userForCapi.phone ?? undefined,
      firstName,
      externalId:      purchase.user_id,
      fbp:             purchase.meta_fbp  ?? undefined,
      fbc,
      clientIpAddress: purchase.meta_client_ip   ?? undefined,
      clientUserAgent: purchase.meta_user_agent  ?? undefined,
    };

    const sharedCustomData = {
      value:       purchase.amount ?? undefined,
      currency:    "ILS",
      contentName: purchase.product,
      contentIds:  [purchase.product],
    };

    // Standard Purchase event
    await sendCapiEvent({
      eventName:  "Purchase",
      eventId:    purchase.id,
      userData:   sharedUserData,
      customData: sharedCustomData,
      isTest:     isTestPurchase,
    });

    // Product-specific custom event for per-product campaign optimization
    const PRODUCT_CUSTOM_EVENT: Record<string, string> = {
      challenge_197:  "PurchaseChallenge",
      workshop_1080:  "PurchaseWorkshop",
      course_1800:    "PurchaseCourse",
      strategy_4000:  "PurchaseStrategy",
      premium_14000:  "PurchasePremium",
      test_1:         "PurchaseTest",
    };
    const customEventName = PRODUCT_CUSTOM_EVENT[purchase.product];
    if (customEventName) {
      await sendCapiEvent({
        eventName:  customEventName,
        eventId:    `${customEventName.toLowerCase()}_${purchase.id}`,
        userData:   sharedUserData,
        customData: sharedCustomData,
        isTest:     isTestPurchase,
      });
    }

    // Send opening-session WhatsApp immediately on challenge purchase
    if (purchase.product === "challenge_197" && challengeEnrollmentId && userForCapi.phone) {
      const waStatus = await sendChallengeWhatsApp(
        userForCapi.phone,
        userForCapi.name ?? "",
        0,
      ).then(() => "sent" as const).catch(() => "failed" as const);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("challenge_whatsapp_logs")
        .upsert(
          { enrollment_id: challengeEnrollmentId, day_number: 0, status: waStatus },
          { onConflict: "enrollment_id,day_number", ignoreDuplicates: false }
        );
    }
  }

  return { ok: true };
}

// ── GET handler — verification flow ───────────────────────────────────────
// Cardcom appends ?lowprofilecode=<code> to our IndicatorUrl
// We independently verify with BillGoldGetLowProfileIndicator.aspx

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Validate shared secret — rejects spoofed requests before any DB work
  const webhookToken = process.env.CARDCOM_WEBHOOK_TOKEN;
  if (webhookToken) {
    const receivedToken = searchParams.get("wt");
    if (receivedToken !== webhookToken) {
      await createServerClient().from("error_logs").insert({
        context: "api/cardcom/webhook GET",
        error:   "invalid webhook token",
        payload: { url: req.url },
      });
      return new Response("OK", { status: 200 }); // 200 to avoid Cardcom retries on our own requests
    }
  }

  // Cardcom sends lowprofilecode (lowercase) appended to our IndicatorUrl
  const lowProfileCode =
    searchParams.get("lowprofilecode") ?? searchParams.get("LowProfileCode");
  // Our own purchase ID embedded in IndicatorUrl: ?order=<purchase.id>
  const orderId = searchParams.get("order");

  if (!lowProfileCode) {
    // Must return 200 — Cardcom retries on non-200. Log to error_logs instead.
    await createServerClient().from("error_logs").insert({
      context: "api/cardcom/webhook GET",
      error:   "missing lowprofilecode",
      payload: { orderId, url: req.url },
    });
    return new Response("OK", { status: 200 });
  }

  const terminal = process.env.CARDCOM_TERMINAL;
  const apiName  = process.env.CARDCOM_API_NAME;

  if (!terminal || !apiName) {
    // Log but return 200 so Cardcom retries (credentials will be set)
    console.error("[webhook GET] Cardcom credentials not configured");
    return new Response("OK", { status: 200 });
  }

  // ── Step 1: Verify payment with Cardcom ─────────────────────────────────
  const verifyParams = new URLSearchParams({
    TerminalNumber: terminal,
    UserName:       apiName,
    LowProfileCode: lowProfileCode,
    codepage:       "65001",
  });

  let data: Record<string, string>;
  try {
    const verifyRes = await fetch(
      `https://secure.cardcom.solutions/Interface/BillGoldGetLowProfileIndicator.aspx?${verifyParams}`,
      { method: "GET" }
    );
    const verifyText = await verifyRes.text();
    data = Object.fromEntries(new URLSearchParams(verifyText));
    console.log("=== FULL CARDCOM RESPONSE ===", JSON.stringify(data));
    const invoiceRelated = Object.entries(data).filter(([k]) =>
      k.toLowerCase().includes("invoice") ||
      k.toLowerCase().includes("link") ||
      k.toLowerCase().includes("url")
    );
    console.log("Invoice/Link fields from Cardcom:", JSON.stringify(invoiceRelated));
  } catch (e) {
    await createServerClient().from("error_logs").insert({
      context: "api/cardcom/webhook GET",
      error:   String(e),
      payload: { lowProfileCode, orderId },
    });
    return new Response("OK", { status: 200 }); // return 200 — Cardcom will retry
  }

  // ── Step 2: Check payment result ────────────────────────────────────────
  // OperationResponse=0 means the overall operation succeeded
  if (data.OperationResponse !== "0") {
    const purchaseId = data.ReturnValue || orderId;
    if (purchaseId) {
      await createServerClient()
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", purchaseId)
        .eq("status", "pending");
    }
    console.warn("[webhook GET] Payment failed:", data.OperationResponse, data.OperationResponseDescription);
    return new Response("OK", { status: 200 });
  }

  console.log("Cardcom webhook data keys:", Object.keys(data));
  console.log("Cardcom InvoiceLink:", data.InvoiceLink);
  console.log("Cardcom Link:", data.Link);

  const internalDealNumber  = data.InternalDealNumber;
  const invoiceNumber       = data.InvoiceNumber ?? null;
  const invoiceLink         = data.InvoiceLink ?? data.Link ?? null;
  const invoiceResponseCode = data.InvoiceResponseCode;
  // ReturnValue is our purchase.id echoed back by Cardcom
  const returnValue = data.ReturnValue || orderId;

  if (!returnValue) {
    await createServerClient().from("error_logs").insert({
      context: "api/cardcom/webhook GET",
      error:   "No ReturnValue or order param — cannot identify purchase",
      payload: { lowProfileCode, data },
    });
    return new Response("OK", { status: 200 });
  }

  // Log invoice failure without blocking payment confirmation
  if (invoiceResponseCode && invoiceResponseCode !== "0") {
    console.warn(
      "[webhook GET] Invoice creation failed:",
      invoiceResponseCode,
      data.InvoiceResponseDescription ?? ""
    );
  }

  // ── Step 3: Fulfill the purchase ────────────────────────────────────────
  await fulfillPurchase(
    createServerClient(),
    returnValue,
    internalDealNumber,
    invoiceNumber,
    invoiceLink,
    data,
  );

  return new Response("OK", { status: 200 });
}

// ── POST handler — legacy flow ─────────────────────────────────────────────
// Cardcom posts full transaction data as form-encoded body.
// Kept for backward compatibility.

export async function POST(req: NextRequest) {
  // Validate webhook token from query string
  const webhookToken = process.env.CARDCOM_WEBHOOK_TOKEN;
  if (webhookToken) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("wt") !== webhookToken) {
      return new Response("OK", { status: 200 });
    }
  }

  let body: Record<string, string>;
  try {
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } catch {
    return NextResponse.json({ error: "Bad body" }, { status: 400 });
  }

  const {
    ResponseCode,
    InternalDealNumber,
    ReturnValue,
  } = body;

  const supabase = createServerClient();

  // Only process successful payments
  if (ResponseCode !== "0") {
    if (ReturnValue) {
      await supabase
        .from("purchases")
        .update({ status: "failed" })
        .eq("id", ReturnValue)
        .eq("status", "pending");
    }
    return NextResponse.json({ ok: true });
  }

  if (!ReturnValue) {
    await supabase.from("error_logs").insert({
      context: "api/cardcom/webhook POST",
      error:   "No ReturnValue in Cardcom POST body",
      payload: body,
    });
    return NextResponse.json({ ok: true });
  }

  await fulfillPurchase(supabase, ReturnValue, InternalDealNumber, null, null, body);

  return NextResponse.json({ ok: true });
}
