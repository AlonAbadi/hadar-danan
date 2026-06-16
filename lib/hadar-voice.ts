/**
 * Hadar Voice Layer — Magic #7 (5-tier affirmation system)
 *
 * Plays Hadar voice micro-clips on key interaction triggers. Provides
 * variable-reward dopamine response (Skinner) tuned to Hadar's 5-tier
 * affirmation ladder.
 *
 * V1 (current): Silent placeholders. The system is fully wired but plays
 *               no audio until voice clips arrive.
 * V2 (post-Hadar-recording-day): Drop 80 MP3 files into /public/voice/hadar/
 *               and flip HADAR_VOICE_ENABLED=true. Zero code changes needed.
 *
 * The 5 tiers (from Hadar's actual voice patterns, validated across the corpus):
 *   Tier 1 — "אוקיי" (transition, not approval)
 *   Tier 2 — "יופי"
 *   Tier 3 — "מדויק / מעולה / מדהים"
 *   Tier 4 — "מושלם / וואו"
 *   Tier 5 — "חלום" (apex, very rare)
 *
 * Plus reformulation cues and embodiment reminders (separate triggers).
 */

export const HADAR_VOICE_ENABLED = false;  // Flip to true after recording day

export type AffirmationTier = 1 | 2 | 3 | 4 | 5;

export type VoiceTrigger =
  // Navigation / minor progress (Tier 1)
  | "nav_click"
  | "scroll_to_section"
  // Section completion (Tier 2)
  | "completed_first_card"
  | "saved_preference"
  // Mid-session validation (Tier 3)
  | "completed_identity_statement"
  | "selected_4_pillars"
  | "expanded_video_card"
  // Major milestones (Tier 3 strong)
  | "completed_act_1"
  | "completed_act_2"
  | "completed_act_3"
  // Apex moments (Tier 4)
  | "completed_12_videos"
  | "marked_decision_1"
  | "marked_decision_2"
  // Final reward (Tier 5)
  | "marked_decision_3"
  | "completed_shoot_day"
  // Reformulation
  | "user_tried_3_takes"
  | "user_stuck"
  // Methodology reveal (Magic #2)
  | "clicked_why_button"
  // Closing signature
  | "session_closing";

interface VoiceClip {
  id:        string;
  file:      string;       // /voice/hadar/{file}.mp3
  transcript: string;
  tier?:     AffirmationTier;
  duration_ms: number;     // approximate
}

// ── Clip Library ─────────────────────────────────────────────────────
// All 80 micro-clips Hadar will record on session day. File paths are
// expected; clips don't exist yet (V1).
//
// Source: BEEGOOD_PRODUCT_BUILD_PLAN.md Section 3 (Hadar Recording Brief).

const CLIPS: Record<string, VoiceClip> = {
  // Tier 1 — "אוקיי" (10 variants)
  A1:  { id: "A1",  file: "A1_okay.mp3",            transcript: "אוקיי.",                       tier: 1, duration_ms: 800 },
  A2:  { id: "A2",  file: "A2_okay_continuing.mp3", transcript: "אוקיי, ממשיכים.",                 tier: 1, duration_ms: 1500 },
  A3:  { id: "A3",  file: "A3_okay_listening.mp3",  transcript: "אוקיי, אני שומעת.",               tier: 1, duration_ms: 1500 },
  A4:  { id: "A4",  file: "A4_tov.mp3",             transcript: "טוב.",                          tier: 1, duration_ms: 700 },
  A6:  { id: "A6",  file: "A6_ken_nachon.mp3",      transcript: "כן, נכון.",                     tier: 1, duration_ms: 1100 },

  // Tier 2 — "יופי" (10 variants)
  A11: { id: "A11", file: "A11_yofi.mp3",           transcript: "יופי.",                         tier: 2, duration_ms: 800 },
  A12: { id: "A12", file: "A12_yofi_kacha.mp3",     transcript: "יופי, ככה.",                    tier: 2, duration_ms: 1300 },
  A13: { id: "A13", file: "A13_yofi_bediuk.mp3",    transcript: "יופי, בדיוק.",                  tier: 2, duration_ms: 1300 },
  A14: { id: "A14", file: "A14_yofi_metzuyan.mp3",  transcript: "יופי, מצוין.",                  tier: 2, duration_ms: 1400 },

  // Tier 3 — "מדויק / מעולה / מדהים" (10 variants)
  A21: { id: "A21", file: "A21_meduyak.mp3",            transcript: "מדויק.",                         tier: 3, duration_ms: 1000 },
  A22: { id: "A22", file: "A22_meduyak_bediuk_ze.mp3",  transcript: "מדויק. בדיוק זה.",               tier: 3, duration_ms: 1700 },
  A24: { id: "A24", file: "A24_meule.mp3",              transcript: "מעולה.",                         tier: 3, duration_ms: 900 },
  A26: { id: "A26", file: "A26_meule_etzlech.mp3",      transcript: "מעולה. עכשיו זה אצלך.",         tier: 3, duration_ms: 1800 },
  A27: { id: "A27", file: "A27_madhim.mp3",             transcript: "מדהים.",                         tier: 3, duration_ms: 1000 },
  A29: { id: "A29", file: "A29_madhim_zerega.mp3",      transcript: "מדהים. זה רגע.",                tier: 3, duration_ms: 1500 },

  // Tier 4 — "מושלם / וואו" (8 variants)
  A31: { id: "A31", file: "A31_mushlam.mp3",            transcript: "מושלם.",                         tier: 4, duration_ms: 1000 },
  A33: { id: "A33", file: "A33_mushlam_ohevet.mp3",     transcript: "מושלם, אני אוהבת את זה.",       tier: 4, duration_ms: 2000 },
  A34: { id: "A34", file: "A34_wow.mp3",                transcript: "וואו.",                          tier: 4, duration_ms: 1000 },
  A35: { id: "A35", file: "A35_wow_shinit.mp3",         transcript: "וואו, את שינית עכשיו משהו.",    tier: 4, duration_ms: 2200 },

  // Tier 5 — "חלום" (2 variants)
  A39: { id: "A39", file: "A39_chalom.mp3",             transcript: "חלום.",                          tier: 5, duration_ms: 1000 },
  A40: { id: "A40", file: "A40_chalom_tov_atzmecha.mp3", transcript: "חלום. תהיה טוב לעצמך.",        tier: 5, duration_ms: 2200 },

  // Reformulation cues
  A41: { id: "A41", file: "A41_rega_tagid_shuv.mp3",    transcript: "רגע, תגיד שוב.",                 duration_ms: 1400 },
  A43: { id: "A43", file: "A43_tagid_otenti.mp3",       transcript: "תגיד את זה יותר אותנטי.",       duration_ms: 1900 },
  A48: { id: "A48", file: "A48_lo_lazuz.mp3",           transcript: "רגע, אל תזוז בכיסא.",           duration_ms: 1700 },

  // Long-form
  C71: { id: "C71", file: "C71_maspik_muchan.mp3",
         transcript: "מספיק. אתה מוכן. אל תתאמן יותר, תרגע. תקרא ביום הצילום, ותהיה איתי בראש.",
         duration_ms: 14000 },
  C80: { id: "C80", file: "C80_tihiu_tovim_session.mp3",
         transcript: "סיימת. יש לך עכשיו שני סרטונים, או חמישה, או שניים-עשר. לא משנה. מה שמשנה זה שאתה התחלת. ועכשיו אתה ממשיך. תהיו טובים.",
         duration_ms: 16000 },

  // Methodology reveal voiceovers (Magic #2)
  B53: { id: "B53", file: "B53_mode_b.mp3",
         transcript: "Mode B. הלקוח לא יודע מה לומר, ואני מכתיבה משפט-משפט. iteration cycle, gift sentence בסוף.",
         duration_ms: 12000 },
};

