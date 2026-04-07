import { redirect } from "next/navigation";

// /call has been superseded by /strategy
export default function CallPage() {
  redirect("/strategy");
}
