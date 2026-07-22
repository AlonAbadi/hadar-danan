import { redirect } from "next/navigation";

/**
 * The digital course was removed from the product lineup entirely
 * (Alon, 2026-07-22). No new course purchases are possible; old
 * success-page bookmarks land in the personal area.
 */
export default function CourseSuccessRedirect(): never {
  redirect("/account");
}
