"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserStatus } from "@/lib/supabase/types";

export async function changeUserStatus(userId: string, status: UserStatus) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
}

export async function sendManualEmail(userId: string, templateKey: string) {
  const supabase = createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", userId)
    .single();

  if (!user) throw new Error("משתמש לא נמצא");

  const subjects: Record<string, string> = {
    welcome:                   "ברוכ/ה הבא/ה! ההדרכה החינמית מחכה לך",
    followup_24h:              "הצ׳אלנג׳ שיביא לך לקוחות - ₪197",
    challenge_access:          "הגישה שלך לצ׳אלנג׳ מוכנה",
    challenge_upsell_workshop: "מה השגת? + ההצעה הבאה שלך",
    workshop_confirmation:     "ההרשמה לסדנה אושרה",
    workshop_upsell_strategy:  "שבוע אחרי הסדנה - מה עכשיו?",
    reengagement:              "התגעגענו אליך",
    booking_confirmation:      "הפגישה שלך נקבעה",
    premium_lead_confirmation:  "קיבלנו את הבקשה - ניצור קשר תוך 24 שעות",
    partnership_confirmation:   "קיבלנו את הבקשה שלך - הדר תחזור אליך בקרוב",
  };

  await supabase.from("jobs").insert({
    type: "SEND_EMAIL",
    payload: {
      user_id:      userId,
      email:        user.email,
      name:         user.name ?? "",
      subject:      subjects[templateKey] ?? "הודעה מהדר דנן",
      template_key: templateKey,
    },
    run_at: new Date().toISOString(),
    status: "pending",
  });

  revalidatePath(`/admin/users/${userId}`);
}
