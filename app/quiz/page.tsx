import type { Metadata } from "next";
import { QuizClient } from "./QuizClient";

export const metadata: Metadata = {
  title: "גלה את הצעד הנכון עבורך | הדר דנן",
  description: "6 שאלות. 2 דקות. תשובה מדויקת על הצעד הנכון לשיווק העסק שלך.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return <QuizClient />;
}
