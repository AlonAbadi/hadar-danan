"use client";

import { useEffect } from "react";
import { trackCompleteRegistration } from "@/lib/analytics";

export function ThankYouTracker() {
  useEffect(() => {
    const key = "complete_reg_fired";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    // event_id matches CAPI: "reg_{user_id}" stored after signup
    const userId = sessionStorage.getItem("last_signup_user_id") ?? undefined;
    trackCompleteRegistration(userId ? `reg_${userId}` : undefined);
  }, []);
  return null;
}
