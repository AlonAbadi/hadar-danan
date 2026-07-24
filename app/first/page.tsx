/**
 * /first — acquisition first-video experience (prototype).
 *
 * Gated to LAB_ALLOWED_EMAILS during validation. Once Alon approves the
 * output pattern, open to real prospects.
 */
import { redirect } from "next/navigation";
import { resolveLabUser } from "@/lib/lab/gate";
import { FirstClient } from "./FirstClient";

export const dynamic = "force-dynamic";

export default async function FirstPage() {
  const user = await resolveLabUser();
  if (!user) redirect("/");
  return <FirstClient userName={user.name} />;
}
