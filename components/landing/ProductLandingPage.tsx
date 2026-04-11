'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';

// ── Design tokens ──────────────────────────────────────────────
const BG         = '#080C14';
const CARD       = '#141820';
const CARD_SOFT  = '#1D2430';
const BORDER     = '#2C323E';
const GOLD       = '#C9964A';
const GOLD_L     = '#E8B94A';
const GOLD_D     = '#9E7C3A';
const FG         = '#EDE9E1';
const FG_M       = '#9E9990';
const RED_BG     = 'rgba(224,85,85,0.07)';
const RED_BORDER = 'rgba(224,85,85,0.18)';
const RED_TEXT   = '#E05555';
const GREEN_BG   = 'rgba(76,175,130,0.07)';
const GREEN_BDR  = 'rgba(76,175,130,0.18)';
const GREEN_TEXT = '#4CAF82';

// ── Types ──────────────────────────────────────────────────────
export interface ProductLandingPageProps {
  productName:   string;
  price:         number;
  originalPrice?: number;
  checkoutHref:  string;

  headline:   React.ReactNode;
  heroSub?:   string;
  vslVideoId?: string;
  stats?:     { val: string; label: string }[];
  heroExtra?: React.ReactNode;

  problemItems:  { icon: string; text: React.ReactNode }[];
  agitationText?: React.ReactNode;

  solutionTitle: React.ReactNode;
  solutionDesc?: string;
  solutionItems: { num: string; title: string; desc: string }[];

  notForItems: string[];
  forItems:    string[];

  whoName:     string;
  whoRole:     string;
  whoText:     React.ReactNode;
  whoPhotoSrc?: string;

  proofStats?:  { val: string; label: string }[];
  testimonials: { text: React.ReactNode; author: string; role: string; photoSrc?: string }[];
  logoSrcs?:    string[];

  anchorItems?: { val: string; label: string }[];
  anchorTotal?: string;

  questions?:      { q: string; options: string[] }[];
  resultMessages?: Record<string, string>;
  hideMicroCommitment?: boolean;

  creditNote?: string;

  definitionBlock?: string;

  faqs: { q: string; a: string }[];
  faqSectionTitle?: string;

  finalTitle: React.ReactNode;
  finalSub?:  string;

  whatsappNumber?: string;

  ctaSlot?:          React.ReactNode;
  priceSectionSlot?: React.ReactNode;
  bottomSlot?:       React.ReactNode;
}

// ── Helpers ────────────────────────────────────────────────────
function Stars() {
  return <span style={{ color: GOLD_L, letterSpacing: '2px', fontSize: 15 }}>★★★★★</span>;
}

function PhotoPlaceholder({ size = 80 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px dashed rgba(201,150,74,0.4)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: GOLD, fontSize: size * 0.38, flexShrink: 0, opacity: 0.7,
    }}>👤</div>
  );
}

function VSL({ videoId, productName }: { videoId?: string; productName: string }) {
  if (!videoId) {
    return (
      <div style={{ maxWidth: 240, margin: '0 auto', position: 'relative' }}>
        <div style={{
          aspectRatio: '9/16', background: CARD, borderRadius: 16,
          border: `2px dashed rgba(201,150,74,0.3)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Gold play button */}
          <div style={{
            width: 56, height: 56,
            background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD}, ${GOLD_D})`,
            borderRadius: '50%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 20, color: '#1A1206',
          }}>▶</div>
          {/* REELS badge */}
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD_D})`,
            color: '#1A1206', fontSize: 10, fontWeight: 800,
            padding: '3px 10px', borderRadius: 20, letterSpacing: '1.5px',
          }}>REELS</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 240, margin: '0 auto', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2,
        background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD_D})`,
        color: '#1A1206', fontSize: 10, fontWeight: 800,
        padding: '3px 10px', borderRadius: 20, letterSpacing: '1.5px',
      }}>REELS</div>
      <div style={{ aspectRatio: '9/16', borderRadius: 16, overflow: 'hidden' }}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0&cc=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; fullscreen"
          title={productName}
        />
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M12 2L3 7v6c0 5.25 3.75 10.15 9 11.25C17.25 23.15 21 18.25 21 13V7l-9-5z"
        fill={GOLD} fillOpacity={0.15} stroke={GOLD} strokeWidth="1.5" />
      <path d="M9 12l2 2 4-4" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Module accordion item ──────────────────────────────────────