// ── Trigger Map ──────────────────────────────────────────────────────
// Each trigger maps to candidate clip IDs. The player picks one at random
// (variable reward — Skinner). Multiple candidates per trigger so users
// don't hear the same voice every time.

const TRIGGER_MAP: Record<VoiceTrigger, string[]> = {
  // Tier 1 — transitions
  nav_click:                  ["A1", "A2"],
  scroll_to_section:          ["A4", "A6"],

  // Tier 2 — minor completion
  completed_first_card:       ["A11", "A12"],
  saved_preference:           ["A13"],

  // Tier 3 — mid-session validation
  completed_identity_statement: ["A21", "A22"],
  selected_4_pillars:         ["A24", "A26"],
  expanded_video_card:        ["A11"],

  // Tier 3 strong — major milestones
  completed_act_1:            ["A24"],
  completed_act_2:            ["A27"],
  completed_act_3:            ["A29"],

  // Tier 4 — apex moments
  completed_12_videos:        ["A31", "A33"],
  marked_decision_1:          ["A34"],
  marked_decision_2:          ["A35"],

  // Tier 5 — final reward
  marked_decision_3:          ["A39"],
  completed_shoot_day:        ["A40"],

  // Reformulation
  user_tried_3_takes:         ["A41"],
  user_stuck:                 ["A43"],

  // Methodology
  clicked_why_button:         ["B53"],

  // Closing
  session_closing:            ["C80"],
};

// ── Player ───────────────────────────────────────────────────────────

class HadarVoicePlayer {
  private cooldown_ms     = 8000;
  private last_played_at  = 0;
  private current_audio:  HTMLAudioElement | null = null;

  play(trigger: VoiceTrigger): void {
    if (!HADAR_VOICE_ENABLED)                           return;
    if (typeof window === "undefined")                  return;
    if (Date.now() - this.last_played_at < this.cooldown_ms) return;

    const candidates = TRIGGER_MAP[trigger];
    if (!candidates || candidates.length === 0)         return;

    const clipId = candidates[Math.floor(Math.random() * candidates.length)];
    const clip   = CLIPS[clipId];
    if (!clip)                                           return;

    // Stop previous if still playing
    if (this.current_audio) {
      this.current_audio.pause();
      this.current_audio = null;
    }

    try {
      const audio = new Audio(`/voice/hadar/${clip.file}`);
      audio.volume = 0.4;
      audio.play().catch(() => {
        // Browser blocked autoplay or file missing — silent fail
      });
      this.current_audio   = audio;
      this.last_played_at  = Date.now();
    } catch {
      // Silent fail in V1
    }
  }

  // Manually stop the current clip if user navigates away
  stop(): void {
    if (this.current_audio) {
      this.current_audio.pause();
      this.current_audio = null;
    }
  }
}

let _instance: HadarVoicePlayer | null = null;

export function getHadarVoice(): HadarVoicePlayer {
  if (typeof window === "undefined") {
    // Server-side — return a no-op stub
    return { play: () => {}, stop: () => {} } as unknown as HadarVoicePlayer;
  }
  if (!_instance) {
    _instance = new HadarVoicePlayer();
  }
  return _instance;
}

// ── Convenience hook ─────────────────────────────────────────────────

export function playHadarVoice(trigger: VoiceTrigger): void {
  getHadarVoice().play(trigger);
}
