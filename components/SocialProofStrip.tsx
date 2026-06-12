'use client';

import { useState, useEffect } from 'react';
import { FEATURED_REVIEWS } from '@/data/reviews';

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
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-5 md:py-6">
        <div className="flex items-center gap-2 min-w-0">

          {/* Next arrow (left side — RTL: next is on the left) */}
          <button
            onClick={next}
            aria-label="ביקורת הבאה"
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg transition-colors"
            style={{
              border: '1px solid #2C323E',
              color: '#AAB0BD',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E8B94A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#AAB0BD')}
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
              color: '#AAB0BD',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E8B94A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#AAB0BD')}
          >
            &#8250;
          </button>

        </div>
      </div>
    </section>
  );
}
