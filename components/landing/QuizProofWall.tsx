"use client";

import { useState, useEffect } from "react";

type TestimonialBase = {
  highlight: string;
  body: string;
  author: string;
};

type ImageTestimonial = TestimonialBase & {
  type: "whatsapp";
  src: string; // PNG path
};

type VideoTestimonial = TestimonialBase & {
  type: "video";
  vimeoId: string; // Vimeo numeric ID
  thumb?: string; // optional thumbnail
};

type GoogleTestimonial = TestimonialBase & {
  type: "google";
  date: string;
  initial: string;
};

type Testimonial = ImageTestimonial | VideoTestimonial | GoogleTestimonial;

// All workshop video testimonials open the same FEATURED compilation video,
// which contains the actual workshop testimonials transcribed.
const WORKSHOP_VIDEO_ID = "1188793450";

const TESTIMONIALS: Testimonial[] = [
  // ── Strategy / clarity ────────────────────────────────────────────
  {
    type: "video",
    vimeoId: WORKSHOP_VIDEO_ID,
    highlight: "קיבלתי את הבהירות שרציתי",
    body: "האסטרטגיה, איך להגיש את השיווק שלי, איך לדבר עם הקהל שלי. יצאתי עם כלים פרקטיים — מה השיטה שלי, איך להעביר את המסרים.",
    author: "מתוך הסדנה",
  },
  {
    type: "video",
    vimeoId: WORKSHOP_VIDEO_ID,
    highlight: "הייתי בארבע סדנאות שלא הצליחו לפצח אותי",
    body: "והיא הצליחה לזהות. זה היה מאוד מאוד מדויק — זה מתחבר לי, זה פתח לי משהו חדש.",
    author: "מתוך הסדנה",
  },
  // ── Business results (Google) ───────────────────────────────────────
  {
    type: "google",
    highlight: "הבנה רצינית ומעמיקה על איך לשווק נכון עסק",
    body: "שירות מעולה. הבנה רצינית ומעמיקה על איך לשווק נכון עסק ואיזה סרטונים טובים לו. מומלץ בחום.",
    author: "נטע מרום",
    date: "לפני שנה",
    initial: "נ",
  },
  {
    type: "google",
    highlight: "תוכן מדויק שהביא לי הרבה פניות",
    body: "אחרי אכזבות מחברות אחרות, סוף סוף מצאתי צוות שמבין ומדייק. הם לקחו את העסק שלי כמה צעדים קדימה.",
    author: "Gal Masas",
    date: "לפני שנה",
    initial: "G",
  },
  // ── Mindset shift (WhatsApp) ────────────────────────────────────────
  {
    type: "whatsapp",
    src: "/testimonials/challenge/ws-08.png",
    highlight: "הרבה מעבר לדעת לייצר עסקאות באמצעות סרטונים",
    body: "זה שינה לי דברים משמעותיים בגישה לתהליך המכירה והשירות. מומלץ ממש.",
    author: "Uzan Farms",
  },
  {
    type: "whatsapp",
    src: "/testimonials/challenge/ws-07.png",
    highlight: "ירדו לי כמה אסימונים והכניסה בי ביטחון שעוד לא היה לי",
    body: "אם זה ככה בתהליך קצר — איך מרגיש לעבור איתך תהליכים גדולים? מטורף!",
    author: "משתתפת",
  },
  // ── Deep methodology (Video) ────────────────────────────────────────
  {
    type: "video",
    vimeoId: WORKSHOP_VIDEO_ID,
    highlight: "אם הדר לא הייתה קיימת היה צריך לברוא מישהי כמוה",
    body: "מה שהיא עושה — פיה קטנה עם עוצמות ענקיות. היא פשוט עושה מיינדסט חדש לביזנס.",
    author: "מתוך הסדנה",
  },
  // ── Authentic marketing (Video) ─────────────────────────────────────
  {
    type: "video",
    vimeoId: WORKSHOP_VIDEO_ID,
    highlight: "ההבנה של איך לשווק ועדיין להיות אני",
    body: "שיווק זה עניין של אנושיות. זה לא טכניקה מורכבת — זה להקשיב ולהיות מהלב.",
    author: "מתוך הסדנה",
  },
  // ── Refinement (Video) ──────────────────────────────────────────────
  {
    type: "video",
    vimeoId: WORKSHOP_VIDEO_ID,
    highlight: "אני יוצאת עם היכולת באמת לדייק את עצמי",
    body: "החידודים שהיא נתנה לי, איך להסתכל על עצמי מכל מיני זוויות ולדייק את הקהל שלי. מי אני ומה אני רוצה להביא.",
    author: "מתוך הסדנה",
  },
  // ── Strategy + marketing wrap (Google) ──────────────────────────────
  {
    type: "google",
    highlight: "אסטרטגיה טובה ועדכנית, מעטפת שיווקית מדהימה",
    body: "זה מה שכל בעל עסק צריך בשיווק שלו! עם המון ערך. ממליצה בחום על השירות.",
    author: "ענת חנקין",
    date: "לפני שנה",
    initial: "ע",
  },
  // ── Pain-to-strength (Google) ───────────────────────────────────────
  {
    type: "google",
    highlight: "הצליחו להפוך את הנקודה הכי קשה לי לנקודת חוזקה",
    body: "מרוצה במקסימום. אפילו נהנה מזה עכשיו. אין עליהם תודה ענקית.",
    author: "רועי מנדלמן",
    date: "לפני 8 חודשים",
    initial: "ר",
  },
  // ── Smart investment (Google) ───────────────────────────────────────
  {
    type: "google",
    highlight: "הדבר הכי נכון וחכם שעשיתי עבור עצמי ועבור העסק",
    body: "פשוט אין מילים. חוויה מעצימה. צוות חכם ברמות שחשב על כל דבר. ממליצה מאוד.",
    author: "סהר עבד",
    date: "לפני 6 חודשים",
    initial: "ס",
  },
];

