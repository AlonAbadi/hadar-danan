/**
 * Links a Supabase auth user to a CRM users row.
 *
 * Flow:
 * 1. Email exists in users table AND auth_id is null  → link the row
 * 2. Email exists AND auth_id already set             → already linked, return row
 * 3. Email not found                                  → create a new lead row
 */
import { createServerClient } from "@/lib/supabase/server";

export async function linkAuthUser(authId: string, email: string) {
  const supabase = createServerClient();

  // Lookup must be case-insensitive: Cardcom guests + signup forms preserve
  // the typed casing ("Foo@Gmail.com"), while OAuth providers (Google) hand
  // us a normalized lowercase address. A case-sensitive `.eq("email", email)`
  // missed those guest-buyer rows and silently inserted a duplicate empty
  // row that broke /account purchase visibility (Shulamit, 22/6).
  const normalized = email.toLowerCase().trim();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .ilike("email", normalized)
    .maybeSingle();

  if (existing) {
    if (!existing.auth_id) {
      const { data: updated } = await supabase
        .from("users")
        .update({ auth_id: authId, email: normalized, email_verified: true })
        .eq("id", existing.id)
        .select()
        .single();
      return updated;
    }
    return existing;
  }

  const { data: created } = await supabase
    .from("users")
    .insert({
      auth_id: authId,
      email:   normalized,
      status:  "lead",
      email_verified: true,
    })
    .select()
    .single();

  return created;
}
