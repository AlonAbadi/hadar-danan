import { z } from "zod";

// Israeli mobile: 05X-XXXXXXX - strip spaces/hyphens then validate
const israeliPhone = z
  .string()
  .refine(
    (v) => {
      const n = v.replace(/[\s-]/g, "");
      return /^05\d{8}$/.test(n) || /^\+9725\d{8}$/.test(n);
    },
    { message: "מספר טלפון ישראלי לא תקין (לדוגמה: 0501234567 או +972501234567)" }
  )
  .transform((v) => v.replace(/[\s-]/g, ""));

export const SignupSchema = z.object({
  name: z
    .string()
    .min(2, "שם חייב להכיל לפחות 2 תווים")
    .max(80, "שם ארוך מדי"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  phone: israeliPhone,
  ab_variant: z.enum(["A", "B"]).optional(),
  utm_source: z.string().max(100).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_adset: z.string().max(100).optional(),
  utm_ad: z.string().max(100).optional(),
  click_id: z.string().max(200).optional(),
  anonymous_id:       z.string().uuid().optional(),
  marketing_consent:  z.boolean().optional().default(false),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const EventSchema = z.object({
  type: z.string().min(1).max(100),
  anonymous_id: z.string().optional(),
  user_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type EventInput = z.infer<typeof EventSchema>;
