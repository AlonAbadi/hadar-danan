/**
 * Client-side analytics helpers.
 * Safe to call even when pixels are not loaded (env vars not set).
 * All functions are no-ops on the server.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== "undefined") window.fbq?.(...args);
}

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined") window.gtag?.(...args);
}

export const PRODUCT_LEAD_EVENT: Record<string, string> = {
  free_training:      "LeadFreeTraining",
  challenge:          "LeadChallenge",
  workshop:           "LeadWorkshop",
  course:             "LeadCourse",
  strategy:           "LeadStrategy",
  premium:            "LeadPremium",
  partnership:        "LeadPartnership",
  atelier_influencer: "AtelierLead",
};

/**
 * Expected revenue per lead = product price × estimated close rate.
 * Used to feed Meta's value-based bidding so the algorithm learns
 * which lead types are worth more and finds similar high-value audiences.
 */
export const LEAD_VALUE_ILS: Record<string, number> = {
  free_training:      0,
  challenge:          197,
  workshop:           1080,
  course:             1800,
  strategy:           4000,
  premium:            14000,
  partnership:        5000,   // not closed online — signals premium lead quality to Meta
  atelier_influencer: 5000,   // not closed online — signals premium lead quality to Meta
};

/** Returns the camelCase custom event name for a product. */
export function productLeadEventName(productId: string): string {
  return PRODUCT_LEAD_EVENT[productId]
    ?? `Lead${productId.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`;
}

/** Generic lead — used only where no product context is known */
export function trackLead(eventId?: string) {
  try {
    fbq("track", "Lead", { content_name: "quiz_lead" }, eventId ? { eventID: eventId } : undefined);
    gtag("event", "generate_lead", { method: "signup_form" });
  } catch {}
}

/**
 * Product-specific lead — fires standard Lead + dedicated custom event,
 * both carrying expected revenue value so Meta can do value optimisation.
 */
export function trackProductLead(productId: string, eventId?: string) {
  try {
    const customEvent = productLeadEventName(productId);
    const value       = LEAD_VALUE_ILS[productId] ?? 0;
    const opts        = eventId ? { eventID: eventId } : undefined;
    fbq("track",       "Lead",       { content_name: productId, value, currency: "ILS" }, opts);
    fbq("trackCustom", customEvent,  { content_name: productId, value, currency: "ILS" }, opts);
    gtag("event", "generate_lead", { method: "signup_form", product: productId, value, currency: "ILS" });
  } catch {}
}

/**
 * Fires when the quiz results screen renders and the user sees their
 * recommended product. Stronger intent signal than QuizComplete because
 * it carries the specific product + expected value, enabling Meta to
 * build product-segmented lookalike audiences from quiz behaviour.
 */
export function trackQuizRecommended(productId: string, matchPercent: number) {
  try {
    const value = LEAD_VALUE_ILS[productId] ?? 0;
    fbq("trackCustom", "QuizRecommended", {
      content_name:  productId,
      value,
      currency:      "ILS",
      match_percent: matchPercent,
    });
    // GA4: one named event per product so dashboard can query distribution by event name
    gtag("event", `quiz_result_${productId}`, { match_percent: matchPercent });
  } catch {}
}

/** CTA clicked → InitiateCheckout. Pass eventId for CAPI deduplication. */
export function trackInitiateCheckout(product: string, value: number, currency = "ILS", eventId?: string) {
  try {
    fbq("track", "InitiateCheckout", { content_name: product, value, currency }, eventId ? { eventID: eventId } : undefined);
    gtag("event", "begin_checkout", { currency, value, items: [{ item_id: product }] });
  } catch {}
}

/** Strategy session booked → Schedule */
export function trackBooking(eventId?: string) {
  try {
    fbq("track", "Schedule", {}, eventId ? { eventID: eventId } : undefined);
    gtag("event", "booking", { event_category: "conversion", event_id: eventId });
  } catch {}
}

const PRODUCT_CUSTOM_EVENT: Record<string, string> = {
  challenge_197:  "PurchaseChallenge",
  workshop_1080:  "PurchaseWorkshop",
  course_1800:    "PurchaseCourse",
  strategy_4000:  "PurchaseStrategy",
  premium_14000:  "PurchasePremium",
  test_1:         "PurchaseTest",
};

/** Product-specific purchase custom event — fires alongside standard Purchase */
export function trackProductPurchase(product: string, value: number, currency = "ILS", eventId?: string) {
  try {
    const customEvent = PRODUCT_CUSTOM_EVENT[product];
    if (!customEvent) return;
    const opts = eventId ? { eventID: `${customEvent.toLowerCase()}_${eventId}` } : undefined;
    fbq("trackCustom", customEvent, { value, currency, content_name: product }, opts);
  } catch {}
}

/** Purchase confirmed → Purchase */
export function trackPurchase(product: string, value: number, currency = "ILS", eventId?: string) {
  try {
    if (eventId) {
      fbq("track", "Purchase", { value, currency, content_name: product }, { eventID: eventId });
    } else {
      fbq("track", "Purchase", { value, currency, content_name: product });
    }
    gtag("event", "purchase", { currency, value, transaction_id: eventId, items: [{ item_id: product }] });
  } catch {}
}

/** Product page viewed → ViewContent */
export function trackViewContent(product: string, value: number, currency = "ILS") {
  try {
    fbq("track", "ViewContent", { content_name: product, value, currency, content_type: "product" });
    gtag("event", "view_item", { currency, value, items: [{ item_id: product }] });
  } catch {}
}

/** After registration form submitted → CompleteRegistration */
export function trackCompleteRegistration(eventId?: string) {
  try {
    fbq("track", "CompleteRegistration", {}, eventId ? { eventID: eventId } : undefined);
    gtag("event", "sign_up");
  } catch {}
}
