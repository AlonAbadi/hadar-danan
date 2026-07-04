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

export interface CaptionsPayload {
  source: "whisper" | "script" | "none";
  words: CaptionWord[];
  lines: CaptionLine[];
  approved_at: string | null;
}

// Single-line phrases only — max ~19 chars (~3-4 Hebrew words) fits the
// Fontsize 92 reels-standard captions inside the 940px usable width.
const MAX_LINE_CHARS = 19;
const HARD_BREAK_GAP_MS = 500;
const SOFT_BREAK_GAP_MS = 280;
const MIN_LINE_MS = 600;
const LINGER_MS = 200;

// Words a Hebrew caption line should not end on (reads broken mid-thought).
const NO_TRAILING = new Set(["לא", "של", "עם", "כי", "אם", "על", "את", "גם", "רק", "אז"]);

const endsSentence = (w: string) => /[.?!,:]$/.test(w);

export function groupWordsIntoLines(words: CaptionWord[]): CaptionLine[] {
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
      const wouldOverflow = lineLen + word.w.length > MAX_LINE_CHARS;
      const hardBreak = gap >= HARD_BREAK_GAP_MS;
      const softBreak = (gap >= SOFT_BREAK_GAP_MS || endsSentence(prev.w)) && lineLen >= 8;
      if ((hardBreak || softBreak || wouldOverflow) && !NO_TRAILING.has(prev.w)) {
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
      last.text.length + line.text.length + 1 <= MAX_LINE_CHARS &&
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
export function scriptToLines(script: string): CaptionLine[] {
  const rough = script
    .split(/\n+|(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of rough) {
    if (sentence.length <= MAX_LINE_CHARS) {
      chunks.push(sentence);
      continue;
    }
    let buf = "";
    for (const word of sentence.split(/\s+/)) {
      if (buf && buf.length + word.length + 1 > MAX_LINE_CHARS) {
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

// Whisper prompt: the API keeps only the FINAL 224 tokens, so pass distinctive
// terms (Latin/loanwords Whisper actually misses) + the script head, capped.
export function buildWhisperPrompt(script: string): string {
  const distinctive = Array.from(
    new Set(script.match(/[A-Za-z][A-Za-z0-9'&-]*|"[^"]+"/g) ?? [])
  ).join(" ");
  const head = script.replace(/\s+/g, " ").trim();
  return `${distinctive} ${head}`.trim().slice(0, 350);
}
