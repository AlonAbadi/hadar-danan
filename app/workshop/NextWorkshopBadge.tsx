"use client";

import { useEffect, useState } from "react";
import { getNextWorkshopDate, formatHebrew } from "@/lib/products";

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 86_400_000));
}

export function NextWorkshopBadge() {
  const [nextDate, setNextDate] = useState<string | null>(null);
  const [days, setDays]         = useState(0);

  useEffect(() => {
    const d = getNextWorkshopDate();
    if (d) {
      setNextDate(d);
      setDays(getDaysUntil(d));
    }
  }, []);

  if (!nextDate) return null;

  return (
    <div
      className="self-start inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
      style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)", color: "#C9964A" }}
    >
      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#C9964A" }} />
      {days === 0
        ? "הסדנה היום!"
        : days === 1
        ? "הסדנה מחר!"
        : `הסדנה ב-${formatHebrew(nextDate)} · נותרו ${days} ימים`}
    </div>
  );
}
