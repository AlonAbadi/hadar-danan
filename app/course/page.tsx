import type { Metadata } from "next";
import { CourseLandingClient } from "./CourseLandingClient";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "קורס בידול מותג אישי - 8 מודולים | הדר דנן",
  description: "8 מודולים. 16 שיעורים. שיטה שעברו דרכה 3,500+ עסקים. 1,800 שקל - גישה לנצח.",
  alternates: { canonical: "/course" },
};

const COURSE_FAQS = [
  { question: "לא בטוח שזה מתאים לתחום שלי",   answer: "הקורס עבר עם יותר מ-3,500 עסקים - רופאים, עורכי דין, מאמנים, יועצים, בעלי מקצוע. הבידול רלוונטי לכל מי שמוכר את עצמו ואת הידע שלו." },
  { question: "כמה זמן לוקח לסיים את הקורס?",   answer: '16 שיעורים של כחצי שעה - סה"כ כ-8 שעות. אפשר שיעור ביום ולסיים תוך שבועיים, או לרוץ על זה בסוף שבוע. הגישה שלך לנצח.' },
  { question: "ניסיתי קורסים בעבר ולא יצא לי כלום", answer: "רוב הקורסים נותנים תיאוריה. הקורס הזה בנוי על שיטה שהדר יישמה בשטח עם 3,500 עסקים - כל שיעור נגמר עם משימה אחת ברורה שמיישמים מיד." },
  { question: "מה קורה אם אני לא מרוצה?",       answer: "צור קשר ונטפל בזה. ערבות תוצאה - עברת את כל 8 המודולים ולא יצאת עם מסר ברור, נחזיר לך את הכסף." },
  { question: "האם הקורס מתעדכן?",              answer: "כן. כשהדר מוסיפה תכנים - אתה מקבל אותם ללא עלות נוספת. קנית פעם אחת, מרוויח לאורך זמן." },
];

export default async function CoursePage() {
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "972539566961";
  const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Course"
        name="קורס בידול מותג אישי - שיטת TrueSignal"
        description="8 מודולים, 16 שיעורים. שיטת TrueSignal של הדר דנן שעברו דרכה 3,500+ עסקים."
        url={`${APP_URL}/course`}
        price={1800}
        imageUrl={`${APP_URL}/coursehadar.png`}
      />
      <FAQSchema items={COURSE_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "קורס דיגיטלי", url: `${APP_URL}/course` },
      ]} />
      <p
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "28px 20px 0",
          color: "#9E9990",
          fontSize: 16,
          lineHeight: 1.8,
          textAlign: "center",
          fontFamily: "var(--font-assistant)",
        }}
      >
        קורס בידול מותג אישי הוא קורס דיגיטלי של 8 מודולים ו-16 שיעורים המבוסס על שיטת TrueSignal. הקורס מלמד בעלי עסקים לאתר את הבידול האמיתי שלהם, לבנות מסר שמוכר ולהפוך תוכן ללידים. 3,500+ עסקים כבר יישמו את השיטה. גישה לנצח, ₪1,800 תשלום חד-פעמי.
      </p>
      <CourseLandingClient credit={0} whatsappPhone={whatsappPhone} email="" />
    </>
  );
}
