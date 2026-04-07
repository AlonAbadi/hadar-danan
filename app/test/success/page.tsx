import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "תשלום הטסט עבר! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function TestSuccessPage() {
  return (
    <SuccessPage
      productName="מוצר טסט"
      emoji="✅"
      confirmationTitle="תשלום הטסט עבר!"
      confirmationDesc="הכל עובד. זה היה רק בדיקה."
      nextStepLabel="חזרה לדף הבית"
      nextStepHref="/"
      nextStepDesc="הטסט הצליח"
    />
  );
}
