/**
 * Creates a Supabase client configured for use in Next.js middleware.
 * Reads/writes cookies via the provided handlers so the session is
 * refreshed on every request without accessing the file system.
 */
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createMiddlewareClient({
  getCookies,
  setCookies,
}: {
  getCookies: () => Array<{ name: string; value: string }>;
  setCookies: (
    cookies: Array<{ name: string; value: string; options?: Record<string, unknown> }>
  ) => void;
}) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: getCookies,
        setAll: setCookies,
      },
    }
  );
}
