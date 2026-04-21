"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchase } from "@/lib/analytics";

export function PurchaseTracker({ product, value }: { product: string; value: number }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const key = `purchase_fired_${product}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const eventId = searchParams.get("oid") ?? undefined;
    trackPurchase(product, value, "ILS", eventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
