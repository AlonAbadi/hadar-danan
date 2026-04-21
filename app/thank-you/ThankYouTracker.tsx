"use client";

import { useEffect } from "react";
import { trackCompleteRegistration } from "@/lib/analytics";

export function ThankYouTracker() {
  useEffect(() => {
    const key = "complete_reg_fired";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackCompleteRegistration();
  }, []);
  return null;
}
