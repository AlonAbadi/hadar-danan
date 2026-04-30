'use client';

import { useCallback } from 'react';

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined') (window as unknown as Record<string, (...a: unknown[]) => void>).gtag?.(...args);
}

const PRODUCT_PATHS: Record<string, string> = {
  '/challenge':   'challenge',
  '/workshop':    'workshop',
  '/course':      'course',
  '/strategy':    'strategy',
  '/premium':     'premium',
  '/partnership': 'partnership',
  '/hive':        'hive',
};

export function TrainingProductTracker({ children }: { children: React.ReactNode }) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (!anchor) return;
    const path = new URL(anchor.href, window.location.origin).pathname;
    const product = PRODUCT_PATHS[path];
    if (product) {
      gtag('event', `training_click_${product}`);
    }
  }, []);

  return <div onClick={handleClick}>{children}</div>;
}
