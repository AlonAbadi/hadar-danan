import { SuccessPage } from "@/components/SuccessPage";

export default function SadnaSuccessPage() {
  return (
    <SuccessPage
      productName="סדנת פרימיום"
      emoji="✨"
      confirmationTitle="הרישום אושר — נתראה ב-20 במאי!"
      confirmationDesc="📍 רחוב החילזון 5, רמת גן · 17:00–20:00"
      step2Title="פרטי הגעה"
      nextStepLabel="חזרה לדף הבית"
      nextStepHref="/"
      nextStepDesc="נשמח לראותך בסדנה"
      trackingProduct="sadna_500"
      trackingValue={500}
    />
  );
}
