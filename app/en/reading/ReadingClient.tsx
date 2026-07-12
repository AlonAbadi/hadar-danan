"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase/browser";
import { BeeWait } from "@/components/BeeWait";
import { SIGNAL_QUESTIONS_EN_V2 } from "@/lib/prompts/signal-engine-en-v2";

// ─────────────────────────────────────────────────────────────────────────────
// /en/reading — English unified funnel, the /en twin of /kriah (v2 funnel).
// State machine ported from app/kriah/KriahClient.tsx; copy authored in
// English at the same emotional register. Question keys come verbatim from
// SIGNAL_QUESTIONS_EN_V2 — the extract route matches on those keys.
//
// Two deliberate divergences from the Hebrew client:
// 1. No /api/kriah/finalize call — that endpoint is v2_funnel-only and sends
//    the Hebrew letter template. The English letter arrives through the
//    SIGNAL_EXTRACTED_EN email sequence enqueued by the extract route.
// 2. Extraction always runs AFTER the send gate (single path), so the gate's
//    confirmed name/email/occupation ride inside the extract payload itself
//    and nothing needs patching afterwards.
//
// Copy rules: plain hyphen only (never an em dash), no exclamation marks.
// ─────────────────────────────────────────────────────────────────────────────

type StateKey   = "A" | "B" | "C" | "D";
type BlockerKey = "message" | "content" | "price" | "time";

type Screen =
  | "s2" | "s3" | "s4" | "s6" | "s7" | "s8"
  | "q" | "probe" | "s15" | "loading" | "sendgate" | "s16" | "exit" | "error";

type SignalOutput = {
  occupation?:        string | null;
  pain_source:        string;
  element:            string;
  signal:             string;
  signal_promise:     string;
  central_tool:       string;
  people:             string;
  content_directions: string[];
  warm_note:          string;
};

// /en editorial palette — matches app/en/page.tsx, NOT the Hebrew Santosha page.
const C = {
  bg:       "#0D0C0A",
  card:     "#141210",
  cardSoft: "#1C1915",
  gold:     "#C2973F",
  goldDeep: "#9A7526",
  fg:       "#F2EDE4",
  muted:    "rgba(242,237,228,0.55)",
  faint:    "rgba(242,237,228,0.32)",
  line:     "rgba(242,237,228,0.10)",
  goldLine: "rgba(194,151,63,0.28)",
  error:    "#E08A7A",
};

const MIN_CHARS = 40;                    // soft nudge, same as the Hebrew funnel
const DRAFT_KEY = "reading_en_draft";
const INSTRUMENT = "v2_funnel_en";

// ── S2/S3 choices ────────────────────────────────────────────────────────────

const STATE_OPTIONS: { key: StateKey; label: string }[] = [
  { key: "A", label: "No business yet, just an idea" },
  { key: "B", label: "First clients, income not steady yet" },
  { key: "C", label: "Steady income, but everything runs through me" },
  { key: "D", label: "An established business looking for its next leap" },
];

const BLOCKER_OPTIONS: { key: BlockerKey; label: string }[] = [
  { key: "message", label: "The message" },
  { key: "content", label: "The content" },
  { key: "price",   label: "The pricing" },
  { key: "time",    label: "The time" },
];

// ── S6 matrix — 16 cells, English equivalents of the Hebrew deck ─────────────

const MATRIX: Record<string, string> = {
  A_message:
    "There is no business yet, and the message is what stops you. In other words, you are waiting for the right wording before you step out. But it works the other way around from how it feels: a message is not written at a desk, it reveals itself the moment a real person tells you why they came to you specifically. Your first client is not waiting for a perfect message. The message is waiting for your first client.",
  A_content:
    "Interesting that you chose content. There is no business yet, but what weighs on you is the publishing. Usually that is a sign content has become a test: every post feels like a statement about who you are, so it is easier not to post. The problem is not your ability to produce content. It is deciding what you are willing to have said about you.",
  A_price:
    "You have not asked anyone for money yet, and pricing already stops you. That is less strange than it sounds: when there is no sentence yet that says what you give that others do not, every number feels arbitrary, too high and too low at the same time. The price is not waiting for the right rate. It is waiting for you to know what it is for.",
  A_time:
    "At the very beginning, before clients are pulling at your sleeve, time should be your biggest asset. If it still stops you, it is almost never the calendar. When there is no single sentence that decides what is worth your time, every task looks equally urgent. That clarity will not come from one more free hour in your schedule.",
  B_message:
    "People are already paying you. That is proof the value is real. But you marked the message as what is still unclear: when the value exists and the message is blurry, you get chosen despite your message, not because of it. What is missing is not more persuasion. It is one sentence that says out loud what is already quietly working.",
  B_content:
    "Your first clients arrived without a content machine. Someone heard, someone recommended, something worked face to face. And now content, of all things, feels like the blocker. Worth pausing on: what has sold so far is something you say naturally in conversation. Content is stuck not because you lack the skill, but because it does not say that thing yet.",
  B_price:
    "A few people have already paid you, and still pricing is what stops you. Ask yourself how those deals closed: if every sale took convincing, a discount, or personal effort, the problem is not the number. People pay easily only when it is clear what they are paying for. Until then any price, even a low one, will feel expensive.",
  B_time:
    "Unsteady income and time running out is a combination worth pausing on. When it is not yet clear where the next payment comes from, you say yes to almost everything, and the calendar fills with work that stabilizes nothing. Time does not run out because there is too much work. It runs out because there is no sentence that decides which work deserves a no.",
  C_message:
    "The income is steady, so a message exists, someone clearly understands why to choose you. But notice where it lives: in your mouth, in conversations only you know how to hold. That is exactly why everything runs through you. A message that was never put into words cannot be handed on, not to an employee, not to a sales page, not to a referral.",
  C_content:
    "The business works, clients come back, and still content feels like a front that never closes. That is no accident: when everything runs through you, content runs through you too, and without one sentence that decides what it is here to say, every post starts from zero. More content will not close that front. One sentence all the posts return to will.",
  C_price:
    "There is steady income, and everything runs through you. And then pricing stops you. Connect those two: when the real product is your hours, every price increase feels like a promise you will have to keep personally. It is not the number that scares you, it is the commitment it represents. A price rises easily when it is clear what it buys besides you.",
  C_time:
    "It looks obvious: everything runs through you, of course there is no time. But the question is why it has to run through you. Usually it is not because there is no one to hand things to, but because only you know how to say the right thing at the right moment. That is not a time problem. It is knowledge that has not yet become a sentence others can say.",
  D_message:
    "A business does not survive for years without a message that works. So if after this whole road you marked the message, it probably did not disappear, it aged. The sentence that built what you have was aimed at who you were when you started. The next leap does not need a brand new message out of thin air. It needs the version you have already grown into.",
  D_content:
    "You got this far, an established and stable business, probably without depending on content. And now it seems the next leap will come from it. Maybe. But content is an amplifier, not an engine: it enlarges what is already clear, and blurs even further what is not. Before asking how much to publish, it is worth knowing what sentence all of it is supposed to amplify.",
  D_price:
    "You are already selling but feel stuck, and you marked pricing. The gap is subtle: when the conversation keeps landing on price, the message usually has not yet done the work of explaining why you specifically. A price only feels high when the difference is not heard.",
  D_time:
    "After years in business, time is usually not what is missing but what gets swallowed. The routine you built works so well it fills every hour, and the next leap gets pushed to next quarter, again. Another round of calendar tidying will not solve it. A leap gets time only when there is a sentence that defines it sharply enough to commit to.",
};

