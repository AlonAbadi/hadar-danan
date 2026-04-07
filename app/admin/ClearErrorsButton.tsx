"use client";

import { useTransition, useState } from "react";
import { clearOldErrors } from "./actions";

export function ClearErrorsButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult]        = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const res = await clearOldErrors();
      setResult(res);
      setTimeout(() => setResult(null), 4000);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-600 hover:bg-red-100 transition text-xs font-medium disabled:opacity-50"
    >
      {pending ? "מנקה..." : result ?? "נקה שגיאות ישנות"}
    </button>
  );
}
