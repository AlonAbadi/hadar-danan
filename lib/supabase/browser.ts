/**
 * Browser-side Supabase client - uses the ANON key.
 * Safe to import in Client Components. RLS blocks all table access -
 * this client is only used for public-facing read operations if needed.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function createBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  client = createClient<Database>(url, key);
  return client;
}