const FALLBACK_CELL =
  "The combination you chose is one of the rare ones here, and that is not a glitch, it is information: your business does not sit in a ready-made category. And one thing is almost always true, even before we know you: the message, the content, the pricing and the time are four names for one and the same question, what is the thing only you give. Once that has a sentence, all four start arranging themselves around it.";

const LIMITATION_LINE =
  "Three answers make a sketch, not a portrait. The sentence that sets you apart can only be built from what actually happened to you.";

// ── S9-S14 — the six questions (keys verbatim from SIGNAL_QUESTIONS_EN_V2) ──

interface Question {
  key:        string;
  label:      string;
  hint:       string;
  extraHint?: string;   // Q3 width line for people without clients yet
}

const QUESTION_HINTS: Record<string, { hint: string; extraHint?: string }> = {
  flow_zone: {
    hint: "When did it last happen? Where were you and what were you doing there.",
  },
  effortless_mastery: {
    hint: "When did someone last ask you that, and what were you doing? And if you have no tidy answer, that is exactly the sign.",
  },
  gratitude_mirror: {
    hint: "Not what your website says. One real thank you: who said it, what exactly was said, and what changed for them.",
    extraHint: "A real thank you counts from a friend, a colleague, or anyone you helped along the way.",
  },
  hard_period: {
    hint: "You can skip, or share only what feels okay. If you do, one moment from inside it: where you were, what happened.",
  },
  what_helped: {
    hint: "A tool, a habit, or a question that became a key. Not something you learned from a book, something you lived. In your own words, as if a friend asked you on the phone.",
  },
  message_to_past: {
    hint: "Not advice and not a step. The one thing you wish someone had shown you, the thing that would have saved you a year.",
  },
};

const QUESTIONS: Question[] = SIGNAL_QUESTIONS_EN_V2.map((q) => ({
  key:   q.key,
  label: q.label,
  ...QUESTION_HINTS[q.key],
}));

// Q5 conditional variant, shown when Q4 was skipped.
const Q5_CONDITIONAL_LABEL =
  "What tool, habit, or question did you build in yourself - the thing that holds you most today?";

// Q4 breath intro.
const Q4_BREATH_LINE =
  "Take a breath. This question touches a less comfortable place, and it is entirely your choice.";

// ── Probe copy (one probe max, primary Q6, fallback Q2, never Q4) ────────────

const PROBE_COPY: Record<"message_to_past" | "effortless_mastery", string> = {
  message_to_past:
    "That is true, but it could still belong to anyone: what is your sentence for one specific person, sitting right now exactly where you sat then?",
  effortless_mastery:
    "There is something there, worth one more moment: when did someone last actually stop, and what exactly did they see in that moment?",
};

// ── S7 dynamic callback (headline references the S3 blocker) ─────────────────

const S7_CALLBACK: Record<BlockerKey, string> = {
  message: "You said the message is what stops you right now.",
  content: "You said the content is what stops you right now.",
  price:   "You said the pricing is what stops you right now.",
  time:    "You said the time is what stops you right now.",
};

// ── Cookies / tracking helpers ───────────────────────────────────────────────

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "utm_adset", "utm_ad", "fbclid", "gclid",
] as const;

function readUtmCookies(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const val = getCookie(key);
    if (val) data[key === "fbclid" || key === "gclid" ? "click_id" : key] = val;
  }
  return data;
}

const GENERIC_ERROR =
  "Something went wrong on our side. Nothing you wrote was lost - try again in a moment.";

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  previewKey: string;
  isTest:     boolean;
}

interface Draft {
  screen?:     Screen;
  qIdx?:       number;
  stateKey?:   StateKey | null;
  blocker?:    BlockerKey | null;
  changeWish?: string;
  answers?:    Record<string, string>;
  q4Skipped?:  boolean;
  probeShown?: boolean;
  name?:       string;
  email?:      string;
  phone?:      string;
  occupation?: string;
  signal?:     SignalOutput | null;
  googlePending?: boolean;   // set right before the OAuth redirect; consumed on return
}

