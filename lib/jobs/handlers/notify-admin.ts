import { Resend } from "resend";
import { adminAlert, FROM_NAME } from "@/lib/email/templates";

export interface NotifyAdminPayload {
  job_id: string;
  job_type: string;
  error: string;
  attempts: number;
}

export async function handleNotifyAdmin(
  payload: NotifyAdminPayload
): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;

  if (!adminEmail || !apiKey) {
    // Can't send - just log to stderr so it's visible in Vercel logs
    console.error("[notify-admin] Missing ADMIN_EMAIL or RESEND_API_KEY", payload);
    return;
  }

  const rendered = adminAlert({
    jobId: payload.job_id,
    jobType: payload.job_type,
    error: payload.error,
    attempts: payload.attempts,
  });

  const resend = new Resend(apiKey);
  const FROM_ADDRESS =
    process.env.NEXT_PUBLIC_FROM_EMAIL ?? "noreply@beegood.online";

  const { error } = await resend.emails.send({
    from: `${FROM_NAME} System <${FROM_ADDRESS}>`,
    to: adminEmail,
    subject: rendered.subject,
    html: rendered.html,
  });

  if (error) {
    // Don't throw - this is already an error path. Just log.
    console.error("[notify-admin] Resend failed:", error.message);
  }
}
