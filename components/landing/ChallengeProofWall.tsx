"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

type Testimonial = {
  src: string;
  author: string;
  highlight: string;
  body: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    src: "/testimonials/challenge/ws-01.png",
    author: "משתתפת באתגר",
    highlight: "האתגר עשה סדר, מיקד לי את המסר",
    body: "ואני מרגישה שגיליתי עולם חדש בשיווק. גישה מדהימה ממש. אני ממשיכה ליישם מאז וגאה בעצמי על ההתמדה.",
  },
  {
    src: "/testimonials/challenge/ws-07.png",
    author: "משתתפת באתגר",
    highlight: "אתגר סופר משמעותי שהייתי בו בחיי",
    body: "ירדו לי כמה אסימונים בזכותו והצלחת להכניס בי ביטחון שעוד לא היה לי. אם זה ככה באתגר כזה קטן, איך מרגיש לעבור איתך תהליכים במוצרי פרמיום?! מטורף.",
  },
  {
    src: "/testimonials/challenge/ws-04.png",
    author: "מאמנת כוח",
    highlight: "נתן חתיכת בעיטה בתחת",
    body: "וגרם לי לעשות סרטונים שונים מאזור הנוחות שלי. תודה רבה רבה. אוהבת מלא, נתראה בשישי.",
  },
  {
    src: "/testimonials/challenge/ws-05.png",
    author: "שנהב בנימין, ירוחם",
    highlight: "כמה ידע וכוח נתת לי בסדנה",
    body: "האנרגיות שלך ממכרות. ה'אין אני' זה האתגר האמיתי. גם בסרטונים וגם בחיים.",
  },
  {
    src: "/testimonials/challenge/ws-08.png",
    author: "Uzan Farms",
    highlight: "הרבה מעבר לדעת לייצר עסקאות באמצעות סרטונים",
    body: "זה שינה לי דברים משמעותיים בגישה לתהליך המכירה והשירות. מומלץ ממש.",
  },
  {
    src: "/testimonials/challenge/ws-03.png",
    author: "משתתפת באתגר",
    highlight: "עזר לי לדייק הרבה יותר",
    body: "אני עוקבת אחרי הדר הרבה זמן והאתגר הזה לא רק שעזר לי, אלא גם גילה לי צד אחר בהדר. עשית בעצמך את מה שלימדת אותנו.",
  },
  {
    src: "/testimonials/challenge/ws-06.png",
    author: "משתתפת באתגר",
    highlight: "אהבתי את התפיסה של 'אין אני'",
    body: "זה בדיוק העולם החדש של השיווק.",
  },
  {
    src: "/testimonials/challenge/ws-09.png",
    author: "משתתפת באתגר",
    highlight: "שינוי הסרטונים הביא עלייה משמעותית בצפיות",
    body: "תודה. אנרגיות מעולות.",
  },
  {
    src: "/testimonials/challenge/ws-02.png",
    author: "משתתפת באתגר",
    highlight: "יציאה נעימה ובטוחה מאזור הנוחות",
    body: "מקווה שאצליח להמשיך בלי סרטונים שלך על הבוקר. תודה רבה.",
  },
];

const FEATURED_VIDEO_ID = "1198426241"; // יחיאל — מרץ 2026