type LightboxState =
  | { type: "image"; src: string }
  | { type: "video"; vimeoId: string }
  | { type: "google"; testimonial: GoogleTestimonial }
  | null;

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.91 9.91 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.5 0-2.97-.4-4.26-1.16l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.7 8.23 8.23s-3.7 8.24-8.24 8.24z" />
    </svg>
  );
}

export default function QuizProofWall() {
  const [lightbox, setLightbox] = useState<LightboxState>(null);

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
    <div className="qpw">
      {/* Tier 1 — Wall of Faces */}
      <div className="qpw-wall">
        <img src="/testimonials/challenge/wall-of-150.jpg" alt="לקוחות הדר דנן" />
        <div className="qpw-wall-overlay">
          <div className="qpw-wall-stat">3,500+</div>
          <div className="qpw-wall-label">בעלי עסקים בנו איתי שיווק שעובד</div>
          <div className="qpw-wall-sub">הנה חלק מהסיפורים שלהם</div>
        </div>
      </div>

      {/* Tier 2 — Quote cards (3 types) */}
      <div className="qpw-grid">
        {TESTIMONIALS.map((t, i) => (
          <article key={i} className="qpw-card">
            <div className="qpw-stars">★★★★★</div>
            <blockquote className="qpw-quote">
              <span className="qpw-highlight">&ldquo;{t.highlight}&rdquo;</span>
              {t.body && <span className="qpw-body"> {t.body}</span>}
            </blockquote>
            <div className="qpw-foot">
              <div className="qpw-author">
                {t.type === "google" && <GoogleG />}
                <span>{t.author}</span>
              </div>

              {t.type === "whatsapp" && (
                <button
                  type="button"
                  className="qpw-cta qpw-cta-wa"
                  onClick={() => setLightbox({ type: "image", src: t.src })}
                  aria-label="הצג הודעה מקורית"
                >
                  <WhatsAppIcon />
                  <span>הודעה מקורית</span>
                </button>
              )}

              {t.type === "video" && (
                <button
                  type="button"
                  className="qpw-cta qpw-cta-video"
                  onClick={() => setLightbox({ type: "video", vimeoId: t.vimeoId })}
                  aria-label="צפה בעדות"
                >
                  <PlayIcon />
                  <span>צפה בעדות</span>
                </button>
              )}

              {t.type === "google" && (
                <button
                  type="button"
                  className="qpw-cta qpw-cta-google"
                  onClick={() => setLightbox({ type: "google", testimonial: t })}
                  aria-label="הצג ביקורת גוגל"
                >
                  <GoogleG />
                  <span>ביקורת מקורית</span>
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Tier 3 — Trust footer */}
      <p className="qpw-trust">
        עדויות אמיתיות מלקוחות. סרטונים שצולמו בסדנאות, הודעות וואטסאפ מקבוצות, וביקורות גוגל פומביות.
      </p>

      {/* Lightbox */}
      {lightbox && (
        <div className="qpw-lightbox" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button
            type="button"
            className="qpw-close"
            onClick={(e) => { e.stopPropagation(); setLightbox(null); }}
            aria-label="סגור"
          >
            ✕
          </button>

          {lightbox.type === "image" && (
            <img src={lightbox.src} alt="הודעה מקורית" onClick={(e) => e.stopPropagation()} />
          )}

          {lightbox.type === "video" && (
            <div className="qpw-video-wrap" onClick={(e) => e.stopPropagation()}>
              {lightbox.vimeoId.startsWith("PLACEHOLDER") ? (
                <div className="qpw-video-placeholder">
                  <p>הסרטון יועלה בקרוב</p>
                  <p className="qpw-video-id">({lightbox.vimeoId})</p>
                </div>
              ) : (
                <iframe
                  src={`https://player.vimeo.com/video/${lightbox.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="עדות"
                />
              )}
            </div>
          )}

          {lightbox.type === "google" && (
            <div className="qpw-google-card" onClick={(e) => e.stopPropagation()}>
              <div className="qpw-google-header">
                <div className="qpw-google-avatar">{lightbox.testimonial.initial}</div>
                <div>
                  <div className="qpw-google-name">{lightbox.testimonial.author}</div>
                  <div className="qpw-google-meta">
                    <span className="qpw-google-stars">★★★★★</span>
                    <span>{lightbox.testimonial.date}</span>
                  </div>
                </div>
                <div className="qpw-google-logo"><GoogleG /></div>
              </div>
              <p className="qpw-google-text">
                {lightbox.testimonial.highlight} {lightbox.testimonial.body}
              </p>
              <div className="qpw-google-source">ביקורת אמיתית מתוך פרופיל הגוגל של הדר דנן</div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .qpw { display: flex; flex-direction: column; gap: 28px; }

        /* Wall of faces */
        .qpw-wall {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(201, 150, 74, 0.25);
          box-shadow: 0 0 60px rgba(201, 150, 74, 0.08);
          aspect-ratio: 16 / 7;
          background: #0d1018;
        }
        .qpw-wall img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
          filter: saturate(0.85) brightness(0.55);
        }
        .qpw-wall-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; padding: 16px;
          background: radial-gradient(ellipse at center, rgba(13,16,24,0.35) 0%, rgba(13,16,24,0.75) 70%);
        }
        .qpw-wall-stat {
          font-size: clamp(48px, 9vw, 96px);
          font-weight: 800; color: #E8B94A;
          line-height: 1; letter-spacing: -1px;
          text-shadow: 0 4px 30px rgba(201, 150, 74, 0.4);
        }
        .qpw-wall-label {
          margin-top: 10px;
          font-size: clamp(15px, 2.2vw, 22px);
          font-weight: 600; color: #EDE9E1;
        }
        .qpw-wall-sub {
          margin-top: 6px;
          font-size: clamp(12px, 1.6vw, 15px);
          color: rgba(232, 185, 74, 0.85);
          letter-spacing: 0.5px;
        }

        /* Cards grid */
        .qpw-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .qpw-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 960px) {
          .qpw-grid { grid-template-columns: 1fr 1fr 1fr; }
        }

        .qpw-card {
          background: linear-gradient(145deg, #1D2430, #111620);
          border: 1px solid rgba(201, 150, 74, 0.18);
          border-radius: 16px;
          padding: 22px 20px 16px;
          display: flex; flex-direction: column;
          gap: 14px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .qpw-card:hover {
          border-color: rgba(201, 150, 74, 0.45);
          transform: translateY(-2px);
        }

        .qpw-stars { color: #E8B94A; font-size: 14px; letter-spacing: 2px; }

        .qpw-quote {
          margin: 0;
          font-size: 15px;
          line-height: 1.65;
          color: #EDE9E1;
          flex: 1;
        }
        .qpw-highlight {
          font-size: 17px; font-weight: 700;
          color: #E8B94A;
          display: block;
          margin-bottom: 6px;
          line-height: 1.45;
        }
        .qpw-body { color: #B8B2A7; }

        .qpw-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 14px;
          border-top: 1px solid rgba(201, 150, 74, 0.12);
        }
        .qpw-author {
          font-size: 13px;
          color: #9E9990;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .qpw-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(201, 150, 74, 0.08);
          border: 1px solid rgba(201, 150, 74, 0.25);
          border-radius: 10px;
          padding: 6px 10px;
          cursor: pointer;
          font-family: inherit;
          font-size: 11px;
          color: #C9964A;
          font-weight: 600;
          transition: background 0.2s, border-color 0.2s;
        }
        .qpw-cta:hover {
          background: rgba(201, 150, 74, 0.18);
          border-color: rgba(232, 185, 74, 0.6);
        }
        .qpw-cta-wa { color: #4CAF82; border-color: rgba(76, 175, 130, 0.35); background: rgba(76, 175, 130, 0.08); }
        .qpw-cta-wa:hover { background: rgba(76, 175, 130, 0.18); border-color: rgba(76, 175, 130, 0.6); }
        .qpw-cta-video { color: #E8B94A; }
        .qpw-cta-google { color: #4285F4; border-color: rgba(66, 133, 244, 0.35); background: rgba(66, 133, 244, 0.08); }
        .qpw-cta-google:hover { background: rgba(66, 133, 244, 0.18); border-color: rgba(66, 133, 244, 0.6); }

        /* Trust footer */
        .qpw-trust {
          text-align: center;
          font-size: 12px;
          color: #6F6A60;
          margin: 0;
          line-height: 1.6;
        }

        /* Lightbox */
        .qpw-lightbox {
          position: fixed; inset: 0;
          background: rgba(8, 12, 20, 0.92);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          cursor: pointer;
          backdrop-filter: blur(8px);
        }
        .qpw-lightbox img {
          max-width: min(720px, 95vw);
          max-height: 90vh;
          border-radius: 14px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          cursor: default;
        }
        .qpw-close {
          position: absolute;
          top: 20px; left: 20px;
          width: 44px; height: 44px;
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

        /* Video lightbox — 16:9 for landscape compilation video */
        .qpw-video-wrap {
          width: min(900px, 95vw);
          aspect-ratio: 16 / 9;
          max-height: 90vh;
          border-radius: 14px;
          overflow: hidden;
          background: #000;
          cursor: default;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
        }
        .qpw-video-wrap iframe {
          width: 100%; height: 100%;
          border: 0; display: block;
        }
        .qpw-video-placeholder {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: #9E9990; gap: 8px;
          padding: 20px; text-align: center;
        }
        .qpw-video-id {
          font-size: 12px; color: #6F6A60;
          font-family: monospace;
        }

        /* Google review card */
        .qpw-google-card {
          width: min(540px, 95vw);
          background: #FFFFFF;
          color: #202124;
          border-radius: 14px;
          padding: 24px;
          cursor: default;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          font-family: 'Roboto', 'Assistant', sans-serif;
        }
        .qpw-google-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .qpw-google-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4285F4, #1A73E8);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }
        .qpw-google-name {
          font-size: 15px;
          font-weight: 600;
          color: #202124;
        }
        .qpw-google-meta {
          font-size: 13px;
          color: #5F6368;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .qpw-google-stars {
          color: #FBBC04;
          letter-spacing: 1px;
        }
        .qpw-google-logo {
          margin-right: auto;
        }
        .qpw-google-text {
          font-size: 15px;
          line-height: 1.6;
          color: #3C4043;
          margin: 0;
        }
        .qpw-google-source {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #E8EAED;
          font-size: 12px;
          color: #80868B;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
