"use client";

import { useTransition, useState } from "react";
import { changeUserStatus, sendManualEmail } from "./actions";
import type { UserStatus } from "@/lib/supabase/types";

const STATUSES: { value: UserStatus; label: string }[] = [
  { value: "lead",         label: "ליד" },
  { value: "engaged",      label: "מעורב" },
  { value: "high_intent",  label: "כוונה גבוהה" },
  { value: "buyer",        label: "קנה" },
  { value: "booked",       label: "הזמין שיחה" },
  { value: "premium_lead",     label: "ליד פרמיום" },
  { value: "partnership_lead", label: "ליד שותפות" },
];

const TEMPLATES = [
  { key: "welcome",                    label: "ברוכ/ה הבא/ה (welcome)" },
  { key: "followup_24h",               label: "פולואפ 24 שעות" },
  { key: "challenge_access",           label: "גישה לצ׳אלנג׳" },
  { key: "challenge_upsell_workshop",  label: "אפסל סדנה (יום 7)" },
  { key: "workshop_confirmation",      label: "אישור סדנה" },
  { key: "workshop_upsell_strategy",   label: "אפסל אסטרטגיה (שבוע 1)" },
  { key: "cart_abandon_1h",            label: "עגלה נטושה - 1 שעה" },
  { key: "cart_abandon_24h",           label: "עגלה נטושה + קופון - 24h" },
  { key: "reengagement",               label: "החזרת גולש לא פעיל" },
  { key: "booking_confirmation",       label: "אישור פגישה" },
  { key: "premium_lead_confirmation",  label: "אישור ליד פרמיום" },
  { key: "partnership_confirmation",   label: "אישור ליד שותפות" },
];

interface Props {
  userId:        string;
  currentStatus: UserStatus;
}

export function AdminUserActions({ userId, currentStatus }: Props) {
  const [pendingStatus, startStatusTransition] = useTransition();
  const [pendingEmail,  startEmailTransition]  = useTransition();
  const [selectedStatus,   setSelectedStatus]   = useState<UserStatus>(currentStatus);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].key);
  const [emailSent,        setEmailSent]         = useState(false);
  const [statusSaved,      setStatusSaved]       = useState(false);

  function handleStatusChange() {
    startStatusTransition(async () => {
      await changeUserStatus(userId, selectedStatus);
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 2000);
    });
  }

  function handleSendEmail() {
    startEmailTransition(async () => {
      await sendManualEmail(userId, selectedTemplate);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Change status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-sm text-gray-700">שינוי סטטוס</h3>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={handleStatusChange}
          disabled={pendingStatus || selectedStatus === currentStatus}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          {pendingStatus ? "שומר..." : statusSaved ? "✓ נשמר!" : "שמור סטטוס"}
        </button>
      </div>

      {/* Send manual email */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
        <h3 className="font-semibold text-sm text-gray-700">שליחת אימייל ידנית</h3>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={handleSendEmail}
          disabled={pendingEmail}
          className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition disabled:opacity-50"
        >
          {pendingEmail ? "מכניס לתור..." : emailSent ? "✓ נשלח לתור!" : "שלח אימייל"}
        </button>
        {emailSent && (
          <p className="text-xs text-green-600">האימייל נכנס לתור ויישלח תוך 5 דקות</p>
        )}
      </div>

    </div>
  );
}
