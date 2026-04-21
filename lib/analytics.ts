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
export function trackLead() {
  try {
    fbq("track", "Lead", { content_name: "free_training" });
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
export function trackBooking() {
  try {
    fbq("track", "Schedule");
    gtag("event", "booking", { event_category: "conversion" });
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
export function trackCompleteRegistration() {
  try {
    fbq("track", "CompleteRegistration");
    gtag("event", "sign_up");
  } catch {}
}
