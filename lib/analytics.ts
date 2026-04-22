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

/** Free training form submitted → Lead */
export function trackLead(eventId?: string) {
  try {
    fbq("track", "Lead", { content_name: "free_training" }, eventId ? { eventID: eventId } : undefined);
    gtag("event", "generate_lead", { method: "signup_form" });
  } catch {}
}

/** CTA clicked (WhatsApp / checkout) → InitiateCheckout */
export function trackInitiateCheckout(product: string, value: number, currency = "ILS") {
  try {
    fbq("track", "InitiateCheckout", { content_name: product, value, currency });
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
