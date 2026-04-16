import { createServerClient } from "@/lib/supabase/server";

export async function getTrainingViewCount(): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("video_events")
    .select("*", { count: "exact", head: true })
    .eq("video_id", "training_free")
    .eq("event_type", "training_page_view");
  if (error) return 0;
  return count ?? 0;
}
