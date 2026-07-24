"use client";

/**
 * ShootDayLabClient — the lab UI.
 *
 * Flow per episode card:
 *   1. Idle              → "התחל ראיון" button
 *   2. Loading questions → skeleton
 *   3. Interviewing      → questions shown one at a time, answer inputs
 *   4. Answered          → "בנה תסריט" button
 *   5. Loading script    → skeleton
 *   6. Script ready      → hook + body + preserved-phrases strip + reset options
 *
 * The lab is deliberately calm and text-first. No confetti, no gold
 * gradients. It's a test environment for a concept, not a product page.
 */

import { useMemo, useState } from "react";
import type { LabEpisode } from "@/lib/lab/episodes";
import type { LabQuestion, LabScript } from "@/lib/lab/prompts";

export type LabEpisodeState = {
  episode:     LabEpisode;
  questions:   LabQuestion[] | null;
  answers:     string[] | null;
  script:      LabScript | null;
  questionsAt: string | null;
  scriptAt:    string | null;
};

export type LabInitialData = {
  extractionId:    string;
  userName:        string | null;
  signalStatement: string;
  signalPromise:   string;
  episodes:        LabEpisodeState[];
};

type Phase = "idle" | "loading_q" | "interview" | "loading_s" | "ready" | "error";

export function ShootDayLabClient({ initial }: { initial: LabInitialData }) {
  const [episodes, setEpisodes] = useState<LabEpisodeState[]>(initial.episodes);
  const [openNumber, setOpenNumber] = useState<number | null>(null);

  const s1 = useMemo(() => episodes.filter((e) => e.episode.season === 1), [episodes]);
  const s2 = useMemo(() => episodes.filter((e) => e.episode.season === 2), [episodes]);

  const doneCount   = episodes.filter((e) => e.script).length;
  const totalCount  = episodes.length;

  return (
    <main dir="rtl" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.testBanner}>
          <strong>סביבת בדיקה</strong>
          <span> · הלב הזה מבודד. התסריטים והתשובות כאן לא מחוברים לחדר השידור ולא נראים לאף אחד חוץ ממך.</span>
        </div>

        <header style={styles.header}>
          <div style={styles.eyebrow}>יום הצילום · טיוטה של הקונספט החדש</div>
          <h1 style={styles.h1}>הדר מראיינת. אתה עונה. הסרטון נכתב מהמילים שלך.</h1>
          <p style={styles.lede}>
            במקום שהמנוע ינחש איך אתה מדבר, הוא שואל אותך שאלות ראיון של הדר, לוקח את התשובות הגולמיות שלך,
            ומחלץ מתוכן תסריט. התסריט אמור להישמע כמוך, לא כמו הדר.
          </p>

          <div style={styles.signalCard}>
            <div style={styles.signalRow}><span style={styles.signalLabel}>האות שלך</span><span>{initial.signalStatement || "—"}</span></div>
            <div style={styles.signalRow}><span style={styles.signalLabel}>ההבטחה</span><span>{initial.signalPromise || "—"}</span></div>
            <div style={styles.signalRow}><span style={styles.signalLabel}>שם</span><span>{initial.userName ?? "—"}</span></div>
          </div>

          <div style={styles.progress}>{doneCount} מתוך {totalCount} פרקים מוכנים</div>
        </header>

        <SeasonShelf
          title="עונה ראשונה"
          subtitle="שבעה פרקים. הפרקטיקה, הסיפור והנגד לקטגוריה."
          episodes={s1}
          openNumber={openNumber}
          setOpenNumber={setOpenNumber}
          extractionId={initial.extractionId}
          onEpisodeUpdated={(n, patch) => setEpisodes((cur) => cur.map((e) => e.episode.number === n ? { ...e, ...patch } : e))}
        />

        <SeasonShelf
          title="עונה שנייה · אני בפעולה"
          subtitle="שישה פרקים. המשתמש נראה עובד — קבלה, פירוק, עצירה, תיקון, סגירה, חתימה."
          episodes={s2}
          openNumber={openNumber}
          setOpenNumber={setOpenNumber}
          extractionId={initial.extractionId}
          onEpisodeUpdated={(n, patch) => setEpisodes((cur) => cur.map((e) => e.episode.number === n ? { ...e, ...patch } : e))}
        />
      </div>
    </main>
  );
}

// ── Season shelf ────────────────────────────────────────────────────────

