import { redirect } from "next/navigation";

/**
 * The digital course was retired from the site 2026-07-11 (Alon).
 * We keep /course/content live for customers who already purchased, but
 * the public sales page no longer sits in the funnel — the equivalent
 * activation product is now /signal-hive (₪590). Redirect any lingering
 * inbound traffic (old links, search results, sitemaps) to it.
 */
export default function CourseSalesPageRedirect(): never {
  redirect("/signal-hive");
}
