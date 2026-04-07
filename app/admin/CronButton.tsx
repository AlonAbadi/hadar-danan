"use client";

import { useTransition, useState } from "react";
import { triggerCron } from "./actions";

export function CronButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult]        = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await triggerCron();
      setResult(res);
      setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition text-xs font-medium disabled:opacity-50"
    >
      {pending ? "מריץ..." : result ?? "הרץ cron עכשיו"}
    </button>
  );
}
