'use client';

import { useState, useEffect, useRef } from 'react';
import { CourseCTA } from './CourseCTA';
import { CreditBanner } from '@/components/landing/CreditBanner';
import { PRODUCT_MAP } from '@/lib/products';

const MODULES = [
  { num: '01', title: 'למה אתה באמת שונה',    desc: 'מגלים את ה-TrueSignal שלך - הדבר שאף אחד אחר לא עושה כמוך.' },
  { num: '02', title: 'הלקוח האידיאלי שלך',  desc: 'מי הם, מה הם רוצים, ולמה יבחרו בך ולא במתחרה הזול.' },
  { num: '03', title: 'המסר שמוכר',           desc: 'בונים משפט אחד שמסביר מה אתה עושה - בלי לבלבל, בלי להאריך.' },
  { num: '04', title: 'הסיפור שמחבר',         desc: 'איך מספרים את הסיפור שלך כך שלקוחות ירגישו שאתה מדבר אליהם.' },
  { num: '05', title: 'תוכן שמביא לידים',     desc: 'מה לפרסם, מתי ואיך - כך שכל פוסט עובד בשבילך גם כשאתה ישן.' },
  { num: '06', title: 'המחיר שמשקף ערך',      desc: 'איך להציג מחיר כך שלקוחות לא יתמקחו - אלא ישמחו לשלם.' },
  { num: '07', title: 'הפניות שמגיעות לבד',   desc: 'מנגנון שגורם ללקוחות מרוצים להביא לקוחות חדשים - ללא מאמץ.' },
  { num: '08', title: 'הצמיחה הבאה שלך',      desc: 'מה עושים עם הבידול שבנינו - תוכנית פעולה לחודש הקרוב.' },
];

const FAQS = [
  { q: 'לא בטוח שזה מתאים לתחום שלי', a: 'הקורס עבר עם יותר מ-3,500 עסקים - רופאים, עורכי דין, מאמנים, יועצים, בעלי מקצוע. הבידול רלוונטי לכל מי שמוכר את עצמו ואת הידע שלו.' },
  { q: 'כמה זמן לוקח לסיים את הקורס?', a: '16 שיעורים של כחצי שעה - סה"כ כ-8 שעות. אפשר שיעור ביום ולסיים תוך שבועיים, או לרוץ על זה בסוף שבוע. הגישה שלך לנצח.' },
  { q: 'ניסיתי קורסים בעבר ולא יצא לי כלום', a: 'רוב הקורסים נותנים תיאוריה. הקורס הזה בנוי על שיטה שהדר יישמה בשטח עם 3,500 עסקים - כל שיעור נגמר עם משימה אחת ברורה שמיישמים מיד.' },
  { q: 'מה קורה אם יש לי שאלה תוך כדי הקורס?', a: 'הקורס מלווה בדוגמאות ותרגילים לאורך כל הדרך. ניתן לפנות דרך הפלטפורמה ולקבל מענה ישיר.' },
  { q: 'האם הקורס מתעדכן?', a: 'כן. כשהדר מוסיפה תכנים - אתה מקבל אותם ללא עלות נוספת. קנית פעם אחת, מרוויח לאורך זמן.' },
];

type MicroStep = 'step1' | 'step2' | 'step3' | 'stepResult' | 'stepDirect';

const PROGRESS: Record<string, { width: string; label: string; pct: string }> = {
  step1:      { width: '33%',  label: 'שלב 1 מתוך 3', pct: '33%'  },
  step2:      { width: '66%',  label: 'שלב 2 מתוך 3', pct: '66%'  },
  step3:      { width: '90%',  label: 'שלב 3 מתוך 3', pct: '90%'  },
  stepResult: { width: '100%', label: 'הכל מוכן',      pct: '100%' },
  stepDirect: { width: '100%', label: 'מוכן לרכישה',   pct: '100%' },
};

