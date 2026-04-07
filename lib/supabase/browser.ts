/**
 * Browser-side Supabase client using @supabase/ssr.
 * Handles session cookies automatically. Safe to import in Client Components.
 */
import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

let client: ReturnType<typeof createSSRBrowserClient<Database>> | null = null;

export function createBrowserClient() {
  if (client) return client;
  client = createSSRBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
