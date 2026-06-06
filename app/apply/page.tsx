import type { Metadata } from "next";
import { StageApplyClient } from "./StageApplyClient";

export const metadata: Metadata = {
  title: "3 ימים פתוחים — beegood × הדר דנן",
  description:
    "אנחנו לא מחפשים מושלמים. אנחנו מחפשים עסקים שמוכנים להעז את הצעד הבא באמת. ספר לנו מי אתה.",
  alternates: { canonical: "/apply" },
};

export default function ApplyPage() {
  return <StageApplyClient />;
}
