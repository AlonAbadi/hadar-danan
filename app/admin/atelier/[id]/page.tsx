import { createServerClient } from "@/lib/supabase/server";
import { AtelierOnboardClient } from "./AtelierOnboardClient";

export default async function AtelierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("atelier_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#0D1018", padding: 32, fontFamily: "var(--font-assistant), Assistant, sans-serif", color: "#9E9990" }}>
        בקשה לא נמצאה
      </div>
    );
  }

  return <AtelierOnboardClient app={data} />;
}