export function ReadingClient({ previewKey, isTest }: Props) {
  // Entry beacon — the funnel denominator (fires once per mount).
  const entryFired = useRef(false);
  useEffect(() => {
    if (entryFired.current) return;
    entryFired.current = true;
    track("s1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plant the tester cookie so the next visit works without ?key= (90 days).
  useEffect(() => {
    if (previewKey) {
      document.cookie = `kriah_preview=${encodeURIComponent(previewKey)}; path=/; max-age=${90 * 24 * 3600}; SameSite=Lax; Secure`;
    }
  }, [previewKey]);

  const [ready, setReady]   = useState(false);
  const [screen, setScreen] = useState<Screen>("s2");
  const [qIdx, setQIdx]     = useState(0);

  // Three choices
  const [stateKey, setStateKey]     = useState<StateKey | null>(null);
  const [blocker, setBlocker]       = useState<BlockerKey | null>(null);
  const [changeWish, setChangeWish] = useState("");

  // Six answers
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [q4Skipped, setQ4Skipped] = useState(false);

  // Probe (one max, never Q4)
  const [probeShown, setProbeShown]     = useState(false);
  const [probeTarget, setProbeTarget]   = useState<"message_to_past" | "effortless_mastery" | null>(null);
  const [probeEditing, setProbeEditing] = useState(false);

  // Lead fields
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [occupation, setOccupation] = useState("");
  const [consent, setConsent]       = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [gateErr, setGateErr]       = useState<string | null>(null);
  const [phoneErr, setPhoneErr]     = useState<string | null>(null);

  // Result
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [ending, setEnding] = useState<"concierge" | "hive" | "pre_revenue" | "crisis_soft">("hive");
  const [kaveretUrl, setKaveretUrl] = useState<string | null>(null);

  // The unified home: when the hive carries the result, the funnel does not
  // render its own reading — the loading bee stays up and the browser lands
  // straight on the lead's locked hive.
  const enterKaveret = (url: string) => {
    goTo("loading", "kaveret_enter");
    window.location.assign(url);
  };

  const [softCaptured, setSoftCaptured] = useState(false);   // email given at the S8 soft gate
  const [finalizing, setFinalizing]     = useState(false);
  const [signal, setSignal]             = useState<SignalOutput | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  const restoredRef     = useRef(false);
  const googleReturnRef = useRef(false);   // draft carried googlePending — OAuth round-trip

  // ── FUNNEL_STEP tracking ───────────────────────────────────────────────────
  const track = useCallback((step: string) => {
    try {
      const anonymousId = getCookie("anon_id");
      const body = JSON.stringify({
        type: "FUNNEL_STEP",
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        metadata: { step, instrument: INSTRUMENT, is_test: isTest },
      });
      const blob = new Blob([body], { type: "application/json" });
      if (!navigator.sendBeacon("/api/events", blob)) {
        void fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      /* tracking must never break the funnel */
    }
  }, [isTest]);

  const goTo = useCallback((next: Screen, stepId: string) => {
    setScreen(next);
    track(stepId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [track]);

  // ── Restore draft (sessionStorage) ─────────────────────────────────────────
  useEffect(() => {
    let initialStep = "s1_entry";
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        if (d.stateKey)   setStateKey(d.stateKey);
        if (d.blocker)    setBlocker(d.blocker);
        if (typeof d.occupation === "string") setOccupation(d.occupation);
        if (typeof d.changeWish === "string") setChangeWish(d.changeWish);
        if (d.answers && typeof d.answers === "object") setAnswers(d.answers);
        if (d.q4Skipped)  setQ4Skipped(true);
        if (d.probeShown) setProbeShown(true);
        if (typeof d.name === "string")  setName(d.name);
        if (typeof d.email === "string") setEmail(d.email);
        if (typeof d.phone === "string") setPhone(d.phone);
        if (d.signal)     setSignal(d.signal);
        if (typeof d.qIdx === "number" && d.qIdx >= 0 && d.qIdx < QUESTIONS.length) setQIdx(d.qIdx);
        if (d.googlePending) googleReturnRef.current = true;
        if (d.screen) {
          // Never restore into transient screens.
          let s: Screen = d.screen;
          if (s === "loading" || s === "error" || s === "probe") s = "s15";
          if (s === "s16" && !d.signal) s = "s15";
          setScreen(s);
          initialStep = `restore_${s}`;
        }
      }
    } catch {}
    restoredRef.current = true;
    setReady(true);
    track(initialStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist draft ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restoredRef.current) return;
    try {
      const draft: Draft = {
        screen, qIdx, stateKey, blocker, changeWish, answers, occupation,
        q4Skipped, probeShown, name, email, phone, signal,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [screen, qIdx, stateKey, blocker, changeWish, answers, occupation, q4Skipped, probeShown, name, email, phone, signal]);

  // ── S8 soft capture — one light email field, never blocking ────────────────
  const completeSoftCapture = useCallback((em: string, nm: string) => {
    setGateErr(null);
    const anonymousId = getCookie("anon_id");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (previewKey) headers["x-kriah-preview"] = previewKey;
    void fetch("/api/signup", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: nm || "",
        email: em,
        marketing_consent: true,
        is_test: isTest,
        instrument_version: INSTRUMENT, // phone-less + name-less lead allowed
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        ...readUtmCookies(),
      }),
    }).catch((err) => console.warn("[reading] soft capture failed", err));
    setSoftCaptured(true);
    setConsent(true);
    startQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey, isTest]);

  const submitSoftCapture = () => {
    const em = email.trim().toLowerCase();
    if (!em.includes("@") || !em.includes(".")) { setGateErr("That email address does not look valid"); return; }
    completeSoftCapture(em, name.trim());
  };

  // ── S8 · Google one-tap (verified email) ───────────────────────────────────
  // The draft lives in sessionStorage, which survives the same-tab OAuth
  // round-trip; googlePending marks the trip so the return leg knows to
  // auto-continue into the questions.
  const startGoogleCapture = () => {
    track("s8_google_click");
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      const d = raw ? (JSON.parse(raw) as Draft) : {};
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...d, googlePending: true, screen: "s8" }));
    } catch {}
    const supabase = createBrowserClient();
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent("/en/reading")}` },
    });
  };

  useEffect(() => {
    if (!googleReturnRef.current) return;
    googleReturnRef.current = false;
    // Clear the pending flag so a plain reload never re-triggers this leg.
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        delete d.googlePending;
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
      }
    } catch {}
    const supabase = createBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      const verifiedEmail = data.user?.email?.toLowerCase();
      if (!verifiedEmail) { track("s8_google_cancelled"); return; }  // cancelled at Google — stay on S8
      const meta = (data.user?.user_metadata ?? {}) as { full_name?: string; name?: string };
      const googleName = (meta.full_name || meta.name || "").trim();
      setEmail(verifiedEmail);
      setName((prev) => prev.trim() || googleName);
      track("s8_google_return");
      completeSoftCapture(verifiedEmail, googleName);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuestions = () => {
    track("q1_flow_zone_shown");
    setScreen("q");
    setQIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Partial-answer beacon: abandonment mid-questions still leaves the answers
  // recoverable next to the soft-captured contact.
  const beaconPartialAnswer = (key: string) => {
    try {
      const text = (answers[key] ?? "").trim().slice(0, 1500);
      if (!text) return;
      const anonymousId = getCookie("anon_id");
      navigator.sendBeacon?.("/api/events", new Blob([JSON.stringify({
        type: "KRIAH_PARTIAL_ANSWER",
        ...(anonymousId ? { anonymous_id: anonymousId } : {}),
        metadata: { key, text, instrument: INSTRUMENT, is_test: isTest },
      })], { type: "application/json" }));
    } catch { /* tracking only */ }
  };

  // ── After Q6: decide probe / continue ─────────────────────────────────────
  const afterQ6 = () => {
    const q6 = (answers["message_to_past"] ?? "").trim();
    const q2 = (answers["effortless_mastery"] ?? "").trim();
    if (!probeShown && q6.length < 120) {
      setProbeTarget("message_to_past");
      setProbeShown(true);
      setProbeEditing(false);
      goTo("probe", "probe_q6");
      return;
    }
    if (!probeShown && q2.length < 60) {
      setProbeTarget("effortless_mastery");
      setProbeShown(true);
      setProbeEditing(false);
      goTo("probe", "probe_q2");
      return;
    }
    goTo("s15", "s15_phone_gate");
  };

  const advanceQuestion = () => {
    const q = QUESTIONS[qIdx];
    track(`q${qIdx + 1}_${q.key}`);
    beaconPartialAnswer(q.key);
    if (qIdx === QUESTIONS.length - 1) { afterQ6(); return; }
    setQIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const skipQ4 = () => {
    setQ4Skipped(true);
    setAnswers((a) => ({ ...a, hard_period: "" }));
    track("q4_hard_period_skipped");
    setQIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Extraction ─────────────────────────────────────────────────────────────
  // Single path: the send gate always comes first, so the confirmed contact
  // fields ride inside this payload and no finalize patch is needed. The
  // English letter is delivered by the SIGNAL_EXTRACTED_EN email sequence
  // that the extract route enqueues.
  // Meta campaigns optimize on QuizComplete (same custom event as /kriah).
  const quizCompleteFired = useRef(false);
  const fireQuizComplete = (endingValue: string | undefined) => {
    if (quizCompleteFired.current || isTest) return;
    quizCompleteFired.current = true;
    if (typeof window !== "undefined") window.fbq?.("trackCustom", "QuizComplete", { funnel: "reading_en", ending: endingValue ?? "unknown" });
  };

  const runExtract = async () => {
    goTo("loading", "loading");
    setErrorMsg(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (previewKey) headers["x-kriah-preview"] = previewKey;
      const nm = name.trim();
      const payload: Record<string, unknown> = {
        answers,
        email: email.trim().toLowerCase(),
        name: nm,
        first_name: nm.split(" ")[0],
        marketing_consent: true,
        is_test: isTest,
        instrument_version: INSTRUMENT,
        key1: stateKey,
      };
      const occ = occupation.trim();
      if (occ) payload.occupation = occ;
      const ph = phone.trim();
      if (ph) payload.phone = ph;

      const res = await fetch("/api/signal/extract", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.signal) {
        // Backend error strings are Hebrew — always show the English generic.
        setErrorMsg(GENERIC_ERROR);
        goTo("error", "extract_error");
        return;
      }
      setSignal(data.signal as SignalOutput);
      const extId = typeof data.id === "string" ? data.id : null;
      if (extId) setExtractionId(extId);
      if (data.v2_ending === "concierge" || data.v2_ending === "hive" ||
          data.v2_ending === "pre_revenue" || data.v2_ending === "crisis_soft") {
        setEnding(data.v2_ending);
      }

      fireQuizComplete(typeof data.v2_ending === "string" ? data.v2_ending : undefined);

      if (typeof data.kaveret_url === "string") {
        setKaveretUrl(data.kaveret_url);
        enterKaveret(data.kaveret_url);
        return;
      }
      goTo("s16", "s16_full_reading");
    } catch {
      setErrorMsg(GENERIC_ERROR);
      goTo("error", "extract_error");
    }
  };

  const submitPhoneGate = () => {
    // Phone is mandatory — it is the intent filter, and it is how a human can
    // actually reach you if something in the signal is worth a conversation.
    const ph = phone.trim();
    if (!ph) {
      setPhoneErr("We need a phone number to send your signal");
      return;
    }
    if (!/^[0-9+\-\s()]{9,20}$/.test(ph)) {
      setPhoneErr("That phone number does not look valid");
      return;
    }
    setPhoneErr(null);
    goTo("sendgate", "sendgate");
  };

  // ── Send gate — always before extraction (see divergence note above) ───────
  const submitSendGate = async () => {
    const nm = name.trim();
    const em = email.trim().toLowerCase();
    if (nm.length < 2) { setGateErr("Your name needs at least 2 characters"); return; }
    if (!em.includes("@") || !em.includes(".")) { setGateErr("That email address does not look valid"); return; }
    if (!softCaptured && !consent) { setConsentErr(true); return; }
    setGateErr(null);
    setFinalizing(true);
    try {
      await runExtract();
    } finally {
      setFinalizing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!ready) {
    return <div style={{ minHeight: "100vh", background: C.bg }} />;
  }

  const cell =
    stateKey && blocker
      ? (MATRIX[`${stateKey}_${blocker}`] ?? FALLBACK_CELL)
      : FALLBACK_CELL;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.fg,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Minimal top bar — the /en chrome */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(13,12,10,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "0 20px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <Image
              src="/beegood_logo.png"
              alt="beegood"
              width={40}
              height={32}
              style={{ width: "auto", height: 32, display: "block" }}
            />
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: C.fg }}>
              beegood
            </span>
          </Link>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.goldDeep,
            }}
          >
            TrueSignal©
          </span>
        </div>
      </nav>

      <main
        style={{
          width: "100%",
          maxWidth: 640,
          margin: "0 auto",
          padding: "clamp(32px, 6vh, 64px) 20px 100px",
          flex: 1,
        }}
      >

        {/* ── S2 · business state ── */}
        {screen === "s2" && (
          <Card>
            {/* Landing framing — compact, above the first question. */}
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <h1
                style={{
                  fontSize: "clamp(26px, 5vw, 34px)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px",
                  lineHeight: 1.15,
                  color: C.fg,
                }}
              >
                Everyone makes content.<br />Why would they choose you?
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, margin: 0 }}>
                Most businesses cannot answer that, so they make more and more content. And it does not hold. In the next few minutes we get to the root: <b style={{ color: C.gold }}>the reason clients choose you specifically.</b> Three questions. Free.
              </p>
              <div style={{ borderTop: `1px solid ${C.line}`, margin: "26px auto 0", width: 56 }} />
            </div>
            <h2 style={{ fontSize: 21, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 20px", lineHeight: 1.3 }}>
              Where does the business stand today?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {STATE_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.key}
                  selected={stateKey === opt.key}
                  onClick={() => { setStateKey(opt.key); goTo("s3", "s3_blocker"); }}
                >
                  {opt.label}
                </ChoiceButton>
              ))}
            </div>
          </Card>
        )}

        {/* ── S3 · blocker ── */}
        {screen === "s3" && (
          <Card>
            <h2 style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 22px", lineHeight: 1.3 }}>
              What stops you most right now?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {BLOCKER_OPTIONS.map((opt) => (
                <ChoiceButton
                  key={opt.key}
                  selected={blocker === opt.key}
                  onClick={() => { setBlocker(opt.key); goTo("s4", "s4_change"); }}
                >
                  {opt.label}
                </ChoiceButton>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <QuietLink onClick={() => setScreen("s2")}>&larr; Back</QuietLink>
            </div>
          </Card>
        )}

        {/* ── S4 · short free text ── */}
        {screen === "s4" && (
          <Card>
            <h2 style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.3 }}>
              What matters most to change for you in the next two months?
            </h2>
            <p style={{ color: C.muted, fontSize: 14.5, margin: "0 0 18px" }}>
              One sentence is enough.
            </p>
            <textarea
              value={changeWish}
              onChange={(e) => setChangeWish(e.target.value)}
              rows={3}
              style={textareaStyle(90)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <QuietLink onClick={() => setScreen("s3")}>&larr; Back</QuietLink>
              <GoldButton
                disabled={changeWish.trim().length < 2}
                onClick={() => goTo("s6", "s6_reading")}
              >
                Continue
              </GoldButton>
            </div>
          </Card>
        )}

        {/* ── S6 · the initial reading (before any gate — deliberate inversion) ── */}
        {screen === "s6" && (
          <Card>
            <h2 style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 22px", lineHeight: 1.2, color: C.gold }}>
              Your picture
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.75, margin: "0 0 22px", color: C.fg }}>
              {cell}
            </p>
            <p style={{
              fontSize: 14.5, lineHeight: 1.7, color: C.muted, margin: "0 0 28px",
              paddingTop: 18, borderTop: `1px solid ${C.line}`,
            }}>
              {LIMITATION_LINE}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <QuietLink onClick={() => setScreen("s4")}>&larr; Back</QuietLink>
              <GoldButton onClick={() => goTo("s7", "s7_fork")}>Continue to the solution &rarr;</GoldButton>
            </div>
          </Card>
        )}

        {/* ── S7 · the fork ── */}
        {screen === "s7" && (
          <Card>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px", lineHeight: 1.3 }}>
              {blocker ? S7_CALLBACK[blocker] : S7_CALLBACK.message}
            </h2>
            <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 16px", color: C.fg, opacity: 0.92 }}>
              Three answers, and there is already a picture. But a picture of the problem is still not a solution. The solution starts with a question most business owners cannot answer in one sentence: <b>why would a client choose you specifically?</b>
            </p>
            <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 16px", color: C.fg, opacity: 0.92 }}>
              The answer exists. Your best clients feel it every time they meet you. It has simply never been put into words. <b style={{ color: C.gold }}>We call that answer your signal.</b>
            </p>
            <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 16px", color: C.fg, opacity: 0.92 }}>
              The whole market will try to solve this with more content, and content without differentiation sounds like everyone else. With the signal in hand: <b style={{ color: C.gold }}>you know what to say in every video, the message is one message everywhere, and inquiries come from people who already know why you.</b>
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.75, margin: "0 0 22px", color: C.fg }}>
              The next step: <b style={{ color: C.gold }}>the signal discovery reading.</b> Six open questions about you, because that is where the signal lives. <b>They ask for honesty, not time.</b>
            </p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
              <GoldButton onClick={() => goTo("s8", "s8_bridge")}>Begin the signal discovery &rarr;</GoldButton>
              <QuietLink onClick={() => goTo("exit", "exit")}>
                You can stop here
              </QuietLink>
              <QuietLink onClick={() => setScreen("s6")}>&larr; Back</QuietLink>
            </div>
          </Card>
        )}

        {/* ── S8 · bridge + soft capture ── */}
        {screen === "s8" && (
          <Card>
            <h2 style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px", lineHeight: 1.3, textAlign: "center" }}>
              So far we asked about the business. Now it turns to you.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: C.muted, margin: "0 0 28px", textAlign: "center" }}>
              Six questions. There are no right answers.
            </p>
            {!softCaptured && (
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="reading-soft-email" style={{ display: "block", fontSize: 14.5, color: C.fg, marginBottom: 12, textAlign: "center" }}>
                  Where should we save your progress?
                </label>
                {gateErr && (
                  <div role="alert" style={{ marginBottom: 10, color: C.error, fontSize: 13, textAlign: "center" }}>{gateErr}</div>
                )}
                <button
                  onClick={startGoogleCapture}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    width: "100%", background: "#fff", color: "#1f1f1f", border: "none",
                    borderRadius: 12, padding: "13px 20px", fontFamily: "inherit",
                    fontSize: 15.5, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <svg viewBox="0 0 48 48" style={{ width: 19, height: 19, flex: "none" }} aria-hidden>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>
                <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", textAlign: "center", opacity: 0.85 }}>
                  One tap, no password. So the signal reaches the right inbox.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: C.muted, fontSize: 13 }}>
                  <div style={{ flex: 1, height: 1, background: C.line }} />
                  or with email
                  <div style={{ flex: 1, height: 1, background: C.line }} />
                </div>
                <input
                  id="reading-soft-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle()}
                />
                <p style={{ fontSize: 11.5, color: C.muted, margin: "8px 0 0", textAlign: "center", opacity: 0.8 }}>
                  By entering your email or signing in you agree to receive updates. Unsubscribe anytime.
                </p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <GoldButton onClick={() => {
                if (softCaptured || !email.trim()) { startQuestions(); return; }
                submitSoftCapture();
              }}>
                Continue
              </GoldButton>
              {!softCaptured && email.trim().length === 0 && (
                <QuietLink onClick={startQuestions}>Continue without</QuietLink>
              )}
              <QuietLink onClick={() => setScreen("s7")}>&larr; Back</QuietLink>
            </div>
          </Card>
        )}

        {/* ── Q1-Q6 ── */}
        {screen === "q" && (() => {
          const q = QUESTIONS[qIdx];
          const isQ4 = q.key === "hard_period";
          const isQ5 = q.key === "what_helped";
          const label = isQ5 && q4Skipped ? Q5_CONDITIONAL_LABEL : q.label;
          const value = answers[q.key] ?? "";
          const len = value.trim().length;
          const canAdvance = isQ4 ? true : len >= MIN_CHARS;
          return (
            <Card>
              {/* Progress */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 24, overflow: "hidden" }}>
                <div style={{
                  width: `${((qIdx + 1) / QUESTIONS.length) * 100}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.goldDeep}, ${C.gold})`,
                  transition: "width 0.35s ease",
                }} />
              </div>
              <div style={{ color: C.faint, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                Question {qIdx + 1} of {QUESTIONS.length}
              </div>

              {isQ4 && (
                <p style={{ fontSize: 15, color: C.goldDeep, margin: "0 0 12px", lineHeight: 1.6 }}>
                  {Q4_BREATH_LINE}
                </p>
              )}

              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 8px", lineHeight: 1.35 }}>
                {label}
              </h2>
              <p style={{ color: C.muted, fontSize: 15, margin: q.extraHint ? "0 0 6px" : "0 0 20px", lineHeight: 1.6 }}>
                {q.hint}
              </p>
              {q.extraHint && (
                <p style={{ color: C.muted, fontSize: 13.5, margin: "0 0 20px", lineHeight: 1.6, opacity: 0.8 }}>
                  {q.extraHint}
                </p>
              )}

              <textarea
                value={value}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                rows={6}
                placeholder="You can just talk: tap the microphone on your keyboard"
                style={textareaStyle(150)}
              />

              {!isQ4 && len < MIN_CHARS && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.muted }}>
                  <span>{`At least ${MIN_CHARS - len} more characters`}</span>
                  <span>{len} / {MIN_CHARS}+</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, gap: 12 }}>
                <button
                  onClick={() => {
                    if (qIdx === 0) { setScreen("s8"); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
                    setQIdx((i) => i - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    background: "transparent",
                    color: C.muted,
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "12px 22px",
                    cursor: "pointer",
                    fontSize: 15,
                    fontFamily: "inherit",
                  }}
                >
                  Back
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {isQ4 && (
                    <QuietLink onClick={skipQ4}>Skip this one</QuietLink>
                  )}
                  <GoldButton disabled={!canAdvance} onClick={advanceQuestion} small>
                    Next
                  </GoldButton>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* ── Probe (once max; Q6 primary, Q2 fallback, never Q4) ── */}
        {screen === "probe" && probeTarget && (
          <Card>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: C.gold, fontWeight: 600, margin: "0 0 22px" }}>
              {PROBE_COPY[probeTarget]}
            </p>

            {probeEditing ? (
              <>
                <textarea
                  value={answers[probeTarget] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [probeTarget]: e.target.value }))}
                  rows={5}
                  style={textareaStyle(120)}
                />
                <div style={{ textAlign: "right", marginTop: 20 }}>
                  <GoldButton onClick={() => goTo("s15", "s15_phone_gate")}>Continue</GoldButton>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <GoldButton onClick={() => setProbeEditing(true)}>Sharpen my answer</GoldButton>
                <QuietLink onClick={() => goTo("s15", "s15_phone_gate")}>Keep it as it is</QuietLink>
              </div>
            )}
          </Card>
        )}

        {/* ── S15 · phone gate (mandatory) ── */}
        {screen === "s15" && (
          <Card>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 14px", lineHeight: 1.3 }}>
              That is it. The material is in, and your signal is being built from it right now.
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: C.fg, opacity: 0.9, margin: "0 0 18px" }}>
              Everything downstream comes from it: the message, the content directions, and the way the right clients find you.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: C.muted, margin: "0 0 24px" }}>
              This is where we send the signal. And if something rises from it that Hadar wants to expand on personally, in a conversation, we need a way for a human to actually reach you. Without a number that simply will not happen.
            </p>
            <label htmlFor="reading-phone" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
              Your phone number
            </label>
            <input
              id="reading-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={inputStyle()}
            />
            {phoneErr && (
              <p role="alert" style={{ marginTop: 8, color: C.error, fontSize: 13 }}>{phoneErr}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 28 }}>
              <GoldButton onClick={() => submitPhoneGate()}>Get my signal &rarr;</GoldButton>
              <QuietLink onClick={() => { setQIdx(QUESTIONS.length - 1); setScreen("q"); }}>&larr; Back to the questions</QuietLink>
            </div>
          </Card>
        )}

        {/* ── Send gate · before the letter ── */}
        {screen === "sendgate" && (
          <Card>
            <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 10px", lineHeight: 1.35 }}>
              Your personal signal is almost ready. Where should we send it?
            </h2>
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
              We will show it to you here, and also send it by email so it stays with you.
            </p>
            {gateErr && (
              <div role="alert" style={{ marginBottom: 16, color: C.error, fontSize: 14 }}>{gateErr}</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label htmlFor="reading-name" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
                  First name
                </label>
                <input
                  id="reading-name"
                  type="text"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label htmlFor="reading-email" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
                  Email
                </label>
                <input
                  id="reading-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle()}
                />
              </div>
              <div>
                <label htmlFor="reading-occupation" style={{ display: "block", fontSize: 14, color: C.muted, marginBottom: 6 }}>
                  What you do (optional)
                </label>
                <input
                  id="reading-occupation"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  style={inputStyle()}
                />
              </div>
              {!softCaptured && (
                <label
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                    fontSize: 13.5, lineHeight: 1.6,
                    color: consentErr ? C.error : C.muted,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => { setConsent(e.target.checked); if (e.target.checked) setConsentErr(false); }}
                    style={{ marginTop: 3, accentColor: C.gold, width: 16, height: 16, flex: "none" }}
                  />
                  <span>
                    I agree to receive my signal and occasional updates by email. Unsubscribe anytime.
                    {consentErr && <span style={{ display: "block", color: C.error }}>Please confirm to continue.</span>}
                  </span>
                </label>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <QuietLink onClick={() => setScreen("s15")}>&larr; Back</QuietLink>
                <GoldButton onClick={() => void submitSendGate()} disabled={finalizing}>
                  {finalizing ? "Sending..." : "Send me my signal →"}
                </GoldButton>
              </div>
            </div>
          </Card>
        )}

        {/* ── Loading ── */}
        {screen === "loading" && (
          <BeeWait title="Reading what you wrote" showFacts={false} dir="ltr" />
        )}

        {/* ── Error + retry ── */}
        {screen === "error" && (
          <Card center>
            <p style={{ fontSize: 16, color: C.error, margin: "0 0 22px", lineHeight: 1.6 }}>
              {errorMsg ?? GENERIC_ERROR}
            </p>
            <GoldButton onClick={() => void runExtract()}>Try again</GoldButton>
          </Card>
        )}

        {/* ── S16 · the full reading (fallback when no kaveret_url) ── */}
        {screen === "s16" && signal && (
          <FullReading
            signal={signal}
            answers={answers}
            track={track}
            ending={ending}
            kaveretUrl={kaveretUrl}
          />
        )}

        {/* ── Exit screen (quiet exit from S7) ── */}
        {screen === "exit" && (
          <Card center>
            <h2 style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 18px", lineHeight: 1.35 }}>
              {softCaptured ? "Your progress is saved" : "You can come back whenever you like"}
            </h2>
            <p style={{ fontSize: 17, color: C.gold, fontWeight: 600, margin: 0 }}>
              Be good.
            </p>
          </Card>
        )}
      </main>

      {/* Minimal footer — the /en chrome */}
      <footer style={{ borderTop: `1px solid ${C.line}` }}>
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "24px 20px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link href="/en" style={{ fontSize: 13.5, color: C.muted, textDecoration: "none" }}>
            &larr; beegood
          </Link>
          <span style={{ fontSize: 12.5, color: C.faint }}>
            We do not create content. We build your signal. TrueSignal©
          </span>
        </div>
      </footer>
    </div>
  );
}

// ── S16 — the full reading, paragraph fade-in ────────────────────────────────

function FullReading({
  signal,
  answers,
  track,
  ending,
  kaveretUrl,
}: {
  signal:     SignalOutput;
  answers:    Record<string, string>;
  track:      (step: string) => void;
  ending:     "concierge" | "hive" | "pre_revenue" | "crisis_soft";
  kaveretUrl: string | null;
}) {
  // P1 quote priority: Q6 (message_to_past), then Q3 (gratitude_mirror).
  const quoteSource =
    (answers["message_to_past"] ?? "").trim() ||
    (answers["gratitude_mirror"] ?? "").trim();

  // Staggered paragraph reveal (~700ms apart).
  const TOTAL_BEATS = 7;
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    if (visible >= TOTAL_BEATS) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 700);
    return () => clearTimeout(t);
  }, [visible]);

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const share = async () => {
    track("s16_share_clicked");
    const text = `"${signal.signal}"`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      throw new Error("no navigator.share");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareFeedback("Sentence copied");
        setTimeout(() => setShareFeedback(null), 2500);
      } catch {}
    }
  };

  const beat = (i: number): React.CSSProperties => ({
    opacity: visible > i ? 1 : 0,
    transition: "opacity 0.7s ease",
  });

  const FIELD_BLOCKS: { label: string; text: string }[] = [
    { label: "Your element",      text: signal.element },
    { label: "The tool you built", text: signal.central_tool },
    { label: "Your people",       text: signal.people },
  ];

  return (
    <div>
      {/* The reading frame */}
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.line}`,
          borderRadius: 20,
          padding: "36px 28px",
        }}
      >
        <h2 style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 26px", lineHeight: 1.2, color: C.gold }}>
          Your signal
        </h2>

        {/* P1 — opening with the verbatim quote */}
        <div style={beat(0)}>
          {quoteSource && (
            <blockquote
              style={{
                margin: "0 0 14px",
                padding: "14px 18px",
                borderLeft: `3px solid ${C.goldDeep}`,
                background: C.cardSoft,
                borderRadius: 10,
                fontSize: 17,
                lineHeight: 1.7,
                color: C.fg,
              }}
            >
              &quot;{quoteSource}&quot;
            </blockquote>
          )}
          <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 26px", color: C.fg }}>
            In exactly those words. We did not change a letter. Everything we have to say starts there.
          </p>
        </div>

        {/* P2 — the reflection (warm_note from the engine) */}
        <p style={{ ...beat(1), fontSize: 16.5, lineHeight: 1.75, margin: "0 0 26px", color: C.fg }}>
          {signal.warm_note}
        </p>

        {/* P3 — the sentence + defining "the signal" */}
        <div style={beat(2)}>
          <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
            Out of everything you wrote, one sentence rises:
          </p>
          <p style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.6, margin: "0 0 14px", color: C.gold }}>
            &quot;{signal.signal}&quot;
          </p>
          <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 26px", color: C.fg }}>
            We call a sentence like that the signal. It is the thing people already feel when they meet you, before you say a word about the business. It was not written just now. It was only said out loud for the first time. More than 3,500 businesses have been read this way, in the method Hadar built, and it always works in the same direction: the sentence does not come from outside. It waits inside.
          </p>
        </div>

        {/* P4 — what now */}
        <p style={{ ...beat(3), fontSize: 16.5, lineHeight: 1.75, margin: "0 0 30px", color: C.fg }}>
          Let it repeat. A sentence that repeats stops sounding like an idea, and starts sounding like you.
        </p>

        {/* Signature — the brand stamp */}
        <div style={beat(4)}>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: 0, color: C.fg }}>Be good.</p>
          <p style={{ fontSize: 16.5, lineHeight: 1.6, margin: "4px 0 0", fontWeight: 800, color: C.fg }}>
            the beegood team
          </p>
        </div>
      </div>

      {/* The signal fields — what we read, laid out plainly */}
      <div
        style={{
          ...beat(5),
          marginTop: 26,
          background: C.cardSoft,
          border: `1px solid ${C.line}`,
          borderRadius: 16,
          padding: "26px 24px",
        }}
      >
        {FIELD_BLOCKS.map((b) => (
          <div key={b.label} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.goldDeep, marginBottom: 8 }}>
              {b.label}
            </div>
            <p style={{ fontSize: 15.5, lineHeight: 1.7, margin: 0, color: C.fg, opacity: 0.92 }}>{b.text}</p>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.goldDeep, marginBottom: 8 }}>
            Three content directions
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {signal.content_directions.map((d) => (
              <li key={d} style={{ fontSize: 15.5, lineHeight: 1.7, color: C.fg, opacity: 0.92, marginBottom: 8 }}>{d}</li>
            ))}
          </ul>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
          <GoldButton small onClick={() => void share()}>Share the sentence</GoldButton>
          {shareFeedback && <span style={{ fontSize: 13, color: C.muted }}>{shareFeedback}</span>}
        </div>
      </div>

      {/* Seam line + ending (a gift, no price - the funnel sells nothing) */}
      <div style={beat(6)}>
        <p style={{
          textAlign: "center", fontSize: 17, fontWeight: 800, color: C.gold,
          margin: "34px 0 26px", letterSpacing: "-0.01em",
        }}>
          This is yours. No strings.
        </p>

        <div
          style={{
            background: C.card,
            border: `1px solid ${C.line}`,
            borderRadius: 20,
            padding: "30px 26px",
          }}
        >
          {ending === "concierge" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                Some signals do not fit a template. We read yours, and it is one of them.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                A signal like this Hadar reads herself. Not a system, not a team. Her.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                She will reach out to you personally within one business day.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 20px", color: C.fg }}>
                There is no button here and no form. Just leave it open.
              </p>
            </>
          )}
          {ending === "hive" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                You just received your signal. It is yours, nothing owed.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                The sentence is not going anywhere. What fades is its echo: a signal without repetition gets forgotten. Give it a week of repetition and watch what it does.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 20px", color: C.fg }}>
                The signal is already on its way to your inbox. In a day or two we will send the next step there too, for whoever wants to continue.
              </p>
            </>
          )}
          {ending === "pre_revenue" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                You are still at the beginning, and this is exactly the moment to read the signal, before it gets buried under more and more content.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                Take what you received, shape one sentence from it, and let it repeat. That alone will move you forward, without paying a thing.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 20px", color: C.fg }}>
                In a few months you can come back and read again. A business changes, and the signal sharpens with it.
              </p>
            </>
          )}
          {ending === "crisis_soft" && (
            <>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 14px", color: C.fg }}>
                Your signal is with you, and it is yours with no conditions attached.
              </p>
              <p style={{ fontSize: 16.5, lineHeight: 1.75, margin: "0 0 20px", color: C.fg }}>
                It looks like you are in a period that asks first of all for breath, not a plan. Take your time. If you want someone to talk to, Hadar is here, at your pace.
              </p>
            </>
          )}
          <p style={{ fontSize: 16.5, fontWeight: 700, margin: 0, color: C.gold }}>
            Be good.
          </p>
        </div>

        {/* Continuation — a way forward when the hive carries the result */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 30 }}>
          {ending === "hive" && kaveretUrl && (
            <>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: C.muted, margin: 0, textAlign: "center", maxWidth: 420 }}>
                A whole kit has already grown from your signal: the full reading, a card, a first script. All of it is saved in your hive.
              </p>
              <a
                href={kaveretUrl}
                style={{
                  display: "inline-block", color: "#0D0C0A", fontWeight: 700, fontSize: 15.5,
                  background: C.gold, borderRadius: 12, padding: "14px 34px", textDecoration: "none",
                }}
              >
                Enter your hive &rarr;
              </a>
            </>
          )}
          <a href="/en" style={{ color: C.muted, fontSize: 13.5, textDecoration: "underline", textUnderlineOffset: 4 }}>
            Back to the home page &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

