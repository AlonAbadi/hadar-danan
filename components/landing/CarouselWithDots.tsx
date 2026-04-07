"use client";

import { useRef, useState } from "react";

export function CarouselWithDots({
  children,
  count,
  rowClass,
}: {
  children: React.ReactNode;
  count: number;
  rowClass: string;
}) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const containerLeft = el.getBoundingClientRect().left;
    const items = Array.from(el.children) as HTMLElement[];
    let minDist = Infinity;
    let idx = 0;
    items.forEach((child, i) => {
      const dist = Math.abs(child.getBoundingClientRect().left - containerLeft);
      if (dist < minDist) { minDist = dist; idx = i; }
    });
    setActive(idx);
  };

  return (
    <div>
      <div ref={scrollRef} onScroll={handleScroll} className={rowClass}>
        {children}
      </div>
      <div className="carousel-dots">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: active === i ? 20 : 8,
              background: active === i ? "#C9964A" : "#ddd",
              borderRadius: 9999,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}
