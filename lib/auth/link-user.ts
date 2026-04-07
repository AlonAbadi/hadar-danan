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

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (!existing.auth_id) {
      const { data: updated } = await supabase
        .from("users")
        .update({ auth_id: authId, email_verified: true })
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
      email,
      status: "lead",
      email_verified: true,
    })
    .select()
    .single();

  return created;
}