// ── UI primitives — /en editorial style ──────────────────────────────────────

function Card({ children, center = false }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        padding: "clamp(28px, 5vw, 40px) clamp(22px, 4vw, 32px)",
        ...(center ? { textAlign: "center" as const } : {}),
      }}
    >
      {children}
    </div>
  );
}

function GoldButton({
  children,
  onClick,
  disabled = false,
  small = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "rgba(194,151,63,0.22)" : C.gold,
        color: disabled ? "rgba(242,237,228,0.4)" : "#0D0C0A",
        fontWeight: 700,
        fontSize: small ? 14.5 : 15.5,
        border: "none",
        borderRadius: 12,
        padding: small ? "12px 26px" : "15px 36px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </button>
  );
}

function QuietLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        color: C.muted,
        fontSize: 14,
        textDecoration: "underline",
        textUnderlineOffset: 4,
        cursor: "pointer",
        padding: 4,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function ChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      style={{
        width: "100%",
        textAlign: "left",
        background: selected ? "rgba(194,151,63,0.10)" : C.cardSoft,
        color: C.fg,
        border: selected ? `1px solid ${C.gold}` : `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "18px 18px",
        fontSize: 16,
        lineHeight: 1.5,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.15s ease, background 0.15s ease",
        minHeight: 58,
      }}
    >
      {children}
    </button>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: C.cardSoft,
    color: C.fg,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 16,
    outline: "none",
    fontFamily: "inherit",
  };
}

function textareaStyle(minHeight: number): React.CSSProperties {
  return {
    width: "100%",
    background: C.cardSoft,
    color: C.fg,
    border: `1px solid ${C.line}`,
    borderRadius: 12,
    padding: "14px 16px",
    fontSize: 16,
    lineHeight: 1.6,
    fontFamily: "inherit",
    resize: "vertical",
    minHeight,
    outline: "none",
  };
}
