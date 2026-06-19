/**
 * Horizontal-scrolling testimonial strip rendered immediately after the
 * /challenge hero in variant B of the challenge_proof_position A/B test.
 *
 * Purpose: bridge the social-proof gap between the hero (one quote +
 * stats strip) and the deep proof wall that sits ~7 mobile screens later.
 * The default order leaves most mobile visitors making a yes/no decision
 * before they ever see real screenshots from past participants.
 *
 * Picks 3 strong screenshots from the full ChallengeProofWall set so the
 * messaging stays consistent — same testimonials, just surfaced earlier.
 */
import Image from "next/image";

type StripItem = {
  src:       string;
  highlight: string;
  author:    string;
};

const STRIP_ITEMS: StripItem[] = [
  {
    src:       "/testimonials/challenge/ws-07.png",
    highlight: "אתגר סופר משמעותי שהייתי בו בחיי",
    author:    "משתתפת באתגר",
  },
  {
    src:       "/testimonials/challenge/ws-01.png",
    highlight: "האתגר עשה סדר, מיקד לי את המסר",
    author:    "משתתפת באתגר",
  },
  {
    src:       "/testimonials/challenge/ws-04.png",
    highlight: "נתן חתיכת בעיטה בתחת",
    author:    "מאמנת כוח",
  },
];

const GOLD     = "#C9964A";
const GOLD_L   = "#E8B94A";
const CARD     = "#141820";
const BORDER   = "#2C323E";
const FG       = "#EDE9E1";
const FG_MUTED = "#9E9990";
const BG       = "#080C14";

export function ChallengeTestimonialStrip() {
  return (
    <section
      aria-label="עדויות ממשתתפים"
      style={{
        background:  BG,
        padding:     "28px 0 8px",
        borderTop:   `1px solid ${BORDER}`,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px 18px" }}>
        <div
          style={{
            fontSize:      11,
            fontWeight:    800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         GOLD_L,
            marginBottom:  4,
            textAlign:     "center",
          }}
        >
          הוכחה מהשטח
        </div>
        <div
          style={{
            fontSize:      14,
            color:         FG_MUTED,
            textAlign:     "center",
          }}
        >
          מה משתתפים כתבו על האתגר
        </div>
      </div>

      <div className="ts-strip-scroller">
        {STRIP_ITEMS.map((item, i) => (
          <article
            key={i}
            className="ts-strip-card"
            style={{
              background:   CARD,
              border:       `1px solid ${BORDER}`,
              borderRadius: 14,
              padding:      "14px 14px 12px",
            }}
          >
            <div
              style={{
                fontSize:    14,
                fontWeight:  700,
                color:       FG,
                lineHeight:  1.4,
                marginBottom: 10,
              }}
            >
              <span style={{ color: GOLD_L }}>“</span>
              {item.highlight}
              <span style={{ color: GOLD_L }}>”</span>
            </div>
            <div
              style={{
                position:     "relative",
                aspectRatio:  "1 / 1",
                borderRadius: 10,
                overflow:     "hidden",
                background:   "#0B0F18",
                marginBottom: 10,
                border:       `1px solid ${BORDER}`,
              }}
            >
              <Image
                src={item.src}
                alt={item.highlight}
                fill
                sizes="(max-width: 600px) 70vw, 240px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                fontSize:   11,
                color:      FG_MUTED,
                textAlign:  "left",
              }}
            >
              — {item.author}
            </div>
          </article>
        ))}
      </div>

      <style>{`
        .ts-strip-scroller {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 0 20px 18px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .ts-strip-scroller::-webkit-scrollbar { display: none; }
        .ts-strip-card {
          flex: 0 0 70%;
          max-width: 280px;
          scroll-snap-align: center;
        }
        @media (min-width: 720px) {
          .ts-strip-scroller {
            justify-content: center;
            max-width: 1080px;
            margin: 0 auto;
            overflow-x: visible;
          }
          .ts-strip-card { flex: 0 1 240px; }
        }
      `}</style>
    </section>
  );
}
