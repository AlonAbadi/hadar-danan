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
      confirmationTitle="הסדנה שלך נקבעה"
      confirmationDesc="25 ביוני 2026 · יום חמישי · 10:00 · בית ציוני אמריקה, תל אביב"
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
