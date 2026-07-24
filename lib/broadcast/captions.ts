// חדר השידור — caption data model + Whisper word grouping.
//
// The captions jsonb on broadcast_edits is the single source of truth for the
// approval screen and the burn. Human edits touch text/deleted only; times are
// machine-owned (spec: no timeline editing).

export interface CaptionWord {
  w: string;
  s: number; // start ms
  e: number; // end ms
}

export interface CaptionLine {
  id: string;
  text: string;
  start_ms: number;
  end_ms: number;
  deleted: boolean;
  edited: boolean;
}

// User-chosen framing for the burn (zoom/pan on the caption-approval screen).
// cx/cy are the visible-window CENTER normalized to the effective source
// dims (0..1); z is the zoom factor over the base 9:16 cover window.
export interface CaptionTransform {
  z: number; // 1..2.5
  cx: number;
  cy: number;
}

export interface CaptionsPayload {
  source: "whisper" | "script" | "none";
  words: CaptionWord[];
  lines: CaptionLine[];
  approved_at: string | null;
  transform?: CaptionTransform | null;
}

export type CaptionLanguage = "he" | "en";

// Single-line phrases only — max ~17 chars (~3 Hebrew words) fits the
// Fontsize 104 captions inside the 960px usable width. Latin glyphs run
// narrower, so English lines take more characters at the same point size.
const MAX_LINE_CHARS = 17;
const MAX_LINE_CHARS_EN = 28;
const HARD_BREAK_GAP_MS = 500;
const SOFT_BREAK_GAP_MS = 280;
const MIN_LINE_MS = 600;
const LINGER_MS = 200;

const maxLineChars = (lang: CaptionLanguage) => (lang === "en" ? MAX_LINE_CHARS_EN : MAX_LINE_CHARS);

// Words a Hebrew caption line should not end on (reads broken mid-thought).
const NO_TRAILING = new Set(["לא", "של", "עם", "כי", "אם", "על", "את", "גם", "רק", "אז"]);
// English equivalents — articles, prepositions, conjunctions, possessives.
const NO_TRAILING_EN = new Set([
  "a", "an", "the", "of", "to", "and", "or", "in", "on", "at", "for", "with", "your", "my",
]);

const endsSentence = (w: string) => /[.?!,:]$/.test(w);

/**
 * Substitute Whisper's transcribed text with the ORIGINAL script text,
 * keeping Whisper's timings.
 *
 * Alon 2026-07-24: captions on the free /kaveret/first-reel were showing
 * Whisper's spelling errors (בבנייה→בנייה, לגלות→לגלת, טכנית→טכניט) even
 * though the user was reading Hadar's polished script verbatim. Fix:
 * align script tokens 1-to-1 to whisper word timings so the captions
 * carry the SCRIPT text (no misspellings) with WHISPER timings
 * (accurate sync).
 *
 * Alignment strategy — deliberately conservative:
 *   - Tokenize the script; if it lands within tolerance of the whisper
 *     word count (max(3, 25% of script len)), do direct positional
 *     substitution.
 *   - If script has extra words (whisper missed them), extend the tail
 *     at ~250ms/word so the missing words still get displayed.
 *   - If word counts diverge past tolerance, the user probably
 *     improvised — return whisper as-is rather than force-align
 *     mismatched text onto their real timings.
 */
export function alignScriptToWhisperWords(
  scriptText: string,
  whisperWords: CaptionWord[],
): CaptionWord[] {
  if (!scriptText.trim() || whisperWords.length === 0) return whisperWords;

  const scriptTokens = scriptText
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (scriptTokens.length === 0) return whisperWords;

  const lenDiff = Math.abs(scriptTokens.length - whisperWords.length);
  const tolerance = Math.max(3, Math.round(scriptTokens.length * 0.25));
  if (lenDiff > tolerance) return whisperWords;

  const aligned: CaptionWord[] = [];
  const n = Math.min(scriptTokens.length, whisperWords.length);
  for (let i = 0; i < n; i++) {
    aligned.push({ w: scriptTokens[i], s: whisperWords[i].s, e: whisperWords[i].e });
  }

  // Script has more tokens than whisper heard → keep every intended word
  // by giving each missing tail-word its own slot (~250ms) after the
  // last real timing.
  if (scriptTokens.length > whisperWords.length) {
    const lastEnd = whisperWords[whisperWords.length - 1].e;
    const perWord = 250;
    for (let i = whisperWords.length; i < scriptTokens.length; i++) {
      const offset = i - whisperWords.length;
      aligned.push({
        w: scriptTokens[i],
        s: lastEnd + offset * perWord,
        e: lastEnd + (offset + 1) * perWord,
      });
    }
  }
  // Whisper heard more words than the script has (a stray 'אה' etc.) →
  // we drop the trailing extras. Captions stay clean; the audio is
  // unaffected.

  return aligned;
}

