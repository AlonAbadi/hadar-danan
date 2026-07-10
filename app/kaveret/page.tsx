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
import { CHALLENGE_DAYS, computeNextLiveMeetingDate } from "@/lib/challenge-config";
import { pickPrimaryExtractionId } from "@/lib/signal/primary-extraction";
import { MobileNavServer } from "@/components/MobileNavServer";
import { DesktopNavServer } from "@/components/DesktopNavServer";
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
  liveMeeting: null,
  filmedNumbers: [],
  aboutSite: "",
  manifesto: "",
  letterFromHadar: null,
  pillars: null,
  reels: [],
  waPhone: "972000000000",
  demo: true,
};

// "יום שלישי, 28 ביולי, בשעה 17:00" — same formatting the /challenge page
// uses, pinned to Asia/Jerusalem.
function formatLiveMeeting(d: Date): string {
  const dayPart = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem", weekday: "long", day: "numeric", month: "long",
  }).format(d).replace(/,?\s*\d{4}$/, "");
  const timePart = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
  return `${dayPart}, בשעה ${timePart}`;
}

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
  searchParams: Promise<{ demo?: string; t?: string }>;
}) {
  const { demo, t } = await searchParams;
  if (demo === "1" && process.env.NODE_ENV === "development") {
    return <KaveretClient data={DEMO} cardsSplit={DEMO.cards.map((c) => splitCard(c.text))} />;
  }

  // Visitor tokens live at /kaveret/i (full site chrome there); keep old
  // links working.
  if (t) redirect(`/kaveret/i?t=${encodeURIComponent(t)}`);

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

  // Dynamic Hadar letter (added 2026-07-10). Falls back to the static letter
  // in KaveretClient if the phase-1 pack didn't yet produce one (older
  // customers, or the field regressed from the model). Two-line shape:
  // { body, close } — body sets the diagnosis, close invites to the shoot.
  const letterFromHadar =
    signal.shoot_day_phase1?.letter_from_hadar ??
    signal.shoot_day?.letter_from_hadar ??
    null;

  // Phase-1 pillars — needed on the client so <EpisodesList> can request
  // per-video generation for the unbuilt rows (POST /shoot-day/videos wants
  // identity_statement + pillars alongside numbers). Falls back to whatever
  // is cached under shoot_day; when both are null the client hides the
  // per-row "צור את הסקריפט" trigger (nothing to generate against).
  const shootDayPillars =
    signal.shoot_day_phase1?.pillars ??
    signal.shoot_day?.pillars ??
    null;

  // Challenge enrollment (auto-created on first visit, migration 032
  // convention) + filmed reels — independent queries, fired together so the
  // first byte doesn't pay for them serially.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: enrollmentRow }, { data: readyEdits }] = await Promise.all([
    (db as any)
      .from("challenge_enrollments")
      .select("id, current_day, completed_at")
      .eq("user_id", userData.id)
      .maybeSingle(),
    (db as any)
      .from("broadcast_edits")
      .select("video_number")
      .eq("extraction_id", ext.id)
      .eq("status", "ready"),
  ]);
  let enrollment = enrollmentRow;
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

  // Reels are hydrated client-side from /api/broadcast/reels — signing two
  // storage URLs per reel here was the single biggest first-byte cost.

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
    // Canonical shoot day = 7 videos. Never scale to what happens to be cached
    // — the header used to render "2 מתוך 1 צולמו" when only Video #1 had been
    // generated but two edits landed under different numbers.
    scriptsTotal: 7,
    scripts: planVideos,
    extractionId: ext.id,
    challengeDays,
    completedDays,
    challengeDone,
    liveMeeting: (() => {
      const meeting = computeNextLiveMeetingDate();
      const day8 = CHALLENGE_DAYS.find((d) => d.day === 8);
      // The Zoom link publishes close to the session: show it only inside
      // the final 3 days (the team refreshes it in challenge-config before
      // each meeting, same flow as /challenge/content).
      const soon = meeting.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
      const zoomUrl =
        soon && day8?.videoId?.startsWith("http") ? day8.videoId : null;
      return { label: formatLiveMeeting(meeting), zoomUrl };
    })(),
    filmedNumbers: Array.from(
      new Set((readyEdits ?? []).map((e: { video_number: number }) => e.video_number))
    ) as number[],
    aboutSite: String(kit.bio_long ?? ""),
    manifesto: String(kit.manifesto ?? ""),
    letterFromHadar: letterFromHadar
      ? { body: String(letterFromHadar.body ?? ""), close: String(letterFromHadar.close ?? "") }
      : null,
    pillars: Array.isArray(shootDayPillars) ? shootDayPillars : null,
    reels: [],
    waPhone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || "972539566961",
    demo: false,
  };

  // Per Alon: the member home carries the site's own top banner (LayoutShell
  // hides the global nav for /kaveret, so it renders here; the demo/gate
  // branch above stays nav-less on purpose).
  return (
    <>
      <MobileNavServer />
      <DesktopNavServer />
      <div style={{ paddingTop: 64 }}>
        <KaveretClient data={data} cardsSplit={data.cards.map((c) => splitCard(c.text))} />
      </div>
    </>
  );
}