export default function ChallengeProofWall() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Disable autoplay-loop on the featured Vimeo testimonial (project policy:
  // every Vimeo embed must explicitly disable looping in both URL and API)
  useEffect(() => {
    let attempts = 0;
    const trySetLoop = () => {
      type VimeoPlayer = { setLoop(v: boolean): Promise<void> };
      const w = window as Window & { Vimeo?: { Player: new (el: HTMLElement) => VimeoPlayer } };
      const iframe = document.getElementById("vimeo-testimonial-yechiel") as HTMLElement | null;
      if (w.Vimeo?.Player && iframe) {
        try { new w.Vimeo.Player(iframe).setLoop(false).catch(() => {}); } catch {}
        return;
      }
      if (attempts++ < 20) setTimeout(trySetLoop, 400);
    };
    trySetLoop();
  }, []);

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
    <div className="cpw">
      <Script src="https://player.vimeo.com/api/player.js" strategy="afterInteractive" />

      {/* Tier 0 — Featured video testimonial (Yechiel, March 2026) */}
      <div className="cpw-video-wrap">
        <div className="cpw-video-eyebrow">
          <span className="cpw-video-dot" />
          <span>עדות מהאתגר · מרץ 2026</span>
        </div>
        <h3 className="cpw-video-title">
          &ldquo;במילים של יחיאל&rdquo;
        </h3>
        <p className="cpw-video-sub">
          לקוח האתגר מספר מה השתנה אצלו בעסק אחרי 7 הימים.
        </p>

        <div className="cpw-video-frame">
          <iframe
            id="vimeo-testimonial-yechiel"
            src={`https://player.vimeo.com/video/${FEATURED_VIDEO_ID}?badge=0&autopause=0&loop=0&player_id=0&app_id=58479&cc=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="עדות יחיאל"
          />
        </div>
      </div>

      {/* Tier 1 — Wall of Faces */}
      <div className="cpw-wall">
        <img src="/testimonials/challenge/wall-of-150.jpg" alt="משתתפי האתגר" />
        <div className="cpw-wall-overlay">
          <div className="cpw-wall-stat">מאות</div>
          <div className="cpw-wall-label">בעלי עסקים עברו את האתגר</div>
          <div className="cpw-wall-sub">הנה חלק מהם</div>
        </div>
      </div>

      {/* Tier 2 — Quote cards */}
      <div className="cpw-grid">
        {TESTIMONIALS.map((t, i) => (
          <article key={i} className="cpw-card">
            <div className="cpw-stars">★★★★★</div>
            <blockquote className="cpw-quote">
              <span className="cpw-highlight">&ldquo;{t.highlight}&rdquo;</span>
              {t.body && <span className="cpw-body"> {t.body}</span>}
            </blockquote>
            <div className="cpw-foot">
              <div className="cpw-author">{t.author}</div>
              <button
                type="button"
                className="cpw-proof"
                onClick={() => setLightbox(t.src)}
                aria-label="הצג הודעה מקורית"
              >
                <img src={t.src} alt="" />
                <span>הודעה מקורית</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Tier 3 — Trust footer */}
      <p className="cpw-trust">
        כל ההודעות אמיתיות מקבוצת הוואטסאפ של האתגר. שמות הוסתרו לפרטיות המשתתפים.
      </p>

      {/* Lightbox */}
      {lightbox && (
        <div className="cpw-lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button
            type="button"
            className="cpw-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="סגור"
          >
            ✕
          </button>
          <img src={lightbox} alt="הודעה מקורית" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx>{`
        .cpw { display: flex; flex-direction: column; gap: 28px; }

        /* Featured video testimonial — Tier 0 */
        .cpw-video-wrap {
          background: linear-gradient(180deg, rgba(201,150,74,0.06), rgba(13,16,24,0));
          border: 1px solid rgba(201,150,74,0.28);
          border-radius: 20px;
          padding: 28px 22px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cpw-video-wrap::before {
          content: "";
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #E8B94A, transparent);
        }
        .cpw-video-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; font-weight: 700;
          color: #E8B94A; letter-spacing: 0.14em; text-transform: uppercase;
          margin-bottom: 12px;
        }
        .cpw-video-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #E8B94A;
          box-shadow: 0 0 12px rgba(232,185,74,0.7);
          animation: cpwPulse 2s ease-in-out infinite;
        }
        @keyframes cpwPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .cpw-video-title {
          margin: 0 0 8px;
          font-size: clamp(22px, 3.5vw, 28px);
          font-weight: 800;
          color: #EDE9E1;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .cpw-video-sub {
          margin: 0 auto 22px;
          max-width: 480px;
          font-size: 14px;
          color: #AAB0BD;
          line-height: 1.55;
        }
        .cpw-video-frame {
          position: relative;
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
          aspect-ratio: 9 / 16;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(201,150,74,0.35);
          box-shadow: 0 20px 60px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,185,74,0.05);
          background: #0d1018;
        }
        @media (max-width: 480px) {
          .cpw-video-frame { max-width: 300px; border-radius: 16px; }
        }
        .cpw-video-frame iframe {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          border: 0;
        }
        @media (max-width: 640px) {
          .cpw-video-wrap { padding: 22px 14px 18px; border-radius: 16px; }
        }


        /* Wall of faces */
        .cpw-wall {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(201, 150, 74, 0.25);
          box-shadow: 0 0 60px rgba(201, 150, 74, 0.08);
          aspect-ratio: 16 / 7;
          background: #0d1018;
        }
        .cpw-wall img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          filter: saturate(0.85) brightness(0.55);
        }
        .cpw-wall-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 16px;
          background: radial-gradient(ellipse at center, rgba(13,16,24,0.35) 0%, rgba(13,16,24,0.75) 70%);
        }
        .cpw-wall-stat {
          font-size: clamp(48px, 9vw, 96px);
          font-weight: 800;
          color: #E8B94A;
          line-height: 1;
          letter-spacing: -1px;
          text-shadow: 0 4px 30px rgba(201, 150, 74, 0.4);
        }
        .cpw-wall-label {
          margin-top: 10px;
          font-size: clamp(15px, 2.2vw, 22px);
          font-weight: 600;
          color: #EDE9E1;
        }
        .cpw-wall-sub {
          margin-top: 6px;
          font-size: clamp(12px, 1.6vw, 15px);
          color: rgba(232, 185, 74, 0.85);
          letter-spacing: 0.5px;
        }

        /* Cards grid */
        .cpw-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .cpw-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 960px) {
          .cpw-grid { grid-template-columns: 1fr 1fr 1fr; }
        }

        .cpw-card {
          background: linear-gradient(145deg, #1D2430, #111620);
          border: 1px solid rgba(201, 150, 74, 0.18);
          border-radius: 16px;
          padding: 22px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .cpw-card:hover {
          border-color: rgba(201, 150, 74, 0.45);
          transform: translateY(-2px);
        }

        .cpw-stars {
          color: #E8B94A;
          font-size: 14px;
          letter-spacing: 2px;
        }

        .cpw-quote {
          margin: 0;
          font-size: 15px;
          line-height: 1.65;
          color: #EDE9E1;
          flex: 1;
        }
        .cpw-highlight {
          font-size: 17px;
          font-weight: 700;
          color: #E8B94A;
          display: block;
          margin-bottom: 6px;
          line-height: 1.45;
        }
        .cpw-body {
          color: #B8B2A7;
        }

        .cpw-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(201, 150, 74, 0.12);
        }
        .cpw-author {
          font-size: 13px;
          color: #AAB0BD;
          font-weight: 600;
        }

        .cpw-proof {
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
          transition: background 0.2s, border-color 0.2s;
        }
        .cpw-proof:hover {
          background: rgba(201, 150, 74, 0.18);
          border-color: rgba(232, 185, 74, 0.6);
        }
        .cpw-proof img {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: cover;
          object-position: center;
          border: 1px solid rgba(201, 150, 74, 0.3);
        }

        /* Trust footer */
        .cpw-trust {
          text-align: center;
          font-size: 12px;
          color: #6F6A60;
          margin: 0;
          line-height: 1.6;
        }

        /* Lightbox */
        .cpw-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(8, 12, 20, 0.92);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .cpw-lightbox img {
          max-width: min(720px, 95vw);
          max-height: 90vh;
          border-radius: 14px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          cursor: default;
        }
        .cpw-close {
          position: absolute;
          top: 20px;
          left: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(201, 150, 74, 0.95);
          color: #0d1018;
          border: none;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }
      `}</style>
    </div>
  );
}
