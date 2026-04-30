'use client';

import { useEffect, useState } from 'react';
import { getQuizSession } from '@/lib/quiz-session';

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined') (window as unknown as Record<string, (...a: unknown[]) => void>).gtag?.(...args);
}

export function QuizCTABanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't completed the quiz
    if (!getQuizSession()) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: 680,
        margin: '0 auto',
        padding: '0 24px 48px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #1D2430, #141820)',
          border: '1px solid rgba(201,150,74,0.25)',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <p style={{ color: '#9E9990', fontSize: 13, marginBottom: 8 }}>
          לא בטוח מה הצעד הנכון הבא עבורך?
        </p>
        <p style={{ color: '#EDE9E1', fontSize: 17, fontWeight: 700, marginBottom: 20, lineHeight: 1.5 }}>
          6 שאלות — וקבל המלצה אישית למה מתאים לך
        </p>
        <a
          href="/quiz"
          onClick={() => gtag('event', 'training_quiz_cta_click')}
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)',
            color: '#1A1206',
            fontWeight: 800,
            fontSize: 15,
            borderRadius: 9999,
            padding: '13px 40px',
            textDecoration: 'none',
            boxShadow: '0 6px 20px rgba(201,150,74,0.25)',
          }}
        >
          לקוויז האבחון ←
        </a>
        <p style={{ color: '#9E9990', fontSize: 12, marginTop: 12 }}>
          2 דקות · ללא כרטיס אשראי
        </p>
      </div>
    </div>
  );
}
