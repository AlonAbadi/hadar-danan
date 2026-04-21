import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "תשלום הטסט עבר! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function TestSuccessPage() {
  return (
    <Suspense>
    <SuccessPage
      productName="מוצר טסט"
      emoji="✅"
      confirmationTitle="תשלום הטסט עבר!"
      confirmationDesc="הכל עובד. זה היה רק בדיקה."
      nextStepLabel="חזרה לדף הבית"
      nextStepHref="/"
      nextStepDesc="הטסט הצליח"
      trackingProduct="test_1"
      trackingValue={1}
    />
    </Suspense>
  );
}
