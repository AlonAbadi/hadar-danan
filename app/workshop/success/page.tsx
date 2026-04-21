import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "נרשמת לסדנה! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function WorkshopSuccessPage() {
  return (
    <Suspense>
    <SuccessPage
      productName="סדנה יום אחד"
      emoji="⚡"
      confirmationTitle="נרשמת לסדנה!"
      confirmationDesc="קיבלנו את הרשמתך. ניצור איתך קשר בקרוב לתיאום התאריך."
      nextStepLabel="קבע תאריך לסדנה"
      nextStepHref="/strategy/book"
      nextStepDesc="בחר תאריך שמתאים לך מהיומן"
      trackingProduct="workshop_1080"
      trackingValue={1080}
    />
    </Suspense>
  );
}
