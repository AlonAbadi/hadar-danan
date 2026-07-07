/**
 * /kaveret — כוורת האות, the redesigned member home.
 *
 * Skeleton is IDENTICAL for every member (design/kaveret/beegood-kaveret-haot-master.html
 * is the source of truth); only the texts inside come from the member's records:
 * signal fields from signal_extractions, kit texts from signal.content_kit when
 * present (with signal-field fallbacks), challenge day from challenge_enrollments,
 * filmed count from broadcast_edits.
 *
 * Dev-only demo mode (?demo=1, NODE_ENV=development) renders the mockup's exact
 * sample content with no auth — this is what scripts/visual-check.mjs compares
 * pixel-for-pixel against the mockup.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Viewport } from "next";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { CHALLENGE_DAYS } from "@/lib/challenge-config";
import { pickPrimaryExtractionId } from "@/lib/signal/primary-extraction";
import { KaveretClient, type KaveretData } from "./KaveretClient";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080C14",
};

// The mockup's sample content, verbatim — the visual-check baseline.
const DEMO: KaveretData = {
  firstName: "אלון",
  gender: "m",
  signalText: "בנית לעצמך שקט פנימי בתוך עולם שרץ, ועכשיו אתה קורא דרכו את התוצאה של מה שאדם עושה, עוד לפני שהוא מסתכל קדימה.",
  positioning: "אתה הכתובת למי שחזק מספיק כדי להמשיך, אבל כבר מספיק עייף מלהמשיך לבד בלי שמישהו יקרא לאן זה בעצם הולך.",
  persona: "הוא לא אדם שנשבר. הוא אדם שממשיך, וזה בדיוק מה שמטריד אותו. הוא קם בבוקר, הולך למקום שהוא לא בחר בו באמת, עושה את העבודה טוב, ולא מבין למה זה מרגיש כמו הליכה במקום. מבחוץ הוא נראה מסודר. בפנים יש שאלה שהוא לא שואל בקול, כי הוא לא בטוח שיש לה תשובה, ומפחד קצת שאם ישאל אותה הוא יצטרך לשנות משהו שעדיין לא מוכן להשתנות.",
  cards: [
    { name: "המשפט הציבורי", use: "לפוסט היכרות", text: "לאלה שיודעים שיש להם כיוון, אבל עדיין לא מצאו מי שרואה אותו לפניהם.", file: "beegood-signal-public.png" },
    { name: "האות שלך", use: "לרגעים הגדולים", text: "בנית לעצמך שקט פנימי בתוך עולם שרץ, ועכשיו אתה קורא דרכו את התוצאה של מה שאדם עושה, עוד לפני שהוא מסתכל קדימה.", file: "beegood-signal-ot.png" },
    { name: "ההבטחה", use: "לסטורי או להזמנה לשיחה", text: "אני עוזר לך לקרוא את עצמך לפני שאתה מתקדם.", file: "beegood-signal-promise.png" },
  ],
  identity: "אני קורא לאן העשייה שלך מובילה, לפני שאתה רואה את התמונה המלאה.",
  bioInstagram: "קורא לאן העשייה שלך מובילה, לפני שאתה רואה את התמונה המלאה.",
  linkedinHeadline: "מסנן את הרעש ומאתר לאן העשייה מובילה | אנשים שתקועים במקום הלא נכון | שקט כקריאה",
  facebookAbout: "בניתי לעצמי שקט פנימי בתוך עולם שרץ, והיום אני קורא דרכו לאן העשייה של אנשים מובילה, עוד לפני שהם מסתכלים קדימה. אם אתה ממשיך כבר הרבה זמן בלי שמישהו יקרא איתך את הכיוון, אני כאן בשביל זה.",
  challengeDay: 3,
  monthLabel: "יולי",
  filmedCount: 0,
  scriptsTotal: 7,
  scripts: [],
  extractionId: null,
  challengeDays: [],
  completedDays: [],
  challengeDone: false,
  filmedNumbers: [],
  aboutSite: "",
  manifesto: "",
  reels: [],
  waPhone: "972000000000",
  demo: true,
};

// Card text splitter: the last clause (after the final comma) becomes the bold
// "main"; everything before it is the muted "lead". No comma = all main.
function splitCard(text: string): { lead: string; main: string } {
  const i = text.lastIndexOf(",");
  if (i > 0 && i < text.length - 2) {
    return { lead: text.slice(0, i + 1).trim(), main: text.slice(i + 1).trim() };
  }
  return { lead: "", main: text.trim() };
}

export default async function KaveretPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const { demo } = await searchParams;
  if (demo === "1" && process.env.NODE_ENV === "development") {
    return <KaveretClient data={DEMO} cardsSplit={DEMO.cards.map((c) => splitCard(c.text))} />;
  }

  const cookieStore = await cookies();
  const supabaseAuth = createSSRClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user: authUser } } = await supabaseAuth.auth.getUser();
  if (!authUser) redirect("/login?next=/kaveret");

  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userData } = await (db as any)
    .from("users")
    .select("id, name, gender, hive_status")
    .eq("auth_id", authUser.id)
    .maybeSingle();
  if (!userData) redirect("/account");
  if (userData.hive_status !== "active") redirect("/hive");

  const primary = await pickPrimaryExtractionId(db, userData.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ext } = primary
    ? await (db as any)
        .from("signal_extractions")
        .select("id, signal")
        .eq("id", primary.id)
        .maybeSingle()
    : { data: null };
  if (!ext) redirect("/signal?from=kit");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signal = (ext.signal ?? {}) as any;
  const kit = signal.content_kit ?? {};
  const identity =
    signal.shoot_day?.identity_statement ??
    signal.shoot_day_phase1?.identity_statement ??
    signal.signal ??
    "";

  // Challenge enrollment — auto-created on first visit (the challenge content
  // page convention, migration 032), so "סיימתי את היום" always has a target.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: enrollment } = await (db as any)
    .from("challenge_enrollments")
    .select("id, current_day, completed_at")
    .eq("user_id", userData.id)
    .maybeSingle();
  if (!enrollment) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created } = await (db as any)
      .from("challenge_enrollments")
      .insert({ user_id: userData.id })
      .select("id, current_day, completed_at")
      .maybeSingle();
    enrollment = created;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: completions } = enrollment
    ? await (db as any)
        .from("challenge_day_completions")
        .select("day_number")
        .eq("enrollment_id", enrollment.id)
    : { data: [] };
  const completedDays: number[] = (completions ?? []).map(
    (c: { day_number: number }) => c.day_number
  );

  // Filmed count: distinct scripts with a finished reel for this extraction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: readyEdits } = await (db as any)
    .from("broadcast_edits")
    .select("video_number")
    .eq("extraction_id", ext.id)
    .eq("status", "ready");
  const filmedCount = new Set(
    (readyEdits ?? []).map((e: { video_number: number }) => e.video_number)
  ).size;

  // Scripts for the monthly zone: number + title from the shoot-day plan.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toScript = (v: any) => ({
    number: v.number,
    title: String(v.title ?? ""),
    hook: String(v.script?.hook ?? ""),
    body: String(v.script?.body ?? ""),
    cta: v.script?.cta ? String(v.script.cta) : "",
  });
  const planVideos = Array.isArray(signal.shoot_day?.videos)
    ? signal.shoot_day.videos.map(toScript)
    : Array.from({ length: 12 }, (_, i) => i + 1)
        .filter((n) => signal[`shoot_day_v${n}`])
        .map((n) => toScript(signal[`shoot_day_v${n}`]));

  const monthLabel = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    timeZone: "Asia/Jerusalem",
  }).format(new Date());

  // Live challenge board: full 0-7 config for in-page day chips + player.
  const challengeDayNum = Math.min(Math.max(enrollment?.current_day ?? 0, 0), 7);
  const challengeDays = CHALLENGE_DAYS.filter((d) => d.day >= 0 && d.day <= 7).map((d) => ({
    day: d.day,
    title: d.title,
    videoId: d.videoId,
    portrait: d.aspectRatio === "9:16",
  }));
  const challengeDone = Boolean(enrollment?.completed_at) || completedDays.includes(7);

  // Produced reels for the my-content zone (same source as /api/broadcast/reels).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reelEdits } = await (db as any)
    .from("broadcast_edits")
    .select("id, video_number, output_path, review_item_id, created_at")
    .eq("user_id", userData.id)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(20);
  const reelItemIds = (reelEdits ?? []).map((e: { review_item_id: string | null }) => e.review_item_id).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reelItems } = reelItemIds.length
    ? await (db as any).from("review_items").select("id, status").in("id", reelItemIds)
    : { data: [] };
  const reels = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reelEdits ?? []).map(async (e: any) => {
      const prefix = e.output_path?.split("/")[0];
      const [thumb, download] = await Promise.all([
        prefix
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (db as any).storage.from("broadcast-takes").createSignedUrl(`${prefix}/covers/${e.id}-frame0.jpg`, 3600)
          : Promise.resolve({ data: null }),
        e.output_path
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (db as any).storage.from("broadcast-takes").createSignedUrl(e.output_path, 7200, { download: `reel-${e.video_number}.mp4` })
          : Promise.resolve({ data: null }),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item = (reelItems ?? []).find((i: any) => i.id === e.review_item_id);
      return {
        editId: e.id,
        reviewItemId: e.review_item_id,
        videoNumber: e.video_number,
        createdAt: e.created_at,
        published: item?.status === "published",
        thumbUrl: thumb.data?.signedUrl ?? null,
        downloadUrl: download.data?.signedUrl ?? null,
      };
    })
  );

  const data: KaveretData = {
    firstName: userData.name?.split(" ")[0] ?? "",
    gender: userData.gender === "m" ? "m" : userData.gender === "f" ? "f" : null,
    signalText: String(signal.signal ?? ""),
    positioning: String(kit.positioning_statement ?? signal.signal_promise ?? ""),
    persona: String(kit.persona_description ?? signal.people ?? ""),
    // Outward-facing texts come ONLY from the content kit — the kit is the
    // translation layer from the inward diagnostic to audience-facing copy.
    // Raw signal fields speak TO the member in second person ("בנית לעצמך"),
    // so they are never valid stand-ins for a bio or an about (field bug:
    // inward text dressed as social copy). The one deliberate exception is
    // the signal card itself — the signal IS the product there.
    cards: [
      { name: "המשפט הציבורי", use: "לפוסט היכרות", text: String(kit.bio_short ?? ""), file: "beegood-signal-public.png" },
      { name: "האות שלך", use: "לרגעים הגדולים", text: String(signal.signal ?? ""), file: "beegood-signal-ot.png" },
      { name: "ההבטחה", use: "לסטורי או להזמנה לשיחה", text: String(signal.signal_promise ?? ""), file: "beegood-signal-promise.png" },
    ].filter((c) => c.text.trim().length > 0),
    identity: String(identity),
    bioInstagram: String(kit.bio_short ?? ""),
    linkedinHeadline: String(kit.linkedin_headline ?? ""),
    facebookAbout: String(kit.bio_medium ?? ""),
    challengeDay: challengeDayNum,
    monthLabel,
    filmedCount,
    scriptsTotal: planVideos.length || 7,
    scripts: planVideos,
    extractionId: ext.id,
    challengeDays,
    completedDays,
    challengeDone,
    filmedNumbers: Array.from(
      new Set((readyEdits ?? []).map((e: { video_number: number }) => e.video_number))
    ) as number[],
    aboutSite: String(kit.bio_long ?? ""),
    manifesto: String(kit.manifesto ?? ""),
    reels,
    waPhone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "972539566961",
    demo: false,
  };

  return <KaveretClient data={data} cardsSplit={data.cards.map((c) => splitCard(c.text))} />;
}
