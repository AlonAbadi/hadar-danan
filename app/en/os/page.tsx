// The BeeGood OS product was retired for the English funnel. The English offer
// is now the strategy session (and, for top-tier leads, the premium shoot day).
// Any existing /en/os link lands on the strategy session instead of 404-ing.
import { redirect } from "next/navigation";

export default function EnOsPage() {
  redirect("/en/strategy");
}
