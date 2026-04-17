"use client";

import { useState, useEffect } from "react";

interface FAQ {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQ[];
}

export function AtelierLandingClient({ faqs }: Props) {
  // FAQ accordion
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Form state
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [instagram, setInstagram] = useState("");
  const [story,     setStory]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Fire ATELIER_VIEW on mount
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ATELIER_VIEW",
        metadata: { page: "atelier" },
      }),
    }).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/atelier/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, instagram, story }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "שגיאה לא צפויה, נסי שוב.");
        return;
      }

      setSuccess(true);

      // Fire ATELIER_APPLY_SUBMITTED event
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ATELIER_APPLY_SUBMITTED",
          metadata: { page: "atelier" },
        }),
      }).catch(() => {});
    } catch {
      setError("שגיאה בשליחה. בדקי חיבור לאינטרנט ונסי שוב.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div dir="rtl" className="font-assistant">

      {/* ═══ 1. HERO ═══ */}
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            <span className="eyebrow-text">beegood atelier</span>
          </div>
          <h1 className="hero-headline">
            ממשפיענית<br />
            ל<em>מנהיגה תרבותית</em>
          </h1>
          <p className="hero-sub">
            לא עוד קולאבים. לא עוד מוניטיזציה שמרגישה זרה. מקום בו אנחנו לוקחים את הקול שלך, מדייקים אותו, ובונים עולם שלם סביבו - אסטרטגיה, נרטיב, ופלטפורמה דיגיטלית שמבטאת מי שאת באמת.
          </p>
          <a href="#form" className="hero-cta">לבדיקת התאמה</a>
          <p className="hero-note">20 דקות שיחה. בלי עלות. בלי התחייבות.</p>
        </div>
      </section>

      {/* ═══ 2. THE SHIFT ═══ */}
      <section className="section shift">
        <div className="section-inner">
          <div className="section-label">המהלך</div>
          <h2 className="section-title">שתי דרכים לייצר הכנסה מקהל</h2>
          <p className="section-lead">
            האחת תלויה בדילים, באלגוריתם, ובמי ששולח לך הודעה השבוע. השניה שלך.
          </p>

          <div className="shift-grid">
            <div className="shift-col before">
              <div className="shift-col-label">משפיענית</div>
              <div className="shift-col-title">לחיות מקולאבים</div>
              <ul className="shift-list">
                <li>הכנסה תלויה בדיל הבא</li>
                <li>אין שליטה במה שמציעים לך</li>
                <li>הקהל מכיר מה שאת מוכרת, לא מי שאת</li>
                <li>כל חודש מאפס</li>
                <li>אין נכס שצומח מעבר לפלטפורמה</li>
              </ul>
            </div>

            <div className="shift-arrow">{"←"}</div>

            <div className="shift-col after">
              <div className="shift-col-label">מנהיגה תרבותית</div>
              <div className="shift-col-title">להוביל קהל לעולם שלך</div>
              <ul className="shift-list">
                <li>עולם עם שם, ערכים ומוצרים שלך</li>
                <li>את שולטת במה שהקהל מקבל</li>
                <li>הקהל מזדהה עם מי שאת, לא מה שאת מוכרת</li>
                <li>נכס שמצטבר, לא מאפס</li>
                <li>פלטפורמה בבעלותך המלאה</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. WHAT IS ATELIER ═══ */}
      <section className="section what">
        <div className="section-inner">
          <div className="section-label">מה זה beegood atelier</div>
          <h2 className="section-title">סדנת אמן - <em>לאסטרטגיה ותוכן</em></h2>
          <p className="section-lead">
            כמו בתי אופנה עילית שעובדים בהתאמה אישית עם מעצבות וייצור בעבודת יד, אנחנו עובדים עם מספר מצומצם של לקוחות נבחרות - ובונים איתן משהו שאין באף מקום אחר.
          </p>

          <div className="what-steps">
            <div className="what-step">
              <div className="what-step-num">1</div>
              <div className="what-step-body">
                <div className="what-step-title">דיוק הבידול</div>
                <div className="what-step-desc">שיטת TrueSignal - שלוש פגישות עם הדר שמוציאות החוצה את מה שאת באמת. לא מה שהשוק רוצה לשמוע, לא מה שעובד ברשת - את. זה הלב של כל מה שיבוא אחרי.</div>
              </div>
            </div>
            <div className="what-step">
              <div className="what-step-num">2</div>
              <div className="what-step-body">
                <div className="what-step-title">בניית הנרטיב</div>
                <div className="what-step-desc">הסיפור שהקהל שלך יזדהה איתו. המסר שמבדיל אותך. העולם שאת מובילה. הכל נבנה בעבודה צמודה איתך - כי את היחידה שיודעת מי את.</div>
              </div>
            </div>
            <div className="what-step">
              <div className="what-step-num">3</div>
              <div className="what-step-body">
                <div className="what-step-title">הקמת הפלטפורמה</div>
                <div className="what-step-desc">אתר מלא תחת הדומיין שלך תחת beegood.online - קוויז, קורסים, סדנאות, מנויים, קהילה. הכל בבעלותך המלאה. הכל חי תוך ימים, לא חודשים.</div>
              </div>
            </div>
            <div className="what-step">
              <div className="what-step-num">4</div>
              <div className="what-step-body">
                <div className="what-step-title">ליווי מתמשך</div>
                <div className="what-step-desc">לא פרויקט שנגמר. שותפות. אנחנו שותפים להצלחה שלך - אסטרטגיה שוטפת, שיפורים במערכת, והכוונה כשצריך. כל עוד את גדלה, אנחנו איתך.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. SHIRI - LIVING PROOF ═══ */}
      <section className="shiri">
        <div className="shiri-inner">
          <div className="shiri-badge">הדגמה חיה</div>
          <h2 className="shiri-headline">
            שירי פדלון - הלקוחה <em>הראשונה</em> של ה-atelier
          </h2>

          <div className="shiri-journey">
            <div className="shiri-journey-row">
              <div className="shiri-journey-side">
                <div className="shiri-journey-label">היתה</div>
                <div className="shiri-journey-text">מוכרת קופונים ומארחת באינסטגרם</div>
              </div>
              <div className="shiri-journey-arrow">{"←"}</div>
              <div className="shiri-journey-side">
                <div className="shiri-journey-label">הפכה ל</div>
                <div className="shiri-journey-text after">מנהיגה תרבותית<br />שמפיגה בדידות</div>
              </div>
            </div>
          </div>

          <p className="shiri-body">
            שירי הגיעה אלינו עם 70 אלף עוקבות וחיים שלמים של התחלות מחדש. היא ידעה שהיא רוצה משהו מעבר לקופונים - אבל לא הצליחה להגדיר מה. <strong>שלוש פגישות אחר כך, היא ידעה.</strong>
          </p>
          <p className="shiri-body">
            הבאנו החוצה את הסיפור האמיתי שלה - על הבדידות שנשים מרגישות בעולם של מסכים, על הבאר שפעם היתה מקום מפגש ונעלמה עם הברז. ובנינו סביב הסיפור הזה עולם שלם: פרויקט "הבאר" - קהילה, מפגשים, תכנים.
          </p>

          <div className="shiri-quote">
            <p className="shiri-quote-text">
              "הבנתי שכל החיים מכרתי דברים לאחרים - וכשהגעתי להדר ואלון, בפעם הראשונה הרגשתי שמישהו רוצה לעזור לי למכור את *עצמי*. לא את הדיל של השבוע. את מי שאני."
            </p>
            <p className="shiri-quote-author">שירי פדלון, הלקוחה הראשונה של beegood atelier</p>
          </div>

          <a
            href="https://shirifadlon.beegood.online"
            className="shiri-visit"
            target="_blank"
            rel="noopener noreferrer"
          >
            לראות את האתר שבנינו לשירי {"←"}
          </a>
        </div>
      </section>

      {/* ═══ 5. FOR WHOM ═══ */}
      <section className="section forwhom">
        <div className="section-inner">
          <div className="section-label">מי מתאימה</div>
          <h2 className="section-title">atelier <em>לא</em> לכולם</h2>
          <p className="section-lead">
            אנחנו עובדים עם מספר קטן של לקוחות בכל זמן נתון. זה הופך את הבחירה ההדדית לקריטית.
          </p>

          <div className="forwhom-grid">
            <div className="forwhom-col yes">
              <div className="forwhom-col-label">כן, זה בשבילך אם</div>
              <div className="forwhom-col-title">יש לך קהל ואת רוצה לבנות סביבו משהו אמיתי</div>
              <ul className="forwhom-list">
                <li>יש לך קהל (10K+) שמאמין בך</li>
                <li>את רוצה להפסיק לחיות מקולאבים</li>
                <li>יש לך משהו לומר שהוא מעבר למוצר</li>
                <li>את מוכנה לשבת ולדייק את מי שאת</li>
                <li>את מחפשת שותפים לדרך, לא ספק</li>
              </ul>
            </div>
            <div className="forwhom-col no">
              <div className="forwhom-col-label">לא, זה לא בשבילך אם</div>
              <div className="forwhom-col-title">את מחפשת פתרון מהיר או שירות טכני</div>
              <ul className="forwhom-list">
                <li>את מחפשת רק "אתר יפה"</li>
                <li>את לא מוכנה לעבוד על הבידול</li>
                <li>את רוצה תוצאה בחודש</li>
                <li>אין לך קהל עדיין</li>
                <li>את לא מחפשת שותפות ארוכת טווח</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. PROCESS ═══ */}
      <section className="section process">
        <div className="section-inner">
          <div className="section-label">התהליך</div>
          <h2 className="section-title">איך זה נראה בפועל</h2>
          <p className="section-lead">
            מהשיחה הראשונה ועד ההשקה - הדרך מובנית אבל אישית לחלוטין.
          </p>

          <div className="process-steps">
            <div className="process-step">
              <div className="process-step-num">01</div>
              <div className="process-step-title">שיחת היכרות</div>
              <div className="process-step-desc">20 דקות. בלי עלות. אנחנו מבינים אם יש כאן התחלה של משהו.</div>
            </div>
            <div className="process-step">
              <div className="process-step-num">02</div>
              <div className="process-step-title">אבחון אסטרטגי</div>
              <div className="process-step-desc">שלוש פגישות עם הדר. שיטת TrueSignal. מוציאים את מי שאת באמת.</div>
            </div>
            <div className="process-step">
              <div className="process-step-num">03</div>
              <div className="process-step-title">בנייה</div>
              <div className="process-step-desc">אתר מלא תחת beegood.online, נרטיב, מוצרים, הכל בעבודה צמודה איתך.</div>
            </div>
            <div className="process-step">
              <div className="process-step-num">04</div>
              <div className="process-step-title">השקה וליווי</div>
              <div className="process-step-desc">עולים לאוויר, ואנחנו ממשיכים איתך. שותפים להצלחה.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7. TEAM ═══ */}
      <section className="section team">
        <div className="section-inner">
          <div className="section-label">מי עומד מאחורי</div>
          <h2 className="section-title">beegood = <em>אלון + הדר</em></h2>
          <p className="section-lead">
            לא חברה. שותפות. שני ראשים שחיים ונושמים את זה ביחד.
          </p>

          <div className="team-card">
            <div className="team-duo">
              <div className="team-person">
                <div className="team-photo-placeholder">[תמונה של אלון]</div>
                <div className="team-name">אלון עבדי</div>
                <div className="team-role">Strategy · Technology</div>
                <div className="team-desc">
                  חד, אינטואיטיבי, יודע לאסוף נקודות ולחבר אותן לתמונה שלמה. רואה מה שעוד לא נאמר ומתרגם אותו למבנה שעובד. עשרות שנות ניסיון עסקי, אסטרטגי וטכנולוגי - בונה את העולם שמחזיק את החזון.
                </div>
              </div>
              <div className="team-person">
                <div className="team-photo-placeholder" style={{ padding: 0, overflow: "hidden" }}>
                  <img src="/hadarprotrait.png" alt="הדר דנן" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div className="team-name">הדר דנן</div>
                <div className="team-role">Creative · Strategy</div>
                <div className="team-desc">
                  חדה, אינטואיטיבית, יודעת לאסוף נקודות ולחבר אותן לתמונה שלמה. 70K עוקבים ו-3,500 עסקים שעברו דרכה יודעים: היא שומעת מה שלא אומרים, ומחזירה לך את מי שאת בבהירות שלא היתה שם קודם. יוצרת שיטת TrueSignal.
                </div>
              </div>
            </div>
            <div className="team-together">
              <p className="team-together-text">
                זה לא "שני מוחות שחושבים אחרת". זה <em>שני מוחות שחושבים אותו דבר</em> - ובגלל זה זה מכפיל כוח מטורף. שנינו רואים את אותה תמונה, אוספים את אותן נקודות, מגיעים לאותה מסקנה - פשוט בעומק כפול. שנינו טובים עם אנשים. שנינו יודעים לשמוע. שנינו חדים. זה מה שהופך פגישה איתנו לפגישה שאחריה הכל בהיר.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 8. FAQ ═══ */}
      <section className="section faq">
        <div className="section-inner">
          <div className="section-label">שאלות נפוצות</div>
          <h2 className="section-title">מה שכולן שואלות</h2>

          <div className="faq-items" style={{ marginTop: 40 }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item${openFaqIdx === idx ? " open" : ""}`}
              >
                <button
                  className="faq-q"
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                >
                  {faq.question}
                  <span className="faq-icon">+</span>
                </button>
                <div className="faq-a">{faq.answer}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 9. FORM ═══ */}
      <section className="form-section" id="form">
        <div className="form-inner">
          {success ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
              <h2 className="form-title" style={{ marginBottom: 12 }}>קיבלנו את הבקשה שלך</h2>
              <p className="form-desc">
                הדר ואלון יעברו על הפרטים תוך 48 שעות. אם נראה שיש כאן התחלה של משהו, נחזור אלייך לקבוע שיחת היכרות של 20 דקות.
              </p>
            </div>
          ) : (
            <>
              <h2 className="form-title">בואי נבדוק התאמה הדדית</h2>
              <p className="form-desc">
                מלאי פרטים קצרים ונחזור אלייך תוך 48 שעות. אם נראה שיש כאן התחלה של משהו, נקבע שיחת היכרות של 20 דקות עם הדר ואלון.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label className="form-label" htmlFor="atelier-name">שם מלא</label>
                  <input
                    type="text"
                    id="atelier-name"
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="atelier-phone">טלפון</label>
                  <input
                    type="tel"
                    id="atelier-phone"
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="atelier-instagram">אינסטגרם / פלטפורמה</label>
                  <input
                    type="text"
                    id="atelier-instagram"
                    className="form-input"
                    placeholder="@username"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="atelier-story">ספרי לנו בכמה משפטים - מי את ומה את מחפשת</label>
                  <textarea
                    id="atelier-story"
                    className="form-textarea"
                    value={story}
                    onChange={e => setStory(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <p style={{ color: "#E05555", fontSize: 14, marginBottom: 12, textAlign: "center" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="form-submit"
                  disabled={loading}
                >
                  {loading ? "שולחת..." : "לשליחה"}
                </button>
                <p className="form-privacy">
                  הפרטים שלך נשמרים אצלנו בלבד, ולא יועברו לאף גורם חיצוני.
                </p>
              </form>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
