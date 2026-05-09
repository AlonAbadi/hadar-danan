/**
 * Shared utility for sending challenge WhatsApp messages via UChat.
 * Template: hadar_challenge_daily (4 body params)
 *   {{1}} first name  {{2}} day ("פתיחה" for day 0, "1"–"7" otherwise)
 *   {{3}} day title   {{4}} challenge URL
 */
import { CHALLENGE_DAYS } from "@/lib/challenge-config";

const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";
const CHALLENGE_URL = `${APP_URL}/challenge/content`;
const TEMPLATE_NAME = "hadar_challenge_daily";
const NAMESPACE     = "a01b08e8_1852_422e_bba2_25f0d05dcafa";

/** Returns time-appropriate Hebrew greeting based on Israel time (UTC+3). */
function hebrewGreeting(): string {
  const hour = new Date(Date.now() + 3 * 60 * 60 * 1000).getUTCHours();
  if (hour >= 5  && hour < 12) return "בוקר טוב";
  if (hour >= 12 && hour < 18) return "צהריים טובים";
  return "ערב טוב";
}

export function normalizePhone(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("972") && d.length === 12) return d;
  if (d.startsWith("0")   && d.length === 10)  return "972" + d.slice(1);
  return null;
}

export async function sendChallengeWhatsApp(
  phone: string,
  name:  string,
  dayNumber: number,
): Promise<void> {
  const apiKey = process.env.UCHAT_API_KEY;
  if (!apiKey) throw new Error("UCHAT_API_KEY not set");

  const normalized = normalizePhone(phone);
  if (!normalized) throw new Error(`Invalid phone: ${phone}`);

  const dayInfo = CHALLENGE_DAYS.find((d) => d.day === dayNumber);
  if (!dayInfo) throw new Error(`Invalid dayNumber: ${dayNumber}`);

  const firstName = (name ?? "").trim().split(" ")[0] || "שלום";
  const dayParam  = dayNumber === 0 ? "פתיחה" : String(dayNumber);
  // {{1}} = "ברכה, שם" — template body starts with {{1}} 👋 (no hardcoded "בוקר טוב")
  const greeting  = `${hebrewGreeting()}, ${firstName}`;

  const paramMap: Record<string, string> = {
    "BODY_{{1}}": greeting,
    "BODY_{{2}}": dayParam,
    "BODY_{{3}}": dayInfo.title,
    "BODY_{{4}}": CHALLENGE_URL,
  };

  const res = await fetch(
    "https://www.uchat.com.au/api/subscriber/send-whatsapp-template-by-user-id",
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:             `+${normalized}`,
        create_if_not_found: "yes",
        content: { namespace: NAMESPACE, name: TEMPLATE_NAME, lang: "he", params: paramMap },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`UChat ${res.status}: ${text}`);
  }
}
