import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "ברוך הבא! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function StrategySuccessPage() {
  return (
    <Suspense>
    <SuccessPage
      productName="פגישת אסטרטגיה"
      emoji="🎯"
      confirmationTitle="התשלום התקבל!"
      confirmationDesc="קיבלנו את הרכישה שלך. אישור עם קישור ל-Zoom ישלח לאימייל תוך 24 שעות."
      nextStepLabel="חזור לדף הבית"
      nextStepHref="/"
      nextStepDesc="ממתינים לפגישה!"
      trackingProduct="strategy_4000"
      trackingValue={4000}
    />
    </Suspense>
  );
}
