"use client";

import { useEffect, useState } from "react";

function SvgStars({ size = 14 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, lineHeight: 0 }} aria-label="5 כוכבים">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="#E8B94A" aria-hidden>
          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2l-6.1 3.4 1.4-6.8L2.2 9.1l6.9-.8L12 2z" />
        </svg>
      ))}
    </span>
  );
}

/**
 * Horizontal-scrolling testimonial strip rendered immediately after the
 * /challenge hero in variant B of the challenge_proof_position A/B test.
 *
 * Design rule (2026-06-19): use the EXACT same card structure as
 * ChallengeProofWall — five stars, highlight quote in gold, body in
 * muted, footer with author + "הודעה מקורית" thumbnail button that
 * opens a lightbox of the original WhatsApp screenshot. No invented
 * layout, no shrunk-and-cropped previews. Three of the same testimonials
 * appear here as a preview; the rest sit in the full wall further down.
 */

type Testimonial = {
  src:       string;
  author:    string;
  highlight: string;
  body:      string;
};

// Same testimonials as ChallengeProofWall — three strongest, used as a
// preview here and the full set still renders in the wall below.
const STRIP_ITEMS: Testimonial[] = [
  {
    src:       "/testimonials/challenge/ws-07.png",
    author:    "משתתפת באתגר",
    highlight: "אתגר סופר משמעותי שהייתי בו בחיי",
    body:      "ירדו לי כמה אסימונים בזכותו והצלחת להכניס בי ביטחון שעוד לא היה לי.",
  },
  {
    src:       "/testimonials/challenge/ws-01.png",
    author:    "משתתפת באתגר",
    highlight: "האתגר עשה סדר, מיקד לי את המסר",
    body:      "ואני מרגישה שגיליתי עולם חדש בשיווק. גישה מדהימה ממש. אני ממשיכה ליישם מאז וגאה בעצמי על ההתמדה.",
  },
  {
    src:       "/testimonials/challenge/ws-04.png",
    author:    "מאמנת כוח",
    highlight: "נתן חתיכת בעיטה בתחת",
    body:      "וגרם לי לעשות סרטונים שונים מאזור הנוחות שלי. תודה רבה רבה.",
  },
];

export function ChallengeTestimonialStrip() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);

  return (
    <section aria-label="עדויות ממשתתפים" className="cts">
      <div className="cts-head">
        <div className="cts-eyebrow">הוכחה מהשטח</div>
        <div className="cts-sub">מה משתתפים כתבו על האתגר</div>
      </div>

      <div className="cts-scroller">
        {STRIP_ITEMS.map((t, i) => (
          <article key={i} className="cts-card">
            <div className="cts-stars"><SvgStars /></div>
            <blockquote className="cts-quote">
              <span className="cts-highlight">&ldquo;{t.highlight}&rdquo;</span>
              {t.body && <span className="cts-body"> {t.body}</span>}
            </blockquote>
            <div className="cts-foot">
              <div className="cts-author">{t.author}</div>
              <button
                type="button"
                className="cts-proof"
                onClick={() => setLightbox(t.src)}
                aria-label="הצג הודעה מקורית"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.src} alt="" />
                <span>הודעה מקורית</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {lightbox && (
        <div
          className="cts-lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="cts-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="סגור"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="הודעה מקורית" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx>{`
        /* Section frame — sits between hero and definition block */
        .cts {
          background: #080C14;
          padding: 36px 0 28px;
          border-top: 1px solid #2C323E;
        }
        .cts-head {
          max-width: 1080px;
          margin: 0 auto 18px;
          padding: 0 20px;
          text-align: center;
        }
        .cts-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #E8B94A;
          margin-bottom: 4px;
        }
        .cts-sub {
          font-size: 14px;
          color: #9E9990;
        }

        /* Card row — mirrors cpw-card 1:1 */
        .cts-scroller {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 20px;
        }
        @media (min-width: 640px) {
          .cts-scroller { grid-template-columns: 1fr 1fr 1fr; }
        }

        .cts-card {
          background: linear-gradient(145deg, #1D2430, #111620);
          border: 1px solid rgba(201, 150, 74, 0.18);
          border-radius: 16px;
          padding: 22px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .cts-stars {
          color: #E8B94A;
          font-size: 14px;
          letter-spacing: 2px;
        }
        .cts-quote {
          margin: 0;
          font-size: 15px;
          line-height: 1.65;
          color: #EDE9E1;
          flex: 1;
        }
        .cts-highlight {
          font-size: 17px;
          font-weight: 700;
          color: #E8B94A;
          display: block;
          margin-bottom: 6px;
          line-height: 1.45;
        }
        .cts-body {
          color: #B8B2A7;
        }
        .cts-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(201, 150, 74, 0.12);
        }
        .cts-author {
          font-size: 13px;
          color: #AAB0BD;
          font-weight: 600;
        }
        .cts-proof {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(201, 150, 74, 0.08);
          border: 1px solid rgba(201, 150, 74, 0.25);
          border-radius: 10px;
          padding: 5px 9px 5px 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          color: #E8B94A;
          font-weight: 600;
        }
        .cts-proof img {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: cover;
          object-position: center;
          border: 1px solid rgba(201, 150, 74, 0.3);
        }

        /* Lightbox — mirrors cpw-lightbox */
        .cts-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          cursor: zoom-out;
        }
        .cts-lightbox img {
          max-width: 100%;
          max-height: 100%;
          border-radius: 12px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          cursor: default;
        }
        .cts-close {
          position: absolute;
          top: 18px;
          left: 18px;
          background: rgba(232, 185, 74, 0.15);
          border: 1px solid rgba(232, 185, 74, 0.45);
          color: #E8B94A;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}
