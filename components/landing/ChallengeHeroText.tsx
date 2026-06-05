import type { ChallengeHeroVariant } from "@/lib/ab";

// Variant B hero — high-fidelity recreation of the offer-section handoff.
// Three stacked parts: trust strip (3 reassurance items), section heading
// is the page H1 above this slot, then the offer card itself with price,
// pitch, checklist, and a real participant quote from ChallengeProofWall.

// ── Design tokens (from handoff README) ─────────────────
const GOLD_1 = "#f6d98a";
const GOLD_2 = "#e8b942";
const GOLD_3 = "#cf9a24";
const GOLD_LINE = "rgba(232, 185, 66, 0.22)";
const TEXT = "rgba(255, 255, 255, 0.94)";
const MUTED = "rgba(255, 255, 255, 0.52)";
const INK = "#2a1d05";

// Numeral wrapper: forces digits + ₪ to read in correct order under RTL.
// Without unicode-bidi: isolate the shekel sign can flip to the wrong side.
function Numeral({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{ unicodeBidi: "isolate", ...style }}>{children}</span>
  );
}

// Render the pitch with "תוכנית פעולה יומית" emphasized in gold gradient.
function PitchText({ text }: { text: string }) {
  const emPhrase = "תוכנית פעולה יומית";
  const idx = text.indexOf(emPhrase);
  if (idx === -1) {
    return <span style={{ whiteSpace: "pre-line" }}>{text}</span>;
  }
  return (
    <span style={{ whiteSpace: "pre-line" }}>
      {text.slice(0, idx)}
      <span
        style={{
          background: `linear-gradient(180deg, ${GOLD_1}, ${GOLD_3})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {emPhrase}
      </span>
      {text.slice(idx + emPhrase.length)}
    </span>
  );
}

// ── Trust strip icons ────────────────────────────────────
function ClockIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={GOLD_1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={GOLD_1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M10 9l5 3-5 3V9z" fill={GOLD_1} stroke="none" />
    </svg>
  );
}
function BoltIcon({ size = 20, color = GOLD_1 }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeLinejoin="round">
      <path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Trust item ───────────────────────────────────────────
function TrustItem({
  icon, title, subtitle,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <div style={{
      flex: 1,
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", gap: 9, padding: "0 6px",
    }}>
      <span style={{
        width: 38, height: 38,
        display: "grid", placeItems: "center",
        borderRadius: 12,
        background: "radial-gradient(circle at 50% 30%, rgba(232,185,66,0.22), rgba(232,185,66,0.06))",
        border: "1px solid rgba(232,185,66,0.25)",
      }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: GOLD_1, lineHeight: 1.1 }}>{title}</span>
      <span style={{ fontSize: 12, fontWeight: 400, color: MUTED, lineHeight: 1.35, textWrap: "balance" }}>
        {subtitle}
      </span>
    </div>
  );
}

function VerticalDivider() {
  return (
    <div style={{
      width: 1, alignSelf: "stretch", margin: "8px 0",
      background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)",
    }} />
  );
}

// ── Main component ───────────────────────────────────────
export function ChallengeHeroText({
  content,
  priceNow,
  priceOriginal,
}: {
  content: ChallengeHeroVariant;
  priceNow: number;
  priceOriginal: number;
}) {
  const savings = priceOriginal - priceNow;
  const bullets = content.bullets ?? [];
  const pitchText = content.headline ?? "";

  return (
    <div dir="rtl" style={{
      maxWidth: 560,
      margin: "0 auto",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 34,
      direction: "rtl",
      textAlign: "right",
    }}>
      {/* ── Trust strip ─────────────────────────────── */}
      <section
        aria-label="התרשמות"
        style={{
          position: "relative",
          display: "flex",
          alignItems: "stretch",
          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: "22px 8px",
          boxShadow: "0 18px 40px -24px rgba(0,0,0,0.7)",
        }}
      >
        {/* Gold top-glow line */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: "22%", right: "22%", height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD_2}, transparent)`,
          opacity: 0.7,
        }} />

        <TrustItem icon={<ClockIcon />} title="הקצב שלך" subtitle="בלי דדליינים, אתה הקובע" />
        <VerticalDivider />
        <TrustItem icon={<PlayIcon />} title="שיעור פתיחה מוכן" subtitle="שיווק ב-2026, פתוח עכשיו" />
        <VerticalDivider />
        <TrustItem icon={<BoltIcon />} title="מתחילים מיד" subtitle="תוך שניות אחרי התשלום" />
      </section>

      {/* ── Offer card ──────────────────────────────── */}
      <section
        style={{
          position: "relative",
          borderRadius: 26,
          padding: "30px 26px 32px",
          background: "linear-gradient(180deg, #151b30 0%, #0e1322 100%)",
          border: `1px solid ${GOLD_LINE}`,
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 80px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
      >
        {/* Gold top halo */}
        <div aria-hidden style={{
          position: "absolute",
          top: "-40%", left: "50%",
          width: "120%", height: "80%",
          transform: "translateX(-50%)",
          background: "radial-gradient(60% 100% at 50% 0%, rgba(232,185,66,0.16), transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Price row */}
        <div style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{
              fontSize: 46, fontWeight: 900, lineHeight: 0.9,
              letterSpacing: "-1px",
              background: `linear-gradient(180deg, ${GOLD_1}, ${GOLD_3})`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}>
              <Numeral>{priceNow}</Numeral>
              <span style={{ fontSize: 30, marginInlineStart: 2 }}>₪</span>
            </span>
            <span style={{
              position: "relative",
              fontSize: 22, fontWeight: 600, color: MUTED,
            }}>
              <Numeral>{priceOriginal}</Numeral>₪
              <span aria-hidden style={{
                position: "absolute", left: -3, right: -3, top: "50%",
                height: 2, borderRadius: 2, background: GOLD_2,
                transform: "rotate(-8deg)", opacity: 0.85,
              }} />
            </span>
          </div>

          {/* "7 ימים" pill */}
          <span style={{
            flex: "0 0 auto",
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 13px",
            borderRadius: 999,
            background: "rgba(232,185,66,0.1)",
            border: "1px solid rgba(232,185,66,0.3)",
            color: GOLD_1,
            fontSize: 15, fontWeight: 800,
            whiteSpace: "nowrap",
          }}>
            <BoltIcon size={15} />
            7 ימים
          </span>
        </div>

        {/* Savings badge */}
        {savings > 0 && (
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "flex-start",
            gap: 8,
            fontSize: 13, fontWeight: 700, color: GOLD_1,
            marginBottom: 26,
          }}>
            <span style={{
              flex: "0 0 auto",
              width: 6, height: 6, borderRadius: "50%",
              background: GOLD_2,
              boxShadow: "0 0 0 4px rgba(232,185,66,0.16)",
            }} />
            <span style={{ whiteSpace: "nowrap" }}>
              חוסכים <Numeral>{savings}₪</Numeral> · המבצע מסתיים בקרוב
            </span>
          </div>
        )}

        {/* Pitch */}
        <p style={{
          fontSize: 23, fontWeight: 800, lineHeight: 1.4,
          letterSpacing: "-0.3px",
          color: TEXT,
          textAlign: "right",
          margin: 0,
        }}>
          <PitchText text={pitchText} />
        </p>

        {/* Divider */}
        <hr aria-hidden style={{
          height: 1, border: 0,
          background: `linear-gradient(90deg, transparent, ${GOLD_LINE}, transparent)`,
          margin: "26px 0",
        }} />

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 13, textAlign: "right" }}>
              <span style={{
                flex: "0 0 auto",
                width: 28, height: 28, marginTop: 1,
                borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: `linear-gradient(180deg, ${GOLD_1}, ${GOLD_3})`,
                boxShadow: "0 4px 10px -4px rgba(232,185,66,0.6)",
              }}>
                <CheckIcon />
              </span>
              <span style={{
                flex: 1,
                fontSize: 16.5, fontWeight: 500, lineHeight: 1.45,
                color: "rgba(255,255,255,0.86)",
              }}>
                <BulletWithBoldLead text={b} />
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <hr aria-hidden style={{
          height: 1, border: 0,
          background: `linear-gradient(90deg, transparent, ${GOLD_LINE}, transparent)`,
          margin: "26px 0",
        }} />

        {/* Quote */}
        {content.quoteText && (
          <blockquote style={{ position: "relative", paddingTop: 6, margin: 0, textAlign: "right" }}>
            <span aria-hidden style={{
              fontSize: 46, fontWeight: 900, lineHeight: 0.5,
              color: GOLD_2, opacity: 0.5,
              display: "block", marginBottom: 6,
              fontFamily: "Georgia, serif",
            }}>“</span>
            <p style={{
              fontSize: 16.5, fontWeight: 400, fontStyle: "italic",
              lineHeight: 1.6, color: "rgba(255,255,255,0.8)",
              margin: 0,
              textAlign: "right",
            }}>
              {content.quoteText}
            </p>
            {content.quoteAuthor && (
              <cite style={{
                display: "block",
                marginTop: 14,
                fontStyle: "normal",
                fontSize: 14, fontWeight: 600,
                color: GOLD_1,
                textAlign: "right",
              }}>
                — {content.quoteAuthor}
              </cite>
            )}
          </blockquote>
        )}
      </section>
    </div>
  );
}

// Bold the first phrase of each bullet up to the em-dash / hyphen,
// matching the handoff's <b>lead</b>{rest} pattern.
function BulletWithBoldLead({ text }: { text: string }) {
  // Split on " — " (em dash) or " - " (hyphen) — bold the first chunk
  const sep = text.includes(" — ") ? " — " : text.includes(" - ") ? " - " : null;
  if (!sep) {
    // Fall back: bold up to first " על " (common pattern in our bullets)
    const onIdx = text.indexOf(" על ");
    if (onIdx > 0) {
      return (
        <>
          <b style={{ fontWeight: 800, color: TEXT }}>{text.slice(0, onIdx)}</b>
          {text.slice(onIdx)}
        </>
      );
    }
    return <>{text}</>;
  }
  const [lead, ...rest] = text.split(sep);
  return (
    <>
      <b style={{ fontWeight: 800, color: TEXT }}>{lead}</b>
      {sep}{rest.join(sep)}
    </>
  );
}
