import { redirect } from "next/navigation";

/**
 * The digital course was removed from the product lineup entirely
 * (Alon, 2026-07-22) — including access for past buyers. The current
 * lineup: אתגר, כוורת האות, סדנה, פגישה, יום צילום. Old buyers keep
 * their purchase record in /account; content access is closed.
 */
export default function CourseContentRedirect(): never {
  redirect("/account");
}
