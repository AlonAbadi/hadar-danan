"use client";

import { useTransition, useState } from "react";
import { changeUserStatus, sendManualEmail } from "./actions";
import type { UserStatus } from "@/lib/supabase/types";

const STATUSES: { value: UserStatus; label: string }[] = [
  { value: "lead",             label: "ליד" },
  { value: "engaged",          label: "מעורב" },
  { value: "high_intent",      label: "כוונה גבוהה" },
  { value: "buyer",            label: "קנה" },
  { value: "booked",           label: "הזמין שיחה" },
  { value: "premium_lead",     label: "ליד פרמיום" },
  { value: "partnership_lead", label: "ליד שותפות" },
];

const TEMPLATES = [
  { key: "welcome",                   label: "ברוכ/ה הבא/ה" },
  { key: "followup_24h",              label: "פולואפ 24 שעות" },
  { key: "challenge_access",          label: "גישה לאתגר" },
  { key: "challenge_upsell_workshop", label: "אפסל סדנה" },
  { key: "workshop_confirmation",     label: "אישור סדנה" },
  { key: "workshop_upsell_strategy",  label: "אפסל אסטרטגיה" },
  { key: "cart_abandon_1h",           label: "עגלה נטושה - 1 שעה" },
  { key: "cart_abandon_24h",          label: "עגלה נטושה + קופון" },
  { key: "reengagement",              label: "החזרת גולש לא פעיל" },
  { key: "booking_confirmation",      label: "אישור פגישה" },
  { key: "premium_lead_confirmation", label: "אישור ליד פרמיום" },
  { key: "partnership_confirmation",  label: "אישור ליד שותפות" },
];

interface Props {
  userId:        string;
  currentStatus: UserStatus;
  phone:         string | null; // already formatted: 972xxx
}

const BASE_BTN: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
  cursor: "pointer", border: "1px solid #2C323E", background: "#141820",
  color: "#EDE9E1", fontFamily: "Assistant, sans-serif", whiteSpace: "nowrap",
};

export function AdminUserActions({ userId, currentStatus, phone }: Props) {
  const [statusPending, startStatus] = useTransition();
  const [emailPending,  startEmail]  = useTransition();

  const [statusOpen,      setStatusOpen]      = useState(false);
  const [emailModalOpen,  setEmailModalOpen]  = useState(false);
  const [selectedStatus,  setSelectedStatus]  = useState<UserStatus>(currentStatus);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].key);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleStatusPick(status: UserStatus) {
    setSelectedStatus(status);
    setStatusOpen(false);
    if (status === currentStatus) return;
    startStatus(async () => {
      await changeUserStatus(userId, status);
      showToast("סטטוס עודכן");
    });
  }

  function handleSendEmail() {
    startEmail(async () => {
      await sendManualEmail(userId, selectedTemplate);
      setEmailModalOpen(false);
      showToast("אימייל נכנס לתור");
    });
  }

  return (
    <>
      {/* ── Action bar ── */}
      <div
        className="up-actions"
        style={{
          background: "#0D1219", borderBottom: "1px solid #2C323E",
          padding: "10px 24px", display: "flex", gap: 8, alignItems: "center",
          flexWrap: "wrap", position: "relative",
        }}
      >
        {/* WhatsApp */}
        {phone ? (
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...BASE_BTN, borderColor: "rgba(37,211,102,0.35)", color: "#4CAF82", textDecoration: "none" }}
          >
            WhatsApp
          </a>
        ) : (
          <button style={{ ...BASE_BTN, opacity: 0.35, cursor: "default" }} disabled>
            WhatsApp
          </button>
        )}

        {/* Send email */}
        <button style={BASE_BTN} onClick={() => setEmailModalOpen(true)}>
          שלח אימייל
        </button>

        {/* Send purchase link */}
        <button
          style={{ ...BASE_BTN, background: "linear-gradient(135deg, #E8B94A, #9E7C3A)", color: "#080C14", border: "none" }}
          onClick={() => showToast("בפיתוח")}
        >
          שלח לינק לרכישה
        </button>

        {/* Schedule follow-up */}
        <button style={BASE_BTN} onClick={() => showToast("בפיתוח")}>
          תזמן פולואו-אפ
        </button>

        {/* Change status */}
        <div style={{ position: "relative" }}>
          <button
            style={{
              ...BASE_BTN,
              borderColor: statusPending ? "rgba(232,185,74,0.4)" : "#2C323E",
              color: statusPending ? "#E8B94A" : "#EDE9E1",
            }}
            onClick={() => setStatusOpen((o) => !o)}
          >
            {statusPending ? "מעדכן..." : "שנה סטטוס"}
          </button>

          {statusOpen && (
            <>
              {/* backdrop */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => setStatusOpen(false)}
              />
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 100,
                background: "#141820", border: "1px solid #2C323E", borderRadius: 8,
                minWidth: 160, overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}>
                {STATUSES.map((s, i) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusPick(s.value)}
                    style={{
                      display: "block", width: "100%", padding: "9px 14px",
                      textAlign: "right", fontSize: 13, cursor: "pointer",
                      background: s.value === selectedStatus ? "rgba(232,185,74,0.1)" : "transparent",
                      color: s.value === selectedStatus ? "#E8B94A" : "#EDE9E1",
                      border: "none", fontFamily: "Assistant, sans-serif",
                      borderBottom: i < STATUSES.length - 1 ? "1px solid rgba(44,50,62,0.5)" : "none",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Mark irrelevant */}
        <button
          style={{ ...BASE_BTN, color: "#9E9990", borderColor: "rgba(44,50,62,0.5)" }}
          onClick={() => showToast("בפיתוח")}
        >
          סמן לא רלוונטי
        </button>

        {/* Toast */}
        {toast && (
          <span style={{
            marginRight: "auto", fontSize: 12, color: "#4CAF82",
            background: "rgba(76,175,130,0.1)", padding: "4px 10px", borderRadius: 6,
          }}>
            {toast}
          </span>
        )}
      </div>

      {/* ── Email modal ── */}
      {emailModalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(8,12,20,0.85)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEmailModalOpen(false); }}
        >
          <div style={{
            background: "#141820", border: "1px solid #2C323E", borderRadius: 16,
            padding: 28, width: "100%", maxWidth: 400,
            direction: "rtl", fontFamily: "Assistant, sans-serif",
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#EDE9E1", marginBottom: 20 }}>
              שלח אימייל
            </div>

            <label style={{ fontSize: 12, color: "#9E9990", display: "block", marginBottom: 6 }}>
              תבנית אימייל
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{
                width: "100%", background: "#0D1219", border: "1px solid #2C323E",
                borderRadius: 8, padding: "9px 12px", color: "#EDE9E1", fontSize: 13,
                fontFamily: "Assistant, sans-serif", outline: "none", marginBottom: 20,
              }}
            >
              {TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSendEmail}
                disabled={emailPending}
                style={{
                  flex: 1, padding: "10px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                  color: "#080C14", border: "none",
                  cursor: emailPending ? "not-allowed" : "pointer",
                  opacity: emailPending ? 0.7 : 1,
                  fontFamily: "Assistant, sans-serif",
                }}
              >
                {emailPending ? "שולח..." : "שלח"}
              </button>
              <button
                onClick={() => setEmailModalOpen(false)}
                style={{
                  padding: "10px 16px", borderRadius: 8, fontSize: 14,
                  background: "transparent", border: "1px solid #2C323E",
                  color: "#9E9990", cursor: "pointer", fontFamily: "Assistant, sans-serif",
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
