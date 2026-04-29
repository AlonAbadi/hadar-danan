import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "התשלום התקבל! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function PremiumSuccessPage() {
  return (
    <Suspense>
    <SuccessPage
      productName="יום צילום פרמיום"
      emoji="🎬"
      confirmationTitle="התשלום התקבל!"
      confirmationDesc="ניצור איתך קשר תוך 24 שעות לתיאום מועד יום הצילום."
      step2Title="ניצור קשר לתיאום"
      nextStepLabel="חזור לדף הבית"
      nextStepHref="/"
      nextStepDesc="נשמח לדבר איתך בקרוב!"
      trackingProduct="premium_14000"
      trackingValue={14000}
    />
    </Suspense>
  );
}
