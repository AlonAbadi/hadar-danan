import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "יום הצילום נקבע! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function PremiumSuccessPage() {
  return (
    <Suspense>
    <SuccessPage
      productName="יום צילום פרמיום"
      emoji="🎬"
      confirmationTitle="יום הצילום נקבע!"
      confirmationDesc="קיבלנו את הרכישה שלך. הצוות יצור קשר תוך 24 שעות לתיאום פרטי האסטרטגיה לפני הצילום."
      nextStepLabel="חזור לדף הבית"
      nextStepHref="/"
      nextStepDesc="מחכים ליום הגדול!"
      trackingProduct="premium_14000"
      trackingValue={14000}
    />
    </Suspense>
  );
}
