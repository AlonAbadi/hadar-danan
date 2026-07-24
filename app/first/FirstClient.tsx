"use client";

/**
 * FirstClient — 3-state flow for the /first acquisition experience.
 *
 * State machine:
 *   landing   — the promise, one CTA to start
 *   interview — 3 questions, adaptive probe on Q1 if answer too thin
 *   generating— skeleton while the 4-stage pipeline runs
 *   result    — script, preserved phrases (the emotional trigger),
 *               move brief, product preview, purchase CTA
 *
 * The design prioritizes the moment of "these are my own words" — the
 * preserved-phrases strip is large, glowing, and the most visually
 * striking element on the result screen. That's the point of the whole
 * product.
 */

import { useState } from "react";
import {
  FIRST_QUESTIONS,
  FIRST_MIN_STORY_CHARS,
  type FirstQuestion,
} from "@/lib/first/config";
import type { FirstScript } from "@/lib/first/prompts";

type Phase = "landing" | "interview" | "generating" | "result" | "error";

// The client only ever sees the prospect-facing script + a bare flag for
// whether the critique pass revised the draft. Move name / rationale /
// critique score are proprietary IP and stay server-side.
type ResultPayload = { script: FirstScript; critique_happened: boolean };

export function FirstClient({ userName }: { userName: string | null }) {
  const [phase, setPhase] = useState<Phase>("landing");
  const [answers, setAnswers] = useState({ story: "", stance: "", payoff: "" });
  const [probeVisible, setProbeVisible] = useState(false);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submitAnswers() {
    if (answers.story.trim().length < FIRST_MIN_STORY_CHARS) {
      setProbeVisible(true);
      return;
    }
    if (answers.stance.trim().length < 5) {
      setErrorMsg("צריך גם עמדה קצרה, לא רק את הסיפור.");
      return;
    }
    setPhase("generating"); setErrorMsg(null);
    try {
      const r = await fetch("/api/first/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "unknown");
      setResult(j);
      setPhase("result");
    } catch (e) { setErrorMsg(String((e as Error).message ?? "error")); setPhase("error"); }
  }

  function resetToInterview() {
    setPhase("interview");
    setResult(null);
    setErrorMsg(null);
  }

  function startOver() {
    setPhase("landing");
    setAnswers({ story: "", stance: "", payoff: "" });
    setResult(null);
    setErrorMsg(null);
    setProbeVisible(false);
  }

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        {phase === "landing" ? <Landing userName={userName} onStart={() => setPhase("interview")} /> : null}
        {phase === "interview" ? (
          <Interview
            answers={answers}
            setAnswers={setAnswers}
            probeVisible={probeVisible}
            setProbeVisible={setProbeVisible}
            errorMsg={errorMsg}
            onSubmit={submitAnswers}
          />
        ) : null}
        {phase === "generating" ? <Generating /> : null}
        {phase === "result" && result ? (
          <Result
            result={result}
            onTryAgain={resetToInterview}
            onStartOver={startOver}
          />
        ) : null}
        {phase === "error" ? (
          <div style={styles.errorScreen}>
            <p>משהו נתקע: {errorMsg}</p>
            <button type="button" onClick={resetToInterview} style={styles.primaryBtn}>נסה שוב</button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

// ── Landing ─────────────────────────────────────────────────────────────

function Landing({ userName, onStart }: { userName: string | null; onStart: () => void }) {
  return (
    <div style={styles.landing}>
      <div style={styles.testBanner}>
        <strong>סביבת בדיקה</strong>
        <span> · אלון, אתה בודק את חוויית הסרטון־ראשון החינמי לפני שאנחנו פותחים לפרוספקטים.</span>
      </div>
      <div style={styles.eyebrow}>סרטון־ראשון · חינם</div>
      <h1 style={styles.h1}>
        הדר תראיין אותך את הדרך שהיא מראיינת לקוחות משלמים ביום צילום.
      </h1>
      <p style={styles.lede}>
        לא אתה יודע לכתוב סרטונים. אתה יודע את העסק שלך. אחרי שני משפטים ממך, תראה סרטון שהוא <em>אתה</em>. במילים שלך, במבנה שלה. אורך של 20 עד 30 שניות. משהו שאפשר לצלם עכשיו.
      </p>
      <button type="button" onClick={onStart} style={styles.primaryBtn}>
        {userName ? `${userName}, בוא נתחיל` : "בוא נתחיל"}
      </button>
      <div style={styles.landingFooter}>2 דקות. שלוש שאלות. סרטון אמיתי בסוף.</div>
    </div>
  );
}

// ── Interview ───────────────────────────────────────────────────────────

function Interview(props: {
  answers: { story: string; stance: string; payoff: string };
  setAnswers: (a: { story: string; stance: string; payoff: string }) => void;
  probeVisible: boolean;
  setProbeVisible: (v: boolean) => void;
  errorMsg: string | null;
  onSubmit: () => void;
}) {
  const { answers, setAnswers, probeVisible, setProbeVisible, errorMsg, onSubmit } = props;

  function set(id: FirstQuestion["id"], v: string) {
    setAnswers({ ...answers, [id]: v });
    if (id === "story" && v.trim().length >= FIRST_MIN_STORY_CHARS) setProbeVisible(false);
  }

  return (
    <div style={styles.interview}>
      <div style={styles.eyebrow}>הדר שואלת</div>
      <p style={styles.interviewIntro}>
        תכתוב איך שאתה מדבר. חצי־שבור בסדר. הדר תסדר את זה.
      </p>

      {FIRST_QUESTIONS.map((q, i) => {
        const isLast = i === FIRST_QUESTIONS.length - 1;
        return (
          <div key={q.id} style={styles.qBlock}>
            <div style={styles.qLabel}>שאלה {i + 1}{q.required ? "" : " · אופציונלית"}</div>
            <div style={styles.qText}>{q.q}</div>
            <div style={styles.qHint}>{q.hint}</div>
            <textarea
              value={answers[q.id]}
              onChange={(e) => set(q.id, e.target.value)}
              rows={q.id === "story" ? 5 : 3}
              placeholder="ענה כאן במילים שלך"
              style={styles.textarea}
            />
            {q.id === "story" && probeVisible && q.probe ? (
              <div style={styles.probe}>
                <span style={styles.probeMark}>הדר עצרה אותך</span>
                <span>{q.probe}</span>
              </div>
            ) : null}
            {isLast ? null : <div style={styles.divider} />}
          </div>
        );
      })}

      {errorMsg ? <div style={styles.inlineError}>{errorMsg}</div> : null}

      <button type="button" onClick={onSubmit} style={styles.primaryBtn}>
        בנה לי את הסרטון
      </button>
    </div>
  );
}

// ── Generating ──────────────────────────────────────────────────────────

function Generating() {
  return (
    <div style={styles.generating}>
      <style>{`@keyframes labSpin{to{transform:rotate(360deg)}}`}</style>
      <div style={styles.spinner} />
      <div style={styles.generatingText}>
        <div>הדר בוחרת את המהלך…</div>
        <div>מסדרת את המילים שלך במבנה…</div>
        <div>עוברת עורך אחרון…</div>
      </div>
    </div>
  );
}

// ── Result ──────────────────────────────────────────────────────────────

function Result(props: {
  result: ResultPayload;
  onTryAgain: () => void;
  onStartOver: () => void;
}) {
  const { script } = props.result;
  const words = (script.hook + " " + script.body).trim().split(/\s+/).length;

  return (
    <div style={styles.result}>
      <div style={styles.eyebrow}>הסרטון שלך</div>
      <h1 style={styles.resultTitle}>{script.title}</h1>
      <div style={styles.wordCount}>{words} מילים · כ־{Math.max(15, Math.round(words * 0.42))} שניות דיבור</div>

      {/* THE MOMENT — the emotional trigger, styled loud. */}
      {script.preserved_phrases?.length ? (
        <div style={styles.preservedHero}>
          <div style={styles.preservedHeroLabel}>אלה המילים שלך שנשמרו בסרטון</div>
          <div style={styles.preservedHeroList}>
            {script.preserved_phrases.map((p, i) => (
              <span key={i} style={styles.preservedHeroChip}>{p}</span>
            ))}
          </div>
          <div style={styles.preservedHeroNote}>שים לב איך זה לא AI שכותב עליך. זה אתה, מסודר.</div>
        </div>
      ) : null}

      <div style={styles.scriptBlock}>
        <div style={styles.scriptSection}>
          <div style={styles.scriptLabel}>פתיח</div>
          <div style={styles.scriptText}>{script.hook}</div>
        </div>
        <div style={styles.scriptSection}>
          <div style={styles.scriptLabel}>גוף</div>
          <div style={styles.scriptText}>{script.body}</div>
        </div>
      </div>

      {/* Product preview — "this was one, the paid product gives you 7."
          Method names / signature-move labels are proprietary IP and must
          NEVER be surfaced to prospects. Copy here describes what the
          prospect experiences, not the mechanism that produces it. */}
      <div style={styles.pitchBlock}>
        <div style={styles.pitchEyebrow}>זה פרק אחד</div>
        <h2 style={styles.pitchTitle}>ביום צילום מלא יש לך שבעה פרקים. כל אחד מאיר אותך מזווית אחרת.</h2>
        <div style={styles.moveGrid}>
          <PreviewCard title="הבעיה שאתה רואה"      tagline="מה אתה קולט בתחום שלך שכולם מפספסים." />
          <PreviewCard title="הסיפור האישי"          tagline="רגע אחד מהעבודה שלך שדרכו כל השאר מובן." />
          <PreviewCard title="ההזמנה"                tagline="למי בדיוק העסק שלך, ומתי הזמן להתחיל." />
        </div>
        <button type="button" onClick={() => window.location.href = "/challenge"} style={styles.ctaBtn}>
          קבל את יום הצילום המלא
        </button>
        <div style={styles.ctaSub}>שבעה פרקים · שש עונות · הכל בקול שלך</div>
      </div>

      <div style={styles.resultActions}>
        <button type="button" onClick={props.onTryAgain} style={styles.linkBtn}>לתקן תשובות</button>
        <button type="button" onClick={props.onStartOver} style={styles.linkBtn}>להתחיל מחדש</button>
      </div>
    </div>
  );
}

function PreviewCard({ title, tagline }: { title: string; tagline: string }) {
  return (
    <div style={styles.moveCard}>
      <div style={styles.moveCardName}>{title}</div>
      <div style={styles.moveCardTagline}>{tagline}</div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0D1018", color: "#EDE9E1", fontFamily: "Assistant, system-ui, sans-serif", padding: "40px 16px 120px" },
  container: { maxWidth: 720, margin: "0 auto" },

  testBanner: { background: "#1a1e14", border: "1px solid #3d4a2c", color: "#c4d09a", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 28 },

  eyebrow: { color: "#C9964A", fontSize: 13, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" as const },

  // Landing
  landing: { paddingTop: 20 },
  h1: { fontSize: 34, lineHeight: 1.2, margin: "0 0 20px", fontWeight: 700 },
  lede: { color: "#B5B0A6", fontSize: 18, lineHeight: 1.6, marginBottom: 32 },
  landingFooter: { color: "#9E9990", fontSize: 14, marginTop: 16 },

  // Interview
  interview: { paddingTop: 20 },
  interviewIntro: { color: "#B5B0A6", fontSize: 16, lineHeight: 1.55, marginBottom: 24 },
  qBlock: { marginBottom: 24 },
  qLabel: { color: "#C9964A", fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  qText: { fontSize: 20, lineHeight: 1.45, fontWeight: 600, marginBottom: 6 },
  qHint: { color: "#9E9990", fontSize: 14, marginBottom: 12 },
  textarea: { width: "100%", background: "#0D1018", border: "1px solid #2C323E", borderRadius: 8, padding: "14px 16px", color: "#EDE9E1", fontFamily: "inherit", fontSize: 16, lineHeight: 1.6, resize: "vertical", outline: "none", direction: "rtl", boxSizing: "border-box" },
  probe: { marginTop: 12, background: "#1F1A0F", border: "1px solid #6A5024", padding: 12, borderRadius: 8, fontSize: 15, color: "#E8B94A", display: "flex", gap: 10, alignItems: "flex-start" },
  probeMark: { color: "#C9964A", fontWeight: 700, whiteSpace: "nowrap" },
  divider: { height: 1, background: "#2C323E", marginTop: 24, opacity: 0.4 },
  inlineError: { color: "#E8B4B4", fontSize: 14, marginBottom: 12 },

  // Buttons
  primaryBtn: { background: "#C9964A", color: "#0D1018", border: "none", borderRadius: 8, padding: "14px 28px", fontFamily: "inherit", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  linkBtn: { background: "transparent", color: "#C9964A", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 18px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" },
  ctaBtn: { background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)", color: "#0D1018", border: "none", borderRadius: 10, padding: "16px 36px", fontFamily: "inherit", fontSize: 18, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(232, 185, 74, 0.25)" },

  // Generating
  generating: { paddingTop: 100, textAlign: "center", color: "#B5B0A6" },
  spinner: { width: 44, height: 44, border: "3px solid #2C323E", borderTopColor: "#C9964A", borderRadius: "50%", margin: "0 auto 24px", animation: "labSpin 1s linear infinite" },
  generatingText: { fontSize: 16, lineHeight: 2, color: "#9E9990" },

  // Result
  result: { paddingTop: 8 },
  resultTitle: { fontSize: 32, margin: "0 0 8px", lineHeight: 1.25, fontWeight: 700 },
  wordCount: { color: "#9E9990", fontSize: 14, marginBottom: 28 },

  preservedHero: { background: "linear-gradient(145deg, #132018, #0F1A13)", border: "2px solid #35533f", borderRadius: 14, padding: 24, marginBottom: 32, boxShadow: "0 8px 32px rgba(53, 83, 63, 0.15)" },
  preservedHeroLabel: { color: "#7FD49B", fontSize: 14, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" as const, textAlign: "center" },
  preservedHeroList: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginBottom: 18 },
  preservedHeroChip: { background: "#1a2a20", border: "1px solid #55835f", color: "#d4ecd9", padding: "8px 14px", borderRadius: 8, fontSize: 16, lineHeight: 1.45 },
  preservedHeroNote: { color: "#8bbf94", fontSize: 14, textAlign: "center", fontStyle: "italic" },

  scriptBlock: { background: "#141820", border: "1px solid #2C323E", borderRadius: 12, padding: 24, marginBottom: 24 },
  scriptSection: { marginBottom: 18 },
  scriptLabel: { color: "#C9964A", fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const },
  scriptText: { fontSize: 19, lineHeight: 1.65, color: "#EDE9E1" },

  brainDetails: { background: "#141820", border: "1px solid #2C323E", borderRadius: 10, padding: "12px 16px", marginBottom: 32, color: "#B5B0A6", fontSize: 14 },
  brainSummary: { color: "#C9964A", fontSize: 14, cursor: "pointer", padding: "4px 0" },
  brainContent: { display: "flex", flexDirection: "column", gap: 10, marginTop: 12, lineHeight: 1.55 },

  pitchBlock: { textAlign: "center", padding: "32px 0" },
  pitchEyebrow: { color: "#C9964A", fontSize: 13, letterSpacing: 1.5, marginBottom: 12, textTransform: "uppercase" as const },
  pitchTitle: { fontSize: 24, lineHeight: 1.35, margin: "0 0 24px", fontWeight: 700 },
  moveGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 },
  moveCard: { background: "#141820", border: "1px solid #2C323E", borderRadius: 10, padding: "16px 14px", textAlign: "right" as const },
  moveCardName: { color: "#E8B94A", fontSize: 13, fontWeight: 700, marginBottom: 6 },
  moveCardTagline: { color: "#B5B0A6", fontSize: 14, lineHeight: 1.5 },
  ctaSub: { color: "#9E9990", fontSize: 13, marginTop: 12 },

  resultActions: { display: "flex", gap: 10, justifyContent: "center", marginTop: 32 },
  errorScreen: { textAlign: "center", paddingTop: 100 },
};
