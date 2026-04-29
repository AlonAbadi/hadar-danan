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
      confirmationDesc="קיבלנו את הרכישה שלך. ניצור איתך קשר תוך 24 שעות לתיאום מועד הפגישה."
      step2Title="ניצור קשר לתיאום"
      nextStepLabel="חזור לדף הבית"
      nextStepHref="/"
      nextStepDesc="נחזור אליך תוך 24 שעות לתיאום המועד"
      trackingProduct="strategy_4000"
      trackingValue={4000}
    />
    </Suspense>
  );
}
