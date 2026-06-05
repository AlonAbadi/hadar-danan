import type { ChallengeHeroVariant } from "@/lib/ab";

// Variant B hero for the /challenge A/B test: replaces Hadar's VSL with a
// designed text block. Keeps roughly the same vertical footprint as the
// 9:16 video frame so the layout below is not displaced.
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
  const bullets  = content.bullets ?? [];
  const headline = content.headline ?? "";

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", width: "100%" }}>
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(232,185,74,0.06) 0%, rgba(20,24,32,0.95) 60%, #0d1018 100%)",
          border: "1px solid rgba(201,150,74,0.32)",
          borderRadius: 22,
          padding: "26px 26px 28px",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0 24px 60px -28px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,185,74,0.04) inset",
        }}
      >
        {/* Top gold accent line */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, #E8B94A, transparent)",
          }}
        />

        {/* Price pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 18,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <span style={{ fontSize: 18, color: "#E8B94A", fontWeight: 800, letterSpacing: 0.5 }}>
            ⚡ 7 ימים
          </span>
          <span style={{ color: "rgba(232,185,74,0.35)", fontSize: 18 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            <span style={{
              position: "relative",
              fontSize: 16, fontWeight: 600,
              color: "rgba(232,185,74,0.55)",
              direction: "ltr",
            }}>
              ₪{priceOriginal}
              <span aria-hidden style={{
                position: "absolute", left: -2, right: -2, top: "52%",
                height: 2, background: "#b91c1c", borderRadius: 2,
                transform: "rotate(-7deg)", opacity: 0.85,
              }} />
            </span>
            <span style={{
              fontSize: 28, fontWeight: 900, color: "#E8B94A",
              direction: "ltr", letterSpacing: -0.5,
            }}>
              ₪{priceNow}
            </span>
          </span>
        </div>

        {/* Savings strip */}
        {savings > 0 && (
          <div
            style={{
              textAlign: "center",
              fontSize: 11, fontWeight: 800, color: "#E8B94A",
              letterSpacing: 0.18, marginBottom: 22, opacity: 0.85,
              textTransform: "uppercase",
            }}
          >
            חוסכים ₪{savings} · מבצע מסתיים בקרוב
          </div>
        )}

        {/* Headline */}
        <h2
          style={{
            margin: "0 0 22px",
            fontSize: 22,
            fontWeight: 800,
            color: "#EDE9E1",
            lineHeight: 1.4,
            textAlign: "center",
            whiteSpace: "pre-line",
            letterSpacing: -0.2,
          }}
        >
          {headline}
        </h2>

        {/* Divider */}
        <div
          aria-hidden
          style={{
            width: 64,
            height: 1,
            background: "rgba(201,150,74,0.35)",
            margin: "0 auto 22px",
          }}
        />

        {/* Bullets */}
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, color: "#EDE9E1", lineHeight: 1.55 }}>
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 22, height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                  display: "grid", placeItems: "center",
                  color: "#1a1206", fontWeight: 900, fontSize: 13,
                  marginTop: 2,
                }}
              >
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* Quote */}
        {content.quoteText && (
          <>
            <div
              aria-hidden
              style={{
                width: 64,
                height: 1,
                background: "rgba(201,150,74,0.25)",
                margin: "26px auto 18px",
              }}
            />
            <blockquote
              style={{
                margin: 0,
                fontSize: 14,
                fontStyle: "italic",
                color: "rgba(237,233,225,0.88)",
                lineHeight: 1.65,
                textAlign: "center",
              }}
            >
              &ldquo;{content.quoteText}&rdquo;
            </blockquote>
            {content.quoteAuthor && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 8,
                  fontSize: 12,
                  color: "#9E9990",
                  letterSpacing: 0.15,
                }}
              >
                — {content.quoteAuthor}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
