"use client";

import { useEffect } from "react";
import { trackViewContent } from "@/lib/analytics";

export function ViewContentTracker({ product, value }: { product: string; value: number }) {
  useEffect(() => {
    trackViewContent(product, value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
