import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";
import { getNextWorkshopDate, formatHebrew } from "@/lib/products";

export const metadata = {
  title: "נרשמת לסדנה! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function WorkshopSuccessPage() {
  // Pull the next workshop date dynamically — the date floor in
  // lib/products.ts controls which month is "next" (currently 30.7.2026
  // after June was skipped).
  const next       = getNextWorkshopDate();
  const dateHebrew = next ? formatHebrew(next) : "המועד הבא";
  const yearPart   = next ? ` ${next.slice(0, 4)}` : "";

  return (
    <Suspense>
    <SuccessPage
      productName="סדנה יום אחד"
      emoji="⚡"
      confirmationTitle="הסדנה שלך נקבעה"
      confirmationDesc={`${dateHebrew}${yearPart} · יום חמישי · 10:00 · משרדי הדר דנן, רחוב החילזון 5, רמת גן`}
      step2Title="תכין את עצמך"
      nextStepDesc="חשוב על 3 לקוחות אידיאליים — מי הם, מה קיבלו ממך, ומה אמרו עליך"
      nextStepLabel="לאזור האישי"
      nextStepHref="/account"
      trackingProduct="workshop_1080"
      trackingValue={1080}
      showApplyRail
    />
    </Suspense>
  );
}