function ModuleItem({ item, isOpen, onToggle }: {
  item: { num: string; title: string; desc: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{
      background: CARD, borderRadius: 12, overflow: 'hidden',
      border: `1px solid ${isOpen ? GOLD : BORDER}`,
      marginBottom: 8, transition: 'border-color 0.2s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 18px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'right', color: FG,
        }}
      >
        <span style={{
          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD_D})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 14, color: '#1A1206',
        }}>{item.num}</span>
        <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{item.title}</span>
        <span style={{
          color: GOLD, fontSize: 20, flexShrink: 0,
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(45deg)' : 'none',
          display: 'inline-block',
        }}>+</span>
      </button>
      <div
        ref={bodyRef}
        style={{
          maxHeight: isOpen ? 300 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          padding: isOpen ? '0 18px 16px 18px' : '0 18px',
          paddingRight: 66,
          color: FG_M, fontSize: 14, lineHeight: 1.7,
        }}
      >
        {item.desc}
      </div>
    </div>
  );
}

// ── FAQ item ───────────────────────────────────────────────────
function FaqItem({ faq, isOpen, onToggle }: {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      background: CARD, borderRadius: 12,
      border: `1px solid ${isOpen ? GOLD : BORDER}`,
      overflow: 'hidden', marginBottom: 8, transition: 'border-color 0.2s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '15px 18px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'right', color: FG, fontSize: 15, fontWeight: 600,
        }}
      >
        <span>{faq.q}</span>
        <span style={{
          color: GOLD, fontSize: 20, flexShrink: 0, marginRight: 10,
          transition: 'transform 0.2s', display: 'inline-block',
          transform: isOpen ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </button>
      <div style={{
        maxHeight: isOpen ? 300 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
        padding: isOpen ? '0 18px 14px' : '0 18px',
        color: FG_M, fontSize: 14, lineHeight: 1.7,
      }}>
        {faq.a}
      </div>
    </div>
  );
}

// ── Micro-commitment ───────────────────────────────────────────
type MicroStep = 'questions' | 'result' | 'direct';

function MicroCommitment({
  questions,
  resultMessages,
  checkoutHref,
  ctaSlot,
  price,
  originalPrice,
  productName,
  creditNote,
  whatsappHref,
  displayPrice,
  dailyPrice,
}: {
  questions: { q: string; options: string[] }[];
  resultMessages: Record<string, string>;
  checkoutHref: string;
  ctaSlot?: React.ReactNode;
  price: number;
  originalPrice?: number;
  productName: string;
  creditNote?: string;
  whatsappHref: string;
  displayPrice: string;
  dailyPrice: string;
}) {
  const [phase, setPhase] = useState<MicroStep>('questions');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const progress = phase === 'questions'
    ? Math.round((qIdx + 1) / (questions.length + 1) * 100)
    : 100;

  const resultMsg = useMemo(() => {
    for (const [key, msg] of Object.entries(resultMessages)) {
      if (Object.values(answers).some((a: string) => a.includes(key))) return msg;
    }
    return Object.values(resultMessages)[0] ?? '';
  }, [answers, resultMessages]);

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = { ...answers, [qIdx]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    if (qIdx + 1 >= questions.length) {
      setPhase('result');
      setTimeout(() => setPhase('direct'), 2500);
    } else {
      setQIdx(q => q + 1);
    }
  };

  const skipToCheckout = () => setPhase('direct');

  const currentQ = questions[qIdx];

  return (
    <div style={{ maxWidth: 540, margin: '0 auto' }}>
      {/* Progress bar - always visible */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: FG_M, marginBottom: 6 }}>
          {phase === 'questions' && <span>שאלה {qIdx + 1} מתוך {questions.length}</span>}
          {phase === 'result' && <span>מעבד תוצאות...</span>}
          {phase === 'direct' && <span>מוכן/ת להצטרף?</span>}
          <span>{progress}%</span>
        </div>
        <div style={{ height: 5, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${GOLD_L}, ${GOLD_D})`,
            borderRadius: 3, transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Questions */}
      {phase === 'questions' && currentQ && (
        <>
          <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 16, color: FG, lineHeight: 1.4 }}>
            {currentQ.q}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: currentQ.options.length > 2 ? '1fr 1fr' : '1fr',
            gap: 9, marginBottom: 16,
          }}>
            {currentQ.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelected(opt)}
                style={{
                  background: selected === opt ? `rgba(201,150,74,0.12)` : CARD,
                  border: `1px solid ${selected === opt ? GOLD : BORDER}`,
                  borderRadius: 10, padding: '12px 14px', color: FG, fontSize: 14,
                  cursor: 'pointer', textAlign: 'center',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {/* המשך button - hidden until option selected */}
          <button
            onClick={handleNext}
            disabled={!selected}
            style={{
              display: selected ? 'block' : 'none',
              width: '100%', padding: '13px',
              background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD}, ${GOLD_D})`,
              color: '#1A1206', fontWeight: 800, fontSize: 16,
              border: 'none', borderRadius: 10, cursor: 'pointer', marginBottom: 8,
            }}
          >
            המשך
          </button>
          <button
            onClick={skipToCheckout}
            style={{
              background: 'none', border: 'none', color: FG_M,
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
              display: 'block', margin: '8px auto 0',
            }}
          >
            דלג על השאלות
          </button>
        </>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>✨</div>
          <p style={{ fontSize: 17, color: FG, lineHeight: 1.6 }}>{resultMsg}</p>
          <div style={{ marginTop: 16, color: FG_M, fontSize: 14 }}>מכין/ה את ההצעה המתאימה לך...</div>
        </div>
      )}

      {/* Price card */}
      {phase === 'direct' && (
        <PriceCard
          price={price}
          originalPrice={originalPrice}
          displayPrice={displayPrice}
          dailyPrice={dailyPrice}
          productName={productName}
          creditNote={creditNote}
          checkoutHref={checkoutHref}
          ctaSlot={ctaSlot}
          whatsappHref={whatsappHref}
        />
      )}
    </div>
  );
}

