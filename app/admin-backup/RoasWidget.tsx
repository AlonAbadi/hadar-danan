"use client";

import { useEffect, useState } from "react";

export function RoasWidget({ revenueMonth }: { revenueMonth: number }) {
  const [adSpend, setAdSpend] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_ad_spend_month");
    if (saved) setAdSpend(saved);
  }, []);

  function handleChange(v: string) {
    setAdSpend(v);
    localStorage.setItem("admin_ad_spend_month", v);
  }

  const spend = parseFloat(adSpend.replace(/,/g, "")) || 0;
  const roas  = spend > 0 ? (revenueMonth / spend) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-3xl font-black text-gray-900">
          {roas != null ? `${roas.toFixed(2)}x` : "-"}
        </span>
        <span className="text-sm text-gray-500">ROAS (החודש)</span>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">הוצאות פרסום החודש (₪)</label>
        <input
          type="number"
          placeholder="0"
          value={adSpend}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          dir="ltr"
        />
      </div>

      {roas != null && roas > 1 && (
        <p className={`text-xs font-medium ${roas >= 3 ? "text-green-600" : roas >= 2 ? "text-yellow-600" : "text-red-500"}`}>
          {roas >= 3 ? "✅ ROAS טוב" : roas >= 2 ? "⚠️ ROAS בינוני" : "🔴 ROAS נמוך"}
        </p>
      )}
    </div>
  );
}
