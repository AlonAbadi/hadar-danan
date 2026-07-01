import type { Metadata } from "next";
import { SuccessPage } from "@/components/SuccessPage";

export const metadata: Metadata = {
  title: "ברוכה הבאה לכוורת האות | beegood",
  robots: { index: false },
};

export default function SignalHiveSuccess() {
  return (
    <SuccessPage
      productName="כוורת האות"
      emoji="🐝"
      confirmationTitle="נכנסת לכוורת האות"
      confirmationDesc="התשלום התקבל והגישה נפתחה. עכשיו מתחילים להוציא את האות שלך לעולם — כל הפולדרים מחכים לך באזור כוורת האות."
      nextStepLabel="לכניסה לכוורת האות ←"
      nextStepHref="/hive/signal-kit"
      nextStepDesc="הלוח, האתגר, ערכת התוכן, הוויזואל והבמאית — הכל נגזר מהאות שלך."
      whatsappPhone={process.env.NEXT_PUBLIC_WHATSAPP_PHONE}
      trackingProduct="signal_hive_590"
      trackingValue={590}
    />
  );
}
