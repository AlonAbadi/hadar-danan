import { SuccessPage } from "@/components/SuccessPage";

export const metadata = {
  title: "גישה לקורס מוכנה! | הדר דנן",
  robots: { index: false, follow: false },
};

export default function CourseSuccessPage() {
  return (
    <SuccessPage
      productName="קורס דיגיטלי"
      emoji="🎓"
      confirmationTitle="גישה לקורס מוכנה!"
      confirmationDesc="16 שיעורים מחכים לך. התחל מתי שנוח לך."
      nextStepLabel="התחל את הקורס"
      nextStepHref="/course/content"
      nextStepDesc="כל השיעורים פתוחים - לך בקצב שלך"
      trackingProduct="course_1800"
      trackingValue={1800}
    />
  );
}