function getResultMsg(answers: Record<number, string>): string {
  const challenge = answers[1] ?? '';
  const budget    = answers[2] ?? '';
  let msg = '';
  if (challenge.includes('מסר') || challenge.includes('מייחד')) {
    msg = 'מודולים 1-3 יפתרו לך את זה ישירות - בשעתיים תצא עם מסר ברור שעובד.';
  } else if (challenge.includes('לידים')) {
    msg = 'מודול 5 בנוי בדיוק על זה - תוכן שמביא לידים, לא תוכן שיפה לעין.';
  } else if (challenge.includes('מתחרה')) {
    msg = 'מודול 6 ייתן לך את הכלים להסביר למה אתה שווה יותר - ולגבות את זה.';
  } else {
    msg = 'הקורס בדיוק בשבילך. 8 מודולים שיעשו לך סדר מהיסוד.';
  }
  if (budget.includes('5,000') || budget.includes('10,000')) {
    msg += ' 1,800 שקל עכשיו יחסכו לך כנראה פי 3-4 כל חודש.';
  }
  return msg;
}

interface Props {
  credit: number;
  whatsappPhone: string;
  email: string;
}

export function CourseLandingClient({ credit, whatsappPhone, email }: Props) {
  const price = PRODUCT_MAP.course_1800.price;
  const wa    = `https://wa.me/${whatsappPhone}`;

  // Accordion state
  const [openModuleIdx, setOpenModuleIdx] = useState<number>(0);
  const [openFaqIdx,    setOpenFaqIdx]    = useState<number | null>(null);

  // Micro-commitment state
  const [microStep,    setMicroStep]    = useState<MicroStep>('step1');
  const [answers,      setAnswers]      = useState<Record<number, string>>({});
  const [selectedOpt,  setSelectedOpt]  = useState<string | null>(null);
  const [resultMsg,    setResultMsg]    = useState('');

  const microStepRef   = useRef<MicroStep>('step1');
  microStepRef.current = microStep;

  // Sticky bar
  const [stickyVisible, setStickyVisible] = useState(false);
  const stepResultCtaRef = useRef<HTMLDivElement>(null);
  const stepDirectCtaRef = useRef<HTMLDivElement>(null);
  const finalCtaRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isVis = (el: Element | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };
    const update = () => {
      if (window.scrollY < 400) { setStickyVisible(false); return; }
      const step = microStepRef.current;
      const mainVis =
        (step === 'stepResult' && isVis(stepResultCtaRef.current)) ||
        (step === 'stepDirect' && isVis(stepDirectCtaRef.current));
      setStickyVisible(!mainVis && !isVis(finalCtaRef.current));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, [microStep]);

  const scrollToCTA = () => document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });

  const selectOption = (stepNum: number, value: string) => {
    setSelectedOpt(value);
    setAnswers(prev => ({ ...prev, [stepNum]: value }));
  };

  const nextStep = (to: MicroStep) => {
    setSelectedOpt(null);
    setMicroStep(to);
  };

  const showResult = () => {
    const msg = getResultMsg(answers);
    setResultMsg(msg);
    setMicroStep('stepResult');
    setSelectedOpt(null);
  };

  const skipToCheckout = () => {
    setSelectedOpt(null);
    setMicroStep('stepDirect');
  };

  const backToQuiz = () => {
    setSelectedOpt(null);
    setAnswers({});
    setMicroStep('step1');
  };

  const prog = PROGRESS[microStep];

  const CtaSection = ({ refProp }: { refProp: React.RefObject<HTMLDivElement | null> }) => (
    <div ref={refProp}>
      <CreditBanner credit={credit} listPrice={price} productName="הקורס הדיגיטלי" dark />
      <CourseCTA whatsappPhone={whatsappPhone} credit={credit} initialEmail={email} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '4px 0', marginTop: 8 }}>
        {['🔒 תשלום מאובטח', '⚡ גישה מיידית', '🛡 SSL מוצפן'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--fg-muted)' }}>{t}</div>
        ))}
      </div>
      <a href={wa} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: 'var(--fg-muted)', textDecoration: 'none', marginTop: 8 }} target="_blank" rel="noopener noreferrer">
        <span style={{ fontSize: 18 }}>💬</span>
        <span>יש שאלה לפני הרכישה? <strong style={{ color: 'var(--fg)' }}>דברו איתנו בוואטסאפ</strong></span>
      </a>
      <div style={{ background: 'rgba(201,150,74,0.05)', border: '1px solid rgba(201,150,74,0.12)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center', lineHeight: 1.6, marginTop: 8 }}>
        הקרדיט מצטבר - <strong style={{ color: 'var(--gold)' }}>₪{price.toLocaleString('he-IL')} שתשלם היום</strong> יצטברו לקראת פגישת האסטרטגיה, הסדנה, או יום הצילום הבא שלך.
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 14, borderTop: '1px solid rgba(44,50,62,0.5)', marginTop: 8 }}>
        <div style={{ fontSize: 24, flexShrink: 0 }}>💬</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--fg)', marginBottom: 3 }}>תמיכה ישירה</div>
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>שאלות? פניות? פונים דרך הפלטפורמה ומקבלים מענה ישיר.</div>
        </div>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="font-assistant" style={{ background: '#080C14', color: 'var(--fg)', minHeight: '100vh' }}>

      {/* STICKY BAR */}
      <div className={`lp-sticky${stickyVisible ? ' visible' : ''}`}>
        <div className="lp-sticky-text"><strong>קורס בידול מותג אישי</strong><br />₪{price.toLocaleString('he-IL')} - גישה מיידית</div>
        <button className="lp-sticky-cta" onClick={scrollToCTA}>אני רוצה להתחיל</button>
      </div>

      {/* HERO */}
      <div className="hero-section">
        <h1 className="hero-hook">
          אתה יודע שאתה טוב.<br />
          אבל <em>הלקוחות לא יודעים</em><br />
          למה לבחור דווקא בך.
        </h1>

        {/* VSL */}
        <div className="vsl-wrap">
          <div className="vsl-inner">
            <div className="vsl-placeholder">
              <div className="vsl-play">▶</div>
              <div className="vsl-label">הדר מסבירה על הקורס</div>
              <div className="vsl-time">3 דקות - עם כתוביות</div>
            </div>
            <div className="vsl-badge">REELS</div>
          </div>
          <div className="content-placeholder" style={{ marginTop: 10 }}>
            <div className="cp-icon">🎬</div>
            <div className="cp-title">ממתין לסרטון VSL של הדר</div>
            <div className="cp-desc">הדר מצלמת 3 דקות לפי התסריט שהוכן.<br />אחרי הצילום - מחליפים שורה אחת בקוד ומסירים placeholder זה.</div>
            <span className="cp-action">לאחר הוספת הסרטון: הסר div זה</span>
          </div>
        </div>

        <button id="main-cta-btn" className="hero-cta" onClick={scrollToCTA}>אני רוצה להתחיל</button>
        <div className="hero-note">גישה מיידית - ₪{price.toLocaleString('he-IL')} חד-פעמי - ללא התחייבות חודשית</div>

        <div className="stats-strip">
          <div className="hero-eyebrow">קורס דיגיטלי - 8 מודולים - 16 שיעורים</div>
          <div className="hero-stats">
            <div><div className="stat-val">3,500+</div><div className="stat-label">עסקים עבדו עם הדר</div></div>
            <div><div className="stat-val">1,000+</div><div className="stat-label">משתתפי סדנאות</div></div>
            <div><div className="stat-val">16</div><div className="stat-label">שיעורים מעשיים</div></div>
          </div>
        </div>
      </div>

      <div className="lp-divider" />

      {/* PROBLEM */}
      <div className="lp-section">
        <div className="lp-eyebrow">הבעיה</div>
        <h2 className="lp-section-title">המצב שבו אתה נמצא עכשיו</h2>
        <div className="problem-list">
          <div className="problem-item"><div className="problem-icon">😓</div><div className="problem-text">אתה מוציא אלפי שקלים בחודש על יועצים, גרפיקאים וקופירייטרים - כי אין לך <strong>שפה ברורה</strong> שמתארת מה אתה עושה ולמה זה שונה.</div></div>
          <div className="problem-item"><div className="problem-icon">🔄</div><div className="problem-text">אתה מסביר את עצמך כל פעם מחדש - בפגישה, בסטורי, במייל - ויוצא ממנה <strong>לא בטוח שהצד השני הבין.</strong></div></div>
          <div className="problem-item"><div className="problem-icon">📉</div><div className="problem-text">לקוחות מגיעים אליך ובוחרים במישהו זול יותר - לא כי הוא טוב יותר, אלא כי הם לא הבינו <strong>למה אתה שווה יותר.</strong></div></div>
        </div>
        <div className="lp-agitation">
          <div className="lp-agitation-title">מה זה עולה לך בפועל</div>
          <div className="lp-agitation-text">בעל מותג אישי ללא בידול ברור משלם בממוצע <strong>3,000-8,000 שקל בחודש</strong> על ייעוץ חיצוני לדברים שהיה יכול לעשות לבד. זה <strong>36,000-96,000 שקל בשנה</strong> שיוצאים בגלל חוסר בהירות אחד.</div>
        </div>
      </div>

      <div className="lp-divider" />

      {/* MODULES */}
      <div className="lp-section">
        <div className="lp-eyebrow">הפתרון</div>
        <h2 className="lp-section-title">8 מודולים שבונים את <em>הבידול שלך</em></h2>
        <p className="lp-section-desc">לא תיאוריה. לא שבלונות. תהליך שעברו דרכו יותר מ-3,500 עסקים - ומסתיים עם מסר ברור שאתה יכול להשתמש בו מחר בבוקר.</p>
        <div className="modules-list">
          {MODULES.map((m, i) => (
            <div
              key={i}
              className={`module-acc${openModuleIdx === i ? ' open' : ''}`}
              onClick={() => setOpenModuleIdx(openModuleIdx === i ? -1 : i)}
            >
              <button className="module-acc-btn">
                <div className="module-acc-left">
                  <span className="module-num-badge">{m.num}</span>
                  <span className="module-acc-title">{m.title}</span>
                </div>
                <span className="module-acc-icon">+</span>
              </button>
              <div className="module-acc-body">
                <div className="module-acc-desc">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-divider" />

      {/* NFE */}
      <div className="lp-section">
        <div className="nfe-box">
          <div className="nfe-box-title">זה לא לכל אחד.</div>
          <div className="nfe-grid">
            <div>
              <div className="nfe-col-title red">לא מתאים אם</div>
              <div className="nfe-item"><span>✗</span><span>אתה מחפש כפתור קסם בלי להשקיע</span></div>
              <div className="nfe-item"><span>✗</span><span>אין לך עסק פעיל עם לקוחות</span></div>
              <div className="nfe-item"><span>✗</span><span>אתה רוצה תוצאות תוך יומיים</span></div>
            </div>
            <div>
              <div className="nfe-col-title green">מתאים אם</div>
              <div className="nfe-item"><span>✓</span><span>יש לך עסק שעובד ורוצה לצמוח</span></div>
              <div className="nfe-item"><span>✓</span><span>אתה מוכן לעשות את העבודה</span></div>
              <div className="nfe-item"><span>✓</span><span>נמאס לך להסביר את עצמך כל פעם</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-divider" />

      {/* HADAR */}
      <div className="lp-section">
        <div className="lp-eyebrow">מי מלמדת</div>
        <h2 className="lp-section-title">הדר דנן - מעורבת אישית</h2>
        <div className="hadar-box">
          <div className="hadar-photo-wrap">
            <div className="hadar-photo-placeholder">📸<br />תמונת<br />הדר</div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="hadar-name">הדר דנן</div>
            <div className="hadar-role">מייסדת TrueSignal - מומחית בידול מותג אישי</div>
            <div className="hadar-text">לא קורס שצולם פעם אחת ונשכח. <strong>הדר מעורבת אישית</strong> - השיטה שמלמדים כאן היא אותה שיטה שיישמה עם יותר מ-<strong>3,500 עסקים</strong> בתחומים שונים לאורך 4 שנים.</div>
          </div>
        </div>
        <div className="content-placeholder" style={{ marginTop: 12 }}>
          <div className="cp-icon">📸</div>
          <div className="cp-title">תמונת פנים של הדר</div>
          <div className="cp-desc">להחליף את circle placeholder בתמונת פרופיל מקצועית של הדר.<br />גודל מומלץ: 160x160px, עיגול. לאחר הוספה - הסר div זה.</div>
          <span className="cp-action">לאחר הוספת התמונה: הסר div זה</span>
        </div>
      </div>

      <div className="lp-divider" />

      {/* PROOF */}
      <div className="lp-section">
        <div className="lp-eyebrow">הוכחה</div>
        <h2 className="lp-section-title">מספרים שמדברים</h2>
        <div className="content-placeholder" style={{ marginBottom: 20 }}>
          <div className="cp-icon">🏢</div>
          <div className="cp-title">לוגואים של 6-8 עסקים ידועים שעבדו עם הדר</div>
          <div className="cp-desc">להוסיף לוגואים של לקוחות בולטים מה-3,500. גם שמות טקסט מספיקים אם אין קבצי לוגו.</div>
          <span className="cp-action">לאחר הוספת הלוגואים: הסר div זה</span>
        </div>
        <div className="proof-grid">
          <div className="proof-card"><div className="proof-val">3,500+</div><div className="proof-label">עסקים עבדו עם הדר</div></div>
          <div className="proof-card"><div className="proof-val">1,000+</div><div className="proof-label">משתתפי סדנאות</div></div>
          <div className="proof-card"><div className="proof-val">4 שנים</div><div className="proof-label">ניסיון בשטח</div></div>
        </div>
        <div className="testimonials-list">
          <div className="testimonial-card">
            <div className="content-placeholder" style={{ marginBottom: 10, padding: 10 }}>
              <div className="cp-title" style={{ fontSize: 11 }}>תמונת פרופיל + שם מלא של ממליץ זה</div>
              <div className="cp-desc">להחליף ב: img עגול 40px + שם מלא + עיר. לאחר הוספה - הסר placeholder.</div>
            </div>
            <div className="testimonial-text">&quot;לפני הייתי מסביר את עצמי אחרת כל פעם. אחרי - יש לי משפט אחד שסוגר עסקאות. <strong>תוך שבועיים קיבלתי שלושה לקוחות חדשים</strong> רק מהפרופיל המעודכן.&quot;</div>
            <div className="testimonial-author">ד.מ. - יועץ עסקי</div>
            <div className="testimonial-role">תל אביב</div>
          </div>
          <div className="testimonial-card">
            <div className="content-placeholder" style={{ marginBottom: 10, padding: 10 }}>
              <div className="cp-title" style={{ fontSize: 11 }}>תמונת פרופיל + שם מלא של ממליץ זה</div>
              <div className="cp-desc">להחליף ב: img עגול 40px + שם מלא + עיר. לאחר הוספה - הסר placeholder.</div>
            </div>
            <div className="testimonial-text">&quot;חשבתי שאני מכירה את עצמי. התברר שלא. <strong>המודול הראשון לבד שווה את כל המחיר</strong> - הוא שינה את האופן שבו אני מציגה את עצמי בכל מקום.&quot;</div>
            <div className="testimonial-author">מ.כ. - מאמנת אישית</div>
            <div className="testimonial-role">ירושלים</div>
          </div>
          <div className="testimonial-card">
            <div className="content-placeholder" style={{ marginBottom: 10, padding: 10 }}>
              <div className="cp-title" style={{ fontSize: 11 }}>תמונת פרופיל + שם מלא של ממליץ זה</div>
              <div className="cp-desc">להחליף ב: img עגול 40px + שם מלא + עיר. לאחר הוספה - הסר placeholder.</div>
            </div>
            <div className="testimonial-text">&quot;הפסקתי לשלם לקופירייטר חיצוני. <strong>חסכתי 4,000 שקל בחודש</strong> כי סוף סוף ידעתי לכתוב את עצמי.&quot;</div>
            <div className="testimonial-author">א.ל. - פיזיותרפיסט</div>
            <div className="testimonial-role">חיפה</div>
          </div>
        </div>
      </div>

      <div className="lp-divider" />

      {/* PRICE + MICRO-COMMITMENT */}
      <div className="lp-section" id="cta">
        <div className="lp-eyebrow">ההשקעה</div>
        <h2 className="lp-section-title">כמה זה עולה<br />וכמה זה שווה לך</h2>

        {/* ANCHOR BLOCK */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ background: 'rgba(224,85,85,0.06)', borderBottom: '1px solid rgba(224,85,85,0.15)', padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#E05555', marginBottom: 10 }}>מה אתה משלם עכשיו - כל חודש</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'rgba(224,85,85,0.6)', lineHeight: 1 }}>4,000+</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>יועץ שיווק</div>
              </div>
              <div style={{ fontSize: 20, color: 'var(--border)', alignSelf: 'center' }}>+</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'rgba(224,85,85,0.6)', lineHeight: 1 }}>2,500+</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>קופירייטר</div>
              </div>
              <div style={{ fontSize: 20, color: 'var(--border)', alignSelf: 'center' }}>=</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#E05555', lineHeight: 1 }}>6,500+</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>בכל חודש, לנצח</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', gap: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div style={{ background: 'rgba(201,150,74,0.15)', border: '1px solid rgba(201,150,74,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>או</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ background: 'rgba(76,175,130,0.05)', borderTop: '1px solid rgba(76,175,130,0.12)', padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#4CAF82', marginBottom: 10 }}>תשלם פעם אחת - ותעשה את זה לבד</div>
            <div style={{ fontSize: 32, fontWeight: 900, background: 'var(--grad-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1, marginBottom: 4 }}>₪{price.toLocaleString('he-IL')}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>השקעה חד-פעמית - גישה לכל החיים</div>
          </div>
        </div>

        {/* PRICE CARD */}
        <div className="price-box-new">
          <div className="price-top">
            <div className="price-tag-label">הקורס הדיגיטלי - השקעה חד-פעמית</div>
            <div className="price-amount">
              <div className="price-currency">₪</div>
              <div className="price-number">{price.toLocaleString('he-IL')}</div>
            </div>
            <div className="price-desc">גישה מלאה לכל החיים - 8 מודולים - 16 שיעורים</div>
          </div>
          <div className="price-includes">
            <div className="include-item"><div className="include-check">✓</div><div style={{ flex: 1, fontSize: 14, color: 'var(--fg-muted)' }}><strong style={{ color: 'var(--fg)' }}>8 מודולים</strong> - 16 שיעורים של 30 דקות</div><div className="include-val">₪{price.toLocaleString('he-IL')}</div></div>
            <div className="include-item"><div className="include-check">✓</div><div style={{ flex: 1, fontSize: 14, color: 'var(--fg-muted)' }}><strong style={{ color: 'var(--fg)' }}>גישה לכל עדכוני הקורס</strong> לנצח</div><div className="include-val">חינם</div></div>
            <div className="include-item"><div className="include-check">✓</div><div style={{ flex: 1, fontSize: 14, color: 'var(--fg-muted)' }}><strong style={{ color: 'var(--fg)' }}>צפייה מכל מכשיר</strong> - ללא הגבלת זמן</div><div className="include-val">חינם</div></div>
            <div className="include-item"><div className="include-check">✓</div><div style={{ flex: 1, fontSize: 14, color: 'var(--fg-muted)' }}><strong style={{ color: 'var(--fg)' }}>הקרדיט מצטבר</strong> לשלב הבא בסולם</div><div className="include-val">₪{price.toLocaleString('he-IL')}</div></div>
          </div>
          <div className="daily-reframe">פחות מ-<strong>5 שקל ביום</strong> בשנה הראשונה - פחות מכוס קפה, בשביל מסר שעובד לכל החיים.</div>
        </div>

        {/* MICRO-COMMITMENT */}
        <div className="micro-wrap">
          <div className="progress-container">
            <div className="progress-header">
              <span>{prog.label}</span>
              <span className="progress-pct">{prog.pct}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: prog.width }} />
            </div>
          </div>

          {/* STEP 1 */}
          <div id="step1" className={`micro-step${microStep === 'step1' ? ' active' : ''}`}>
            <div className="micro-card">
              <div className="micro-step-label">שאלה 1 מתוך 3</div>
              <div className="micro-question">מה הכי מאתגר אותך כרגע בעסק?</div>
              <div className="micro-options">
                {['אין לי מסר ברור', 'לא יודע מה מייחד אותי', 'תוכן שלא מביא לידים', 'לקוחות שבוחרים מתחרה זול'].map(opt => (
                  <button key={opt} className={`micro-option${answers[1] === opt ? ' selected' : ''}`} onClick={() => selectOption(1, opt)}>{opt}</button>
                ))}
              </div>
              <button className={`micro-next${answers[1] ? ' show' : ''}`} onClick={() => nextStep('step2')}>המשך</button>
              <button className="micro-skip" onClick={skipToCheckout}>כבר יודע שאני רוצה - עבור ישירות לרכישה</button>
            </div>
          </div>

          {/* STEP 2 */}
          <div id="step2" className={`micro-step${microStep === 'step2' ? ' active' : ''}`}>
            <div className="micro-card">
              <div className="micro-step-label">שאלה 2 מתוך 3</div>
              <div className="micro-question">כמה אתה מוציא על שיווק בחודש?</div>
              <div className="micro-options">
                {['עד 2,000 שקל', '2,000-5,000 שקל', '5,000-10,000 שקל', 'מעל 10,000 שקל'].map(opt => (
                  <button key={opt} className={`micro-option${answers[2] === opt ? ' selected' : ''}`} onClick={() => selectOption(2, opt)}>{opt}</button>
                ))}
              </div>
              <button className={`micro-next${answers[2] ? ' show' : ''}`} onClick={() => nextStep('step3')}>המשך</button>
              <button className="micro-skip" onClick={skipToCheckout}>עבור ישירות לרכישה</button>
            </div>
          </div>

          {/* STEP 3 */}
          <div id="step3" className={`micro-step${microStep === 'step3' ? ' active' : ''}`}>
            <div className="micro-card">
              <div className="micro-step-label">שאלה 3 מתוך 3</div>
              <div className="micro-question">כמה זמן אתה מרגיש תקוע עם זה?</div>
              <div className="micro-options">
                {['כמה חודשים', 'חצי שנה עד שנה', 'יותר משנה', 'מאז שפתחתי את העסק'].map(opt => (
                  <button key={opt} className={`micro-option${answers[3] === opt ? ' selected' : ''}`} onClick={() => selectOption(3, opt)}>{opt}</button>
                ))}
              </div>
              <button className={`micro-next${answers[3] ? ' show' : ''}`} onClick={showResult}>ראה את התוצאה שלי</button>
              <button className="micro-skip" onClick={skipToCheckout}>עבור ישירות לרכישה</button>
            </div>
          </div>

          {/* STEP RESULT */}
          <div id="stepResult" className={`micro-step${microStep === 'stepResult' ? ' active' : ''}`}>
            <div className="micro-result">
              ✓ זיהינו את הבעיה שלך<br />
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--fg-muted)' }}>{resultMsg}</span>
            </div>
            <CtaSection refProp={stepResultCtaRef} />
          </div>

          {/* STEP DIRECT */}
          <div id="stepDirect" className={`micro-step${microStep === 'stepDirect' ? ' active' : ''}`}>
            <CtaSection refProp={stepDirectCtaRef} />
            <button onClick={backToQuiz} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--fg-muted)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'Assistant, sans-serif', width: '100%', textAlign: 'center', marginTop: 8 }}>
              חזור לשאלות המותאמות אישית
            </button>
          </div>
        </div>
      </div>

      <div className="lp-divider" />

      {/* FAQ */}
      <div className="lp-section">
        <div className="lp-eyebrow">שאלות ותשובות</div>
        <h2 className="lp-section-title">מה שרצית לשאול</h2>
        <div className="faq-items">
          {FAQS.map((faq, i) => (
            <div key={i} className={`faq-item${openFaqIdx === i ? ' open' : ''}`}>
              <button className="faq-q" onClick={() => setOpenFaqIdx(openFaqIdx === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="lp-final">
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="lp-final-title" id="final-cta-btn" ref={finalCtaRef}>מוכן לדעת<br />למה לבחור דווקא בך?</div>
          <div className="lp-final-sub">3,500+ עסקים עשו את זה. עכשיו התור שלך.</div>
          <button className="lp-cta-btn" onClick={scrollToCTA} style={{ maxWidth: 380, margin: '0 auto 10px', display: 'block' }}>אני רוצה להתחיל</button>
          <div className="lp-cta-note">גישה מיידית - ₪{price.toLocaleString('he-IL')} חד-פעמי - ללא התחייבות</div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="lp-footer">
        <div className="lp-footer-logo">הדר דנן</div>
        <div className="lp-footer-signal">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr">TrueSignal©</span></div>
        <div className="lp-footer-links">
          <a href="/terms">תנאי שימוש</a>
          <a href="/privacy">מדיניות פרטיות</a>
          <a href="/hive/terms">תנאי מנוי הכוורת</a>
          <a href="/accessibility">נגישות</a>
        </div>
      </div>
    </div>
  );
}
