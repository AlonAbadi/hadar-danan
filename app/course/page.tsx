import type { Metadata } from "next";
import { AbandonCheckoutPopup } from "@/components/landing/AbandonCheckoutPopup";
import { CourseLandingClient } from "./CourseLandingClient";
import { getUserCredit } from "@/lib/credit";

export const metadata: Metadata = {
  title: "קורס בידול מותג אישי - 8 מודולים | הדר דנן",
  description: "8 מודולים. 16 שיעורים. שיטה שעברו דרכה 3,500+ עסקים. 1,800 שקל - גישה לנצח.",
  alternates: { canonical: "/course" },
};

export default async function CoursePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  const whatsappPhone  = process.env.WHATSAPP_PHONE ?? "972539566961";
  const credit         = email ? await getUserCredit(email) : 0;

  return (
    <>
      <AbandonCheckoutPopup product="course_1800" />
      <CourseLandingClient credit={credit} whatsappPhone={whatsappPhone} email={email} />
    </>
  );
}