function SeasonShelf(props: {
  title: string;
  subtitle: string;
  episodes: LabEpisodeState[];
  openNumber: number | null;
  setOpenNumber: (n: number | null) => void;
  extractionId: string;
  onEpisodeUpdated: (n: number, patch: Partial<LabEpisodeState>) => void;
}) {
  const done = props.episodes.filter((e) => e.script).length;
  return (
    <section style={styles.shelf}>
      <div style={styles.shelfHead}>
        <h2 style={styles.shelfTitle}>{props.title}</h2>
        <p style={styles.shelfSubtitle}>{props.subtitle}</p>
        <div style={styles.shelfCount}>{done} / {props.episodes.length} מוכנים</div>
      </div>
      <div style={styles.shelfList}>
        {props.episodes.map((state) => (
          <EpisodeCard
            key={state.episode.number}
            state={state}
            open={props.openNumber === state.episode.number}
            onToggle={() => props.setOpenNumber(props.openNumber === state.episode.number ? null : state.episode.number)}
            extractionId={props.extractionId}
            onEpisodeUpdated={props.onEpisodeUpdated}
          />
        ))}
      </div>
    </section>
  );
}

// ── Episode card ────────────────────────────────────────────────────────

function EpisodeCard(props: {
  state: LabEpisodeState;
  open: boolean;
  onToggle: () => void;
  extractionId: string;
  onEpisodeUpdated: (n: number, patch: Partial<LabEpisodeState>) => void;
}) {
  const { state, open, onToggle, extractionId, onEpisodeUpdated } = props;
  const { episode, questions, answers, script } = state;

  const [phase, setPhase] = useState<Phase>(
    script ? "ready" : questions ? "interview" : "idle"
  );
  const [localAnswers, setLocalAnswers] = useState<string[]>(answers ?? []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startInterview(force = false) {
    setPhase("loading_q"); setErrorMsg(null);
    try {
      const r = await fetch("/api/lab/interview-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction_id: extractionId, video_number: episode.number, force }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error ?? "unknown");
      const qs: LabQuestion[] = j.questions;
      onEpisodeUpdated(episode.number, { questions: qs, answers: force ? null : (answers ?? null), script: force ? null : script });
      if (force) setLocalAnswers([]);
      setPhase("interview");
    } catch (e) { setErrorMsg(String((e as Error).message ?? "error")); setPhase("error"); }
  }

  async function saveAnswersAndBuild() {
    setPhase("loading_s"); setErrorMsg(null);
    try {
      const cleaned = localAnswers.map((a) => (a ?? "").trim());
      const nonEmpty = cleaned.filter((a) => a.length >= 5);
      if (nonEmpty.length === 0) throw new Error("צריך לענות לפחות על שאלה אחת");

      const r1 = await fetch("/api/lab/answers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction_id: extractionId, video_number: episode.number, answers: cleaned }),
      });
      if (!r1.ok) throw new Error("שמירת התשובות נכשלה");

      const r2 = await fetch("/api/lab/generate-script", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction_id: extractionId, video_number: episode.number }),
      });
      const j2 = await r2.json();
      if (!r2.ok) throw new Error(j2?.error ?? "generate_failed");
      onEpisodeUpdated(episode.number, { answers: cleaned, script: j2.script });
      setPhase("ready");
    } catch (e) { setErrorMsg(String((e as Error).message ?? "error")); setPhase("error"); }
  }

  const status = script ? "מוכן" : questions ? "בראיון" : "לא התחיל";
  const statusColor = script ? "#7FD49B" : questions ? "#C9964A" : "#9E9990";

  return (
    <div style={{ ...styles.card, ...(open ? styles.cardOpen : {}) }}>
      <button type="button" onClick={onToggle} style={styles.cardHead}>
        <span style={styles.epCode}>{episode.code}</span>
        <span style={styles.epTitle}>{episode.title}</span>
        <span style={{ ...styles.epStatus, color: statusColor }}>{status}</span>
        <span style={styles.epChevron}>{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div style={styles.cardBody}>
          <div style={styles.focus}>
            <strong>מה מנסים לחשוף בפרק הזה: </strong>{episode.focus}
          </div>

          {phase === "idle" ? (
            <button type="button" onClick={() => startInterview(false)} style={styles.primaryBtn}>
              התחל ראיון עם הדר
            </button>
          ) : null}

          {phase === "loading_q" ? (
            <div style={styles.loading}>הדר חושבת על השאלות…</div>
          ) : null}

          {phase === "interview" && questions ? (
            <InterviewForm
              questions={questions}
              localAnswers={localAnswers}
              setLocalAnswers={setLocalAnswers}
              onSubmit={saveAnswersAndBuild}
              onRegenerate={() => startInterview(true)}
            />
          ) : null}

          {phase === "loading_s" ? (
            <div style={styles.loading}>הדר בוחרת מתוך המילים שלך…</div>
          ) : null}

          {phase === "ready" && script ? (
            <ScriptView
              script={script}
              onReinterview={() => startInterview(true)}
              onRebuild={saveAnswersAndBuild}
            />
          ) : null}

          {phase === "error" ? (
            <div style={styles.error}>
              משהו נתקע: {errorMsg}
              <button type="button" onClick={() => setPhase(script ? "ready" : questions ? "interview" : "idle")} style={styles.linkBtn}>
                חזור
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ── Interview form ──────────────────────────────────────────────────────

function InterviewForm(props: {
  questions: LabQuestion[];
  localAnswers: string[];
  setLocalAnswers: (a: string[]) => void;
  onSubmit: () => void;
  onRegenerate: () => void;
}) {
  const { questions, localAnswers, setLocalAnswers } = props;

  function setAt(i: number, v: string) {
    const next = [...localAnswers];
    while (next.length < questions.length) next.push("");
    next[i] = v;
    setLocalAnswers(next);
  }

  return (
    <div style={styles.interview}>
      <div style={styles.interviewIntro}>
        הדר שואלת. כתוב איך שאתה מדבר, בלי לצחצח. משפטים חצי-שבורים זה בסדר. המנוע יסדר את זה אחרי.
      </div>
      {questions.map((q, i) => (
        <div key={i} style={styles.qBlock}>
          <div style={styles.qLabel}>שאלה {i + 1}</div>
          <div style={styles.qText}>{q.q}</div>
          {q.probe ? <div style={styles.qProbe}>אם קצר: {q.probe}</div> : null}
          <textarea
            value={localAnswers[i] ?? ""}
            onChange={(e) => setAt(i, e.target.value)}
            rows={4}
            placeholder="ענה כאן במילים שלך"
            style={styles.textarea}
          />
        </div>
      ))}
      <div style={styles.interviewActions}>
        <button type="button" onClick={props.onSubmit} style={styles.primaryBtn}>
          בנה תסריט מהתשובות שלי
        </button>
        <button type="button" onClick={props.onRegenerate} style={styles.linkBtn}>
          שאלות אחרות
        </button>
      </div>
    </div>
  );
}

// ── Script view ─────────────────────────────────────────────────────────

function ScriptView(props: {
  script: LabScript;
  onReinterview: () => void;
  onRebuild: () => void;
}) {
  const { script } = props;
  return (
    <div style={styles.scriptWrap}>
      <div style={styles.scriptTitle}>{script.title}</div>

      <div style={styles.scriptSection}>
        <div style={styles.scriptLabel}>פתיח</div>
        <div style={styles.scriptText}>{script.hook}</div>
      </div>

      <div style={styles.scriptSection}>
        <div style={styles.scriptLabel}>גוף</div>
        <div style={styles.scriptText}>{script.body}</div>
      </div>

      {script.cta ? (
        <div style={styles.scriptSection}>
          <div style={styles.scriptLabel}>סגירה</div>
          <div style={styles.scriptText}>{script.cta}</div>
        </div>
      ) : null}

      {script.preserved_phrases?.length ? (
        <div style={styles.preserved}>
          <div style={styles.preservedLabel}>המילים שלך שנשמרו בתסריט:</div>
          <div style={styles.preservedList}>
            {script.preserved_phrases.map((p, i) => (
              <span key={i} style={styles.preservedChip}>{p}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={styles.scriptActions}>
        <button type="button" onClick={props.onRebuild} style={styles.linkBtn}>בנה תסריט מחדש מאותן תשובות</button>
        <button type="button" onClick={props.onReinterview} style={styles.linkBtn}>ראיין אותי מחדש</button>
      </div>
    </div>
  );
}

// ── Styles (Santosha palette, calm/test-mode look) ──────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#0D1018", color: "#EDE9E1", fontFamily: "Assistant, system-ui, sans-serif", padding: "40px 16px 120px" },
  container: { maxWidth: 900, margin: "0 auto" },

  testBanner: { background: "#1a1e14", border: "1px solid #3d4a2c", color: "#c4d09a", padding: "12px 16px", borderRadius: 10, fontSize: 14, marginBottom: 28 },

  header: { marginBottom: 40 },
  eyebrow: { color: "#C9964A", fontSize: 14, letterSpacing: 1, marginBottom: 10 },
  h1: { fontSize: 32, lineHeight: 1.25, margin: "0 0 14px", fontWeight: 700 },
  lede: { color: "#B5B0A6", fontSize: 17, lineHeight: 1.55, maxWidth: 720, margin: "0 0 24px" },

  signalCard: { background: "#141820", border: "1px solid #2C323E", padding: 18, borderRadius: 12, marginBottom: 16 },
  signalRow: { display: "flex", gap: 16, padding: "6px 0", fontSize: 15, lineHeight: 1.5 },
  signalLabel: { color: "#9E9990", minWidth: 90 },

  progress: { color: "#9E9990", fontSize: 14 },

  shelf: { marginBottom: 40 },
  shelfHead: { marginBottom: 14 },
  shelfTitle: { fontSize: 22, margin: "0 0 4px", fontWeight: 700 },
  shelfSubtitle: { color: "#9E9990", fontSize: 15, margin: "0 0 6px" },
  shelfCount: { color: "#9E9990", fontSize: 13 },
  shelfList: { display: "flex", flexDirection: "column", gap: 10 },

  card: { background: "#141820", border: "1px solid #2C323E", borderRadius: 12, overflow: "hidden", transition: "border-color .15s" },
  cardOpen: { borderColor: "#C9964A" },
  cardHead: { display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "transparent", border: "none", color: "#EDE9E1", cursor: "pointer", width: "100%", textAlign: "right", fontFamily: "inherit", fontSize: 16 },
  epCode: { color: "#C9964A", fontVariantNumeric: "tabular-nums", fontSize: 14, minWidth: 44 },
  epTitle: { flex: 1, fontWeight: 600 },
  epStatus: { fontSize: 13 },
  epChevron: { color: "#9E9990", fontSize: 12 },

  cardBody: { padding: "6px 18px 22px", borderTop: "1px solid #2C323E" },
  focus: { background: "#1D2430", padding: "12px 14px", borderRadius: 8, marginTop: 14, marginBottom: 18, color: "#B5B0A6", fontSize: 14, lineHeight: 1.55 },

  primaryBtn: { background: "#C9964A", color: "#0D1018", border: "none", borderRadius: 8, padding: "12px 22px", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  linkBtn: { background: "transparent", color: "#C9964A", border: "1px solid #2C323E", borderRadius: 8, padding: "10px 18px", fontFamily: "inherit", fontSize: 14, cursor: "pointer" },

  loading: { color: "#9E9990", fontSize: 14, padding: "14px 0" },
  error: { color: "#E8B4B4", fontSize: 14, padding: "12px 14px", background: "#241618", border: "1px solid #4a2b2f", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" },

  interview: { display: "flex", flexDirection: "column", gap: 16 },
  interviewIntro: { color: "#B5B0A6", fontSize: 14, lineHeight: 1.55, marginBottom: 2 },
  qBlock: { padding: "16px 0", borderTop: "1px dashed #2C323E" },
  qLabel: { color: "#C9964A", fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  qText: { fontSize: 17, lineHeight: 1.55, fontWeight: 600, marginBottom: 4 },
  qProbe: { color: "#9E9990", fontSize: 13, marginBottom: 10 },
  textarea: { width: "100%", background: "#0D1018", border: "1px solid #2C323E", borderRadius: 8, padding: "12px 14px", color: "#EDE9E1", fontFamily: "inherit", fontSize: 15, lineHeight: 1.55, resize: "vertical", outline: "none", direction: "rtl" },
  interviewActions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 },

  scriptWrap: { display: "flex", flexDirection: "column", gap: 16 },
  scriptTitle: { fontSize: 20, fontWeight: 700, color: "#EDE9E1" },
  scriptSection: {},
  scriptLabel: { color: "#C9964A", fontSize: 12, letterSpacing: 1, marginBottom: 6 },
  scriptText: { fontSize: 17, lineHeight: 1.65, color: "#EDE9E1", whiteSpace: "pre-wrap" },
  preserved: { background: "#132018", border: "1px solid #2f4738", padding: 14, borderRadius: 10, marginTop: 8 },
  preservedLabel: { color: "#7FD49B", fontSize: 13, marginBottom: 10 },
  preservedList: { display: "flex", flexWrap: "wrap", gap: 8 },
  preservedChip: { background: "#1a2a20", border: "1px solid #35533f", color: "#c4dcc9", padding: "6px 10px", borderRadius: 6, fontSize: 14 },
  scriptActions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 },
};
