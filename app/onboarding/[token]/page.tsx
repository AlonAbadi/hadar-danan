import { createServerClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("atelier_applications")
    .select("id, name, instagram, whatsapp, niche, target_audience, tone_keywords, products, testimonials, business_type, business_id, business_address, documents, onboarding_submitted_at")
    .eq("onboarding_token", token)
    .single();

  if (error || !data) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f7fb", fontFamily: "Assistant, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>הקישור אינו תקף</div>
          <div style={{ fontSize: 15, color: "#6b7280" }}>יתכן שהקישור פג תוקף או שגוי. פנה לצוות BeeGood.</div>
        </div>
      </div>
    );
  }

  return <OnboardingClient app={data} token={token} />;
}
