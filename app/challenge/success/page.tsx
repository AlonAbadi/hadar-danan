import { Suspense } from "react";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "ברוך הבא לאתגר! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function ChallengeSuccessPage() {
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "";
  return (
    <Suspense>
    <SuccessPage
      productName="אתגר 7 הימים"
      emoji="🚀"
      confirmationTitle="ברוך הבא לאתגר!"
      confirmationDesc="אתה רשמית חלק מהאתגר. 7 ימים שישנו את הדרך שאתה משווק."
      nextStepLabel="הצטרף לקבוצת הווטסאפ"
      nextStepHref={whatsappPhone ? `https://wa.me/${whatsappPhone}` : "/"}
      nextStepDesc="כל התכנים, הפידבקים והקהילה - בקבוצה"
      whatsappPhone={whatsappPhone || undefined}
    />
    </Suspense>
  );
}