export function groupWordsIntoLines(words: CaptionWord[], lang: CaptionLanguage = "he"): CaptionLine[] {
  const maxChars = maxLineChars(lang);
  const noTrailing = lang === "en" ? NO_TRAILING_EN : NO_TRAILING;
  // English Whisper words arrive capitalized mid-sentence sometimes; Hebrew
  // has no case so the he path stays byte-identical.
  const trails = (w: string) => noTrailing.has(lang === "en" ? w.toLowerCase() : w);
  const lines: CaptionLine[] = [];
  let buf: CaptionWord[] = [];

  const flush = () => {
    if (!buf.length) return;
    lines.push({
      id: `l${lines.length + 1}`,
      text: buf.map((w) => w.w).join(" ").trim(),
      start_ms: buf[0].s,
      end_ms: buf[buf.length - 1].e,
      deleted: false,
      edited: false,
    });
    buf = [];
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prev = buf[buf.length - 1];
    if (prev) {
      const gap = word.s - prev.e;
      const lineLen = buf.reduce((n, w) => n + w.w.length + 1, 0);
      const wouldOverflow = lineLen + word.w.length > maxChars;
      const hardBreak = gap >= HARD_BREAK_GAP_MS;
      const softBreak = (gap >= SOFT_BREAK_GAP_MS || endsSentence(prev.w)) && lineLen >= 8;
      if ((hardBreak || softBreak || wouldOverflow) && !trails(prev.w)) {
        flush();
      } else if (wouldOverflow) {
        // Overflow but previous word must not trail: move it to the next line.
        const carried = buf.pop()!;
        flush();
        buf.push(carried);
      }
    }
    buf.push(word);
  }
  flush();

  // Post-pass: merge shrapnel lines into their neighbor, then linger each line
  // slightly so captions don't flicker off during natural micro-pauses.
  const merged: CaptionLine[] = [];
  for (const line of lines) {
    const last = merged[merged.length - 1];
    const tiny = line.end_ms - line.start_ms < MIN_LINE_MS || line.text.length <= 2;
    if (
      last &&
      tiny &&
      last.text.length + line.text.length + 1 <= maxChars &&
      line.start_ms - last.end_ms < HARD_BREAK_GAP_MS
    ) {
      last.text = `${last.text} ${line.text}`;
      last.end_ms = line.end_ms;
    } else {
      merged.push({ ...line });
    }
  }
  merged.forEach((line, i) => {
    line.id = `l${i + 1}`;
    const next = merged[i + 1];
    line.end_ms = next ? Math.min(next.start_ms, line.end_ms + LINGER_MS) : line.end_ms + LINGER_MS;
  });
  return merged;
}

// Fallback path: the original script as caption lines with no timings —
// the user syncs manually on the approval screen ("השורה הבאה").
export function scriptToLines(script: string, lang: CaptionLanguage = "he"): CaptionLine[] {
  const maxChars = maxLineChars(lang);
  const rough = script
    .split(/\n+|(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of rough) {
    if (sentence.length <= maxChars) {
      chunks.push(sentence);
      continue;
    }
    let buf = "";
    for (const word of sentence.split(/\s+/)) {
      if (buf && buf.length + word.length + 1 > maxChars) {
        chunks.push(buf);
        buf = word;
      } else {
        buf = buf ? `${buf} ${word}` : word;
      }
    }
    if (buf) chunks.push(buf);
  }
  return chunks.map((text, i) => ({
    id: `l${i + 1}`,
    text,
    start_ms: 0,
    end_ms: 0,
    deleted: false,
    edited: false,
  }));
}

// Whisper prompt: distinctive Latin/loanword terms ONLY. Passing the script
// text itself as the prompt turned out to poison decoding on Hebrew webcam
// audio — Whisper drifted into hallucinated English/garbage while the SAME
// audio transcribed near-perfectly with no prompt (verified 2026-07-12 on a
// real failed take). The prompt biases, it does not anchor.
//
// English: no prompt at all. An English script IS Latin text — sending it
// would be the exact poisoning already proven, and there are no distinctive
// foreign tokens for it to contribute.
export function buildWhisperPrompt(script: string, lang: CaptionLanguage = "he"): string {
  if (lang === "en") return "";
  return Array.from(
    new Set(script.match(/[A-Za-z][A-Za-z0-9'&-]*/g) ?? [])
  ).join(" ").slice(0, 200);
}

// Garbage-transcript detector. Whisper failures don't error — they return
// confidently wrong output. Three signals, any one condemns the transcript:
// stretched words (a caption line spanning many seconds of "speech"), long
// dead zones between consecutive words mid-take, or Latin-script bleed into a
// Hebrew-only recording. Condemned transcripts route to the existing fallback
// chooser (script-as-captions / no captions) instead of being burned.
//
// The latin_ratio signal is Hebrew-only: English speech is 100% Latin script,
// so it would condemn every healthy English transcript. stretched_line and
// word_gap apply to both languages.
export function transcriptLooksBroken(
  words: CaptionWord[],
  lines: CaptionLine[],
  lang: CaptionLanguage = "he"
): string | null {
  for (const line of lines) {
    if (!line.deleted && line.end_ms - line.start_ms > 8000) {
      return `stretched_line:${line.end_ms - line.start_ms}ms`;
    }
  }
  for (let i = 1; i < words.length; i++) {
    const gap = words[i].s - words[i - 1].e;
    if (gap > 8000) return `word_gap:${gap}ms`;
  }
  if (lang === "he") {
    const text = lines.filter((l) => !l.deleted).map((l) => l.text).join(" ");
    const latin = (text.match(/[A-Za-z]/g) ?? []).length;
    if (text.length > 20 && latin / text.length > 0.2) return `latin_ratio:${latin}/${text.length}`;
  }
  return null;
}