// ── Price card (shared) ────────────────────────────────────────
function PriceCard({
  price, originalPrice, displayPrice, dailyPrice, productName,
  creditNote, checkoutHref, ctaSlot, whatsappHref,
}: {
  price: number; originalPrice?: number; displayPrice: string; dailyPrice: string;
  productName: string; creditNote?: string; checkoutHref: string;
  ctaSlot?: React.ReactNode; whatsappHref: string;
}) {
  return (
    <div style={{
      background: CARD, borderRadius: 18,
      border: `1px solid ${GOLD}`, padding: '30px 26px', textAlign: 'center',
      boxShadow: `0 0 60px rgba(201,150,74,0.1)`,
    }}>
      <div style={{
        fontSize: 68, fontWeight: 900, lineHeight: 1, direction: 'ltr', marginBottom: 6,
        background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD_D})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{displayPrice}</div>
      {originalPrice && (
        <div style={{ fontSize: 16, textDecoration: 'line-through', color: FG_M, marginBottom: 4 }}>
          ₪{originalPrice.toLocaleString('he-IL')}
        </div>
      )}
      {price > 0 && (
        <div style={{ color: FG_M, fontSize: 13, marginBottom: 22 }}>
          פחות מ-₪{dailyPrice} ליום לאורך שנה
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24, textAlign: 'right' }}>
        {[`גישה מיידית ל${productName}`, 'תמיכה ישירה מהדר', 'ערבות - תוצאות או כסף חזרה'].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 14, color: FG }}>
            <span style={{ color: GREEN_TEXT, flexShrink: 0, fontSize: 16 }}>✓</span>
            {item}
          </div>
        ))}
      </div>

      {ctaSlot ?? (
        <a href={checkoutHref} className="btn-cta-gold" style={{
          display: 'block', padding: '15px', borderRadius: 10,
          fontWeight: 800, fontSize: 17, textDecoration: 'none', textAlign: 'center',
        }}>
          {price === 0 ? 'צפה עכשיו חינם' : 'להצטרפות עכשיו'}
        </a>
      )}

      <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        marginTop: 14, color: FG_M, fontSize: 13, textDecoration: 'none',
      }}>
        <span style={{ fontSize: 16 }}>💬</span>
        שאלה לפני הרכישה? כתוב/י בוואטסאפ
      </a>

      <div style={{
        marginTop: 18, padding: '12px 14px', background: CARD_SOFT,
        borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'right',
      }}>
        <ShieldIcon />
        <span style={{ fontSize: 12, color: FG_M, lineHeight: 1.5 }}>
          ערבות מלאה - לא מרוצה? קבל/י החזר מלא תוך 14 ימים, ללא שאלות
        </span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 18, opacity: 0.45 }}>
        {['🔒 תשלום מאובטח', '✓ Cardcom', '🛡 SSL'].map((b, i) => (
          <span key={i} style={{ fontSize: 11, color: FG_M }}>{b}</span>
        ))}
      </div>

      {creditNote && (
        <p style={{ textAlign: 'center', fontSize: 12, color: `rgba(201,150,74,0.75)`, marginTop: 14, lineHeight: 1.5 }}>
          {creditNote}
        </p>
      )}
    </div>
  );
}

