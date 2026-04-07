import { cookies } from "next/headers";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { lessonVideoId } from "@/lib/course-config";
import CoursePlayer from "./CoursePlayer";
import type { Database } from "@/lib/supabase/types";

export default async function CourseContentPage() {
  const cookieStore = await cookies();

  // 1. Verify session
  const supabase = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/course/content");

  const db = createServerClient();

  // 2. Get CRM user row
  const { data: userData } = await db
    .from("users")
    .select("id, email")
    .eq("auth_id", user.id)
    .maybeSingle();

  // 3. Check for completed course purchase
  if (userData) {
    const { data: purchase } = await db
      .from("purchases")
      .select("id")
      .eq("user_id", userData.id)
      .eq("product", "course_1800")
      .eq("status", "completed")
      .maybeSingle();

    if (!purchase) redirect("/course?access=denied");
  } else {
    redirect("/course?access=denied");
  }

  // 4. Fetch completed lessons from video_events
  const allVideoIds = Array.from({ length: 16 }, (_, i) => lessonVideoId(i + 1));

  const { data: videoEvents } = await db
    .from("video_events")
    .select("video_id")
    .eq("user_email", userData.email)
    .eq("event_type", "completed")
    .in("video_id", allVideoIds);

  const completedVideoIds = (videoEvents ?? []).map((e) => e.video_id);

  return (
    <CoursePlayer
      completedVideoIds={completedVideoIds}
      userEmail={userData.email}
    />
  );
}
