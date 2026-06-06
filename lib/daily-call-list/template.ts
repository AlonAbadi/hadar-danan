/**
 * Daily call-list email template — Hebrew RTL, Santosha dark palette.
 *
 * All styles inlined because email clients strip <style> blocks unreliably.
 * Hebrew text wrapped with dir="rtl"; phone numbers wrapped in dir="ltr" so
 * the digits render in correct order.
 */

import type { FinalLead } from "./types";
import type { TaoVerse } from "./tao";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.beegood.online";

const COLOR = {
  bg:         "#0D1018",
  card:       "#141820",
  cardSoft:   "#1D2430",
  border:     "#2C323E",
  fg:         "#EDE9E1",
  fgMuted:    "#9E9990",
  gold:       "#C9964A",
  goldLight:  "#E8B94A",
  goldDark:   "#9E7C3A",
  goldGrad:   "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
  red:        "#E07A6A",
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

// 0509566961 → 972509566961 for wa.me, with cleaning
function toWa(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("972")) return d;
  if (d.startsWith("0")) return "972" + d.slice(1);
  return d;
}

function todayHebrewDate(): string {
  const d = new Date();
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    weekday:  "long",
    day:      "numeric",
    month:    "long",
  }).format(d);
}

function renderLeadCard(lead: FinalLead, index: number): string {
  const name      = esc(lead.name ?? "ללא שם");
  const phone     = esc(lead.phone);
  const wa        = toWa(lead.phone);
  const adminUrl  = `${APP_URL}/admin/users/${lead.id}`;
  const opening   = esc(lead.brief.opening);
  const points    = lead.brief.talkingPoints.map(esc);
  const risk      = lead.brief.risk ? esc(lead.brief.risk) : null;
  const reasons   = lead.reasons.map(esc);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR.cardSoft};border:1px solid ${COLOR.border};border-radius:10px;margin:0 0 16px 0">
      <tr>
        <td style="padding:18px 20px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="vertical-align:middle">
                <div style="font-size:18px;font-weight:700;color:${COLOR.fg};margin-bottom:4px">
                  <span style="display:inline-block;background:${COLOR.goldGrad};color:#0D1018;font-size:12px;font-weight:800;padding:2px 8px;border-radius:10px;margin-left:8px">${index + 1}</span>
                  ${name}
                </div>
                <div style="font-size:12px;color:${COLOR.fgMuted}">סטטוס: ${esc(lead.status)}</div>
              </td>
              <td align="left" style="vertical-align:middle">
                <a href="tel:${phone}" style="display:inline-block;font-size:18px;font-weight:700;color:${COLOR.goldLight};text-decoration:none;direction:ltr;unicode-bidi:embed;background:#0D1018;padding:8px 12px;border-radius:8px;border:1px solid ${COLOR.gold}">📞 ${phone}</a>
                &nbsp;
                <a href="https://wa.me/${wa}" style="display:inline-block;font-size:14px;font-weight:700;color:#0D1018;text-decoration:none;background:#25D366;padding:8px 14px;border-radius:8px">💬 WhatsApp</a>
              </td>
            </tr>
          </table>

          <div style="margin:14px 0 8px 0;font-size:13px;font-weight:700;color:${COLOR.gold}">למה היום:</div>
          <ul style="margin:0;padding:0 18px 0 0;color:${COLOR.fg};font-size:13px;line-height:1.7">
            ${reasons.map(r => `<li>${r}</li>`).join("")}
          </ul>

          <div style="margin:14px 0 6px 0;font-size:13px;font-weight:700;color:${COLOR.gold}">פתיח מוצע:</div>
          <div style="background:#0D1018;border-right:3px solid ${COLOR.gold};padding:10px 14px;border-radius:4px;font-size:14px;color:${COLOR.fg};line-height:1.6;font-style:italic">
            ${opening}
          </div>

          <div style="margin:14px 0 6px 0;font-size:13px;font-weight:700;color:${COLOR.gold}">נקודות שיחה:</div>
          <ul style="margin:0;padding:0 18px 0 0;color:${COLOR.fg};font-size:13px;line-height:1.7">
            ${points.map(p => `<li>${p}</li>`).join("")}
          </ul>

          ${risk ? `
          <div style="margin-top:12px;padding:8px 12px;background:rgba(224,122,106,0.12);border:1px solid ${COLOR.red};border-radius:6px;font-size:12px;color:${COLOR.red}">
            ⚠ ${risk}
          </div>
          ` : ""}

          <div style="margin-top:12px;font-size:11px">
            <a href="${adminUrl}" style="color:${COLOR.gold};text-decoration:none">פרופיל מלא ב-CRM ←</a>
          </div>
        </td>
      </tr>
    </table>
  `;
}

export function renderDailyCallEmail(args: {
  verse:      TaoVerse;
  leads:      FinalLead[];
  recipients: string[]; // for "בוקר אור הדר ואלון" greeting
}): { subject: string; html: string } {
  const { verse, leads } = args;
  const dateHe = todayHebrewDate();
  const dayMonth = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", timeZone: "Asia/Jerusalem" }).format(new Date());

  const subject = leads.length > 0
    ? `שיחות היום · ${dayMonth} · ${leads.length} לידים חמים`
    : `בוקר טוב · ${dayMonth} · אין שיחות דחופות היום`;

  const intro = leads.length > 0
    ? `<p style="margin:0 0 4px 0;font-size:16px;color:${COLOR.fg}">בוקר אור הדר ואלון 🌅</p>
       <p style="margin:0;font-size:14px;color:${COLOR.fgMuted}">${esc(dateHe)} · ${leads.length} לידים שכדאי לחייג אליהם היום.</p>`
    : `<p style="margin:0 0 4px 0;font-size:16px;color:${COLOR.fg}">בוקר אור הדר ואלון 🌅</p>
       <p style="margin:0;font-size:14px;color:${COLOR.fgMuted}">${esc(dateHe)} · אין שיחות דחופות היום. יום טוב לעבוד על תוכן ותכנון.</p>`;

  const taoBox = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR.cardSoft};border-right:3px solid ${COLOR.gold};border-radius:8px;margin:20px 0">
      <tr>
        <td style="padding:16px 20px">
          <div style="font-size:11px;letter-spacing:1px;color:${COLOR.gold};font-weight:700;margin-bottom:6px">טאו טה צ'ינג · פרק ${verse.chapter}</div>
          <div style="font-size:15px;color:${COLOR.fg};line-height:1.7;font-style:italic">${esc(verse.he)}</div>
        </td>
      </tr>
    </table>
  `;

  const cards = leads.map((lead, i) => renderLeadCard(lead, i)).join("");

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:'Assistant',Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLOR.bg};padding:24px 12px">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="640" style="max-width:640px;background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:14px">
          <tr>
            <td style="padding:28px 28px 8px 28px;direction:rtl">
              ${intro}
              ${taoBox}
              ${cards}
              <p style="margin:24px 0 8px 0;font-size:11px;color:${COLOR.fgMuted};line-height:1.7;border-top:1px solid ${COLOR.border};padding-top:14px">
                המייל נשלח אוטומטית בכל בוקר ב-09:00 (א-ה). הליסט מבוסס על קוויז, התנהגות אתר, צ'קאאוטים ופעילות אחרונה. אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | TrueSignal©
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
