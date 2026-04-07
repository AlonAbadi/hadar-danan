import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "נרשמת לסדנה! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function WorkshopSuccessPage() {
  return (
    <SuccessPage
      productName="סדנה יום אחד"
      emoji="⚡"
      confirmationTitle="נרשמת לסדנה!"
      confirmationDesc="קיבלנו את הרשמתך. ניצור איתך קשר בקרוב לתיאום התאריך."
      nextStepLabel="קבע תאריך לסדנה"
      nextStepHref="/strategy/book"
      nextStepDesc="בחר תאריך שמתאים לך מהיומן"
    />
  );
}