// ── Layout helpers ─────────────────────────────────────────────
function Sec({ children, bg, id, style }: { children: React.ReactNode; bg?: string; id?: string; style?: React.CSSProperties }) {
  return (
    <section id={id} style={{ background: bg ?? BG, padding: '64px 20px', ...style }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

function SecTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <h2 style={{ fontSize: 'clamp(20px,5vw,30px)', fontWeight: 800, color: FG, lineHeight: 1.3, margin: 0 }}>
        {children}
      </h2>
      {sub && <p style={{ marginTop: 10, color: FG_M, fontSize: 16, margin: '10px 0 0' }}>{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function ProductLandingPage({
  productName, price, originalPrice, checkoutHref,
  headline, heroSub, vslVideoId, stats, heroExtra,
  problemItems, agitationText,
  solutionTitle, solutionDesc, solutionItems,
  notForItems, forItems,
  whoName, whoRole, whoText, whoPhotoSrc,
  proofStats, testimonials, logoSrcs,
  anchorItems, anchorTotal,
  questions = [], resultMessages = {}, hideMicroCommitment,
  creditNote,
  definitionBlock,
  faqs,
  faqSectionTitle,
  finalTitle, finalSub,
  whatsappNumber,
  ctaSlot, priceSectionSlot, bottomSlot,
}: ProductLandingPageProps) {

  const [stickyVisible, setStickyVisible] = useState(false);
  const [openFaq,  setOpenFaq]  = useState<number | null>(null);
  const [openSol,  setOpenSol]  = useState<number | null>(0);

  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const finalCtaRef   = useRef<HTMLDivElement>(null);

  // Sticky bar - show after 400px scroll, hide when CTA is in viewport
  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > 400;
      if (!past) { setStickyVisible(false); return; }

      const isInView = (el: HTMLElement | null) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      };

      const ctaVisible = isInView(ctaSectionRef.current) || isInView(finalCtaRef.current);
      setStickyVisible(!ctaVisible);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const wa = whatsappNumber ?? process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? '972539566961';
  const waHref = `https://wa.me/${wa}`;

  const showPriceCard  = price > 0 && !priceSectionSlot;
  const showMicro      = showPriceCard && !hideMicroCommitment && questions.length > 0;
  const dailyPrice     = (price / 365).toFixed(0);
  const displayPrice   = price === 0 ? 'חינם' : `₪${price.toLocaleString('he-IL')}`;

  const ctaLabel = price === 0
    ? 'צפה עכשיו חינם'
    : `להצטרפות - ${displayPrice}`;

  const scrollToCTA = () => {
    const el = document.getElementById('cta');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div dir="rtl" className="font-assistant" style={{ background: BG, color: FG, minHeight: '100vh' }}>

      {/* ── Sticky bar (BOTTOM) ──────────────────────────────────── */}
      <div className={`lp-sticky${stickyVisible ? ' visible' : ''}`}>
        <div className="lp-sticky-text">
          <strong>{productName}</strong>
          {price > 0 && <><br />{displayPrice} - גישה מיידית</>}
        </div>
        <button onClick={scrollToCTA} className="lp-sticky-cta">
          {price === 0 ? 'הצטרף/י חינם' : 'לרכישה'}
        </button>
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="hero-section">
        {heroExtra && <div style={{ marginBottom: 16 }}>{heroExtra}</div>}

        <h1 className="hero-hook">{headline}</h1>

        <div className="vsl-wrap">
          <VSL videoId={vslVideoId} productName={productName} />
        </div>

        <div style={{ textAlign: 'center' }}>
          {ctaSlot ? (
            <div style={{ marginBottom: 10 }}>{ctaSlot}</div>
          ) : (
            <a href={checkoutHref} className="hero-cta">{ctaLabel}</a>
          )}
        </div>

        {heroSub && <div className="hero-note">{heroSub}</div>}

        {stats && stats.length > 0 && (
          <div className="stats-strip">
            <div className="hero-eyebrow">{productName}</div>
            <div className="hero-stats">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Definition block (AI-extractable) ──────────────────── */}
      {definitionBlock && (
        <div style={{ background: CARD, borderTop: `1px solid ${BORDER}`, padding: '28px 20px' }}>
          <p style={{ maxWidth: 680, margin: '0 auto', color: FG_M, fontSize: 16, lineHeight: 1.8, textAlign: 'center' }}>
            {definitionBlock}
          </p>
        </div>
      )}

      {/* ── Problem ─────────────────────────────────────────────── */}
      {problemItems.length > 0 && (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">הבעיה</div>
            <h2 className="lp-section-title">למה רוב הניסיונות לא עובדים</h2>
            <div className="problem-list">
              {problemItems.map((item, i) => (
                <div key={i} className="problem-item">
                  <div className="problem-icon">{item.icon}</div>
                  <div className="problem-text">{item.text}</div>
                </div>
              ))}
            </div>
            {agitationText && (
              <div className="lp-agitation">
                <div className="lp-agitation-title">שים לב</div>
                <div className="lp-agitation-text">{agitationText}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Solution accordion ──────────────────────────────────── */}
      {solutionItems.length > 0 && (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">הפתרון</div>
            <h2 className="lp-section-title">{solutionTitle}</h2>
            {solutionDesc && <p className="lp-section-desc">{solutionDesc}</p>}
            <div className="modules-list">
              {solutionItems.map((item, i) => (
                <div
                  key={i}
                  className={`module-acc${openSol === i ? ' open' : ''}`}
                  onClick={() => setOpenSol(openSol === i ? null : i)}
                >
                  <button className="module-acc-btn">
                    <div className="module-acc-left">
                      <span className="module-num-badge">{item.num}</span>
                      <span className="module-acc-title">{item.title}</span>
                    </div>
                    <span className="module-acc-icon">+</span>
                  </button>
                  <div className="module-acc-body">
                    <div className="module-acc-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Not for everyone ────────────────────────────────────── */}
      {(notForItems.length > 0 || forItems.length > 0) && (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="nfe-box">
              <div className="nfe-box-title">זה לא בשביל כולם.</div>
              <div className="nfe-grid">
                <div>
                  <div className="nfe-col-title red">לא מתאים אם</div>
                  {notForItems.map((item, i) => (
                    <div key={i} className="nfe-item"><span>✗</span><span>{item}</span></div>
                  ))}
                </div>
                <div>
                  <div className="nfe-col-title green">מתאים אם</div>
                  {forItems.map((item, i) => (
                    <div key={i} className="nfe-item"><span>✓</span><span>{item}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Who ─────────────────────────────────────────────────── */}
      <div className="lp-divider" />
      <div className="lp-section">
        <div className="lp-eyebrow">מי מלמד/ת</div>
        <div className="hadar-box">
          <div className="hadar-photo-wrap">
            {whoPhotoSrc
              ? <img src={whoPhotoSrc} alt={whoName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Image src="/hadarprotrait.png" alt="הדר דנן" width={200} height={200} style={{ width: 110, height: 110, objectFit: 'contain', display: 'block', flexShrink: 0 }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div className="hadar-name">{whoName}</div>
            <div className="hadar-role">{whoRole}</div>
            <div className="hadar-text">{whoText}</div>
          </div>
        </div>
      </div>

      {/* ── Proof / Testimonials ────────────────────────────────── */}
      {testimonials.length > 0 && (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">הוכחה</div>
            <h2 className="lp-section-title">מה אומרים לאחר ההצטרפות</h2>
            {proofStats && proofStats.length > 0 && (
              <div className="proof-grid">
                {proofStats.map((s, i) => (
                  <div key={i} className="proof-card">
                    <div className="proof-val">{s.val}</div>
                    <div className="proof-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="testimonials-list">
              {testimonials.map((t, i) => (
                <div key={i} className="testimonial-card">
                  <Stars />
                  <div className="testimonial-text">&quot;{t.text}&quot;</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {t.photoSrc
                      ? <img src={t.photoSrc} alt={t.author} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <PhotoPlaceholder size={34} />
                    }
                    <div>
                      <div className="testimonial-author">{t.author}</div>
                      <div className="testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {logoSrcs && logoSrcs.length > 0 && (
              <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', opacity: 0.45 }}>
                {logoSrcs.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ height: 30, objectFit: 'contain' }} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Anchor block ────────────────────────────────────────── */}
      {anchorItems && anchorItems.length > 0 && (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">ההשוואה</div>
            <h2 className="lp-section-title">כמה עולה לך לא לפתור את זה?</h2>
            <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              <div style={{ background: RED_BG, padding: '22px 24px', borderBottom: `1px solid ${RED_BORDER}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: RED_TEXT, marginBottom: 14 }}>האלטרנטיבות עולות</div>
                {anchorItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: FG_M, marginBottom: 8 }}>
                    <span>{item.label}</span>
                    <span style={{ color: RED_TEXT, fontWeight: 600, direction: 'ltr' }}>{item.val}</span>
                  </div>
                ))}
                {anchorTotal && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${RED_BORDER}` }}>
                    <span style={{ color: FG }}>סה&quot;כ</span>
                    <span style={{ color: RED_TEXT, direction: 'ltr' }}>{anchorTotal}</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 24px', background: CARD, textAlign: 'center', fontWeight: 700, color: FG_M, fontSize: 15 }}>או</div>
              <div style={{ background: GREEN_BG, padding: '22px 24px', borderTop: `1px solid ${GREEN_BDR}` }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: GREEN_TEXT, marginBottom: 8 }}>{productName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: FG_M, fontSize: 14 }}>השקעה חד-פעמית</span>
                  <span style={{ fontSize: 28, fontWeight: 900, direction: 'ltr', background: `linear-gradient(135deg, ${GOLD_L}, ${GOLD_D})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{displayPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Price section / Micro-commitment ────────────────────── */}
      <div id="cta" ref={ctaSectionRef} />
      {priceSectionSlot ? (
        <div>{priceSectionSlot}</div>
      ) : showMicro ? (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">ההשקעה</div>
            <MicroCommitment
              questions={questions}
              resultMessages={resultMessages}
              checkoutHref={checkoutHref}
              ctaSlot={ctaSlot}
              price={price}
              originalPrice={originalPrice}
              productName={productName}
              creditNote={creditNote}
              whatsappHref={waHref}
              displayPrice={displayPrice}
              dailyPrice={dailyPrice}
            />
          </div>
        </>
      ) : showPriceCard ? (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">ההשקעה</div>
            <PriceCard
              price={price}
              originalPrice={originalPrice}
              displayPrice={displayPrice}
              dailyPrice={dailyPrice}
              productName={productName}
              creditNote={creditNote}
              checkoutHref={checkoutHref}
              ctaSlot={ctaSlot}
              whatsappHref={waHref}
            />
          </div>
        </>
      ) : null}

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <>
          <div className="lp-divider" />
          <div className="lp-section">
            <div className="lp-eyebrow">שאלות ותשובות</div>
            <h2 className="lp-section-title">{faqSectionTitle ?? 'שאלות נפוצות'}</h2>
            <div className="faq-items">
              {faqs.map((faq, i) => (
                <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <div className="lp-final">
        <div ref={finalCtaRef} style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="lp-final-title">{finalTitle}</div>
          {finalSub && <div className="lp-final-sub">{finalSub}</div>}
          {ctaSlot ?? (
            <a href={checkoutHref} className="lp-cta-btn" style={{ maxWidth: 380, margin: '0 auto 10px', display: 'block' }}>
              {price === 0 ? 'צפה עכשיו חינם' : `מצטרף/ת - ${displayPrice}`}
            </a>
          )}
        </div>
      </div>

      {/* ── Bottom slot ─────────────────────────────────────────── */}
      {bottomSlot && <div>{bottomSlot}</div>}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="lp-footer">
        <div className="lp-footer-logo">הדר דנן</div>
        <div className="lp-footer-signal">
          אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr">TrueSignal©</span>
        </div>
        <div className="lp-footer-links">
          <a href="/terms">תנאי שימוש</a>
          <a href="/privacy">מדיניות פרטיות</a>
          <a href="/hive/terms">תנאי מנוי הכוורת</a>
          <a href="/accessibility">נגישות</a>
        </div>
        <div className="lp-footer-company">
          © 2026 הדר דנן בע״מ | ח.פ. 516791555
        </div>
        <div className="lp-footer-company">
          החילזון 5, רמת גן | 053-9566961
        </div>
      </div>
    </div>
  );
}
