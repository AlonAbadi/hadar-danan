import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";
import { getNextWorkshopDate, formatHebrew } from "@/lib/products";

export default function SadnaSuccessPage() {
  const next       = getNextWorkshopDate();
  const dateHebrew = next ? formatHebrew(next) : "המועד הבא";
  return (
    <Suspense>
    <SuccessPage
      productName="סדנת פרימיום"
      emoji="✨"
      confirmationTitle={`הרישום אושר — נתראה ב-${dateHebrew}!`}
      confirmationDesc="📍 רחוב החילזון 5, רמת גן · 17:00–20:00"
      step2Title="פרטי הגעה"
      nextStepLabel="חזרה לדף הבית"
      nextStepHref="/"
      nextStepDesc="נשמח לראותך בסדנה"
      trackingProduct="sadna_500"
      trackingValue={500}
      showApplyRail
    />
    </Suspense>
  );
}
