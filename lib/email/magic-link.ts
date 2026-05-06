import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export async function generateMagicLink(
  email: string,
  supabase: SupabaseClient<Database>
): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${APP_URL}/access`,
    },
  });

  if (error || !data.properties?.action_link) {
    return `${APP_URL}/account`;
  }

  return data.properties.action_link;
}

export function magicLinkFooterHtml(href: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:20px;">
  <tr>
    <td align="right" style="padding:0 32px 24px;">
      <p style="font-family:'Assistant',Arial,sans-serif;font-size:13px;color:#9E9990;margin:0 0 10px;text-align:right;">
        כניסה מהירה לאזור האישי שלך
      </p>
      <a href="${href}" style="display:inline-block;background:#E8B94A;color:#080C14;border-radius:8px;padding:10px 20px;font-family:'Assistant',Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;">
        כניסה לאזור האישי ←
      </a>
      <p style="font-family:'Assistant',Arial,sans-serif;font-size:11px;color:#6b7280;margin:8px 0 0;text-align:right;">
        הקישור בתוקף ל-7 ימים
      </p>
    </td>
  </tr>
</table>`;
}
