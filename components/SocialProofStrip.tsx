'use client';

import { useState, useEffect } from 'react';
import { FEATURED_REVIEWS, AGGREGATE } from '@/data/reviews';

function GoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google">
      <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
    </svg>
  );
}

export default function SocialProofStrip() {
  const [idx, setIdx] = useState(0);

  // setTimeout + [idx] dependency: every manual click resets the 6-second countdown
  useEffect(() => {
    if (FEATURED_REVIEWS.length <= 1) return;
    const t = setTimeout(() => {
      setIdx((i) => (i + 1) % FEATURED_REVIEWS.length);
    }, 6000);
    return () => clearTimeout(t);
  }, [idx]);

  if (!FEATURED_REVIEWS || FEATURED_REVIEWS.length === 0) return null;

  const review = FEATURED_REVIEWS[idx];

  const prev = () => setIdx((i) => (i - 1 + FEATURED_REVIEWS.length) % FEATURED_REVIEWS.length);
  const next = () => setIdx((i) => (i + 1) % FEATURED_REVIEWS.length);

  return (
    <section
      className="w-full"
      style={{
        background: '#141820',
        borderTop: '1px solid rgba(201,150,74,0.18)',
        borderBottom: '1px solid rgba(201,150,74,0.18)',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-5 md:py-6">
        {/* Desktop: side-by-side | Mobile: stacked */}
        <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8">

          {/* LEFT — Aggregate block */}
          <div className="flex items-center gap-3 shrink-0 md:order-3 order-1">
            <GoogleG />
            <div className="flex items-center gap-1.5">
              <span className="text-[#E8B94A] text-base leading-none tracking-wider">★★★★★</span>
              <span className="text-[#EDE9E1] font-bold text-base">{AGGREGATE.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Divider — desktop only */}
          <div
            className="hidden md:block shrink-0 md:order-2 self-stretch"
            style={{ width: '1px', background: '#2C323E', minHeight: '48px' }}
          />

          {/* RIGHT — Rotating quote */}
          <div className="flex-1 flex items-center gap-2 min-w-0 md:order-1 order-2 w-full md:w-auto">

            {/* Next arrow (left side — RTL: next is on the left) */}
            <button
              onClick={next}
              aria-label="ביקורת הבאה"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg transition-colors"
              style={{
                border: '1px solid #2C323E',
                color: '#9E9990',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9964A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9E9990')}
            >
              &#8249;
            </button>

            {/* Quote body */}
            <div className="flex-1 min-w-0" dir="rtl" style={{ textAlign: 'right' }}>
              <p
                className="text-[#EDE9E1] text-sm leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textAlign: 'right',
                }}
              >
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #E8B94A, #9E7C3A)',
                    color: '#0D1018',
                  }}
                >
                  {review.initial}
                </div>
                <span className="text-[#EDE9E1] text-sm font-medium truncate">{review.name}</span>
              </div>
            </div>

            {/* Prev arrow (right side — RTL: prev is on the right) */}
            <button
              onClick={prev}
              aria-label="ביקורת קודמת"
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg transition-colors"
              style={{
                border: '1px solid #2C323E',
                color: '#9E9990',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9964A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9E9990')}
            >
              &#8250;
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}
