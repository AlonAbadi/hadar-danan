"use client";

import { useEffect, useState } from "react";

const CATEGORIES = ["כללי", "אופנה", "מזון", "בית", "בריאות", "טיפוח", "ספורט", "טכנולוגיה"];

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB",
  borderRadius: 8, fontSize: 14, fontFamily: "inherit",
  color: "#111827", background: "#FFFFFF", outline: "none", boxSizing: "border-box",
};

type Deal = {
  id: string;
  brand_name: string;
  brand_logo_url: string | null;
  category: string;
  product_description: string;
  discount_text: string;
  coupon_code: string;
  store_url: string | null;
  expires_at: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
};

const EMPTY_FORM: Omit<Deal, "id"> = {
  brand_name: "",
  brand_logo_url: "",
  category: "כללי",
  product_description: "",
  discount_text: "",
  coupon_code: "",
  store_url: "",
  expires_at: "",
  is_featured: false,
  is_active: true,
  display_order: 0,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<Omit<Deal, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function loadDeals() {
    setLoading(true);
    const res = await fetch("/api/admin/deals");
    const data = await res.json();
    setDeals(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadDeals(); }, []);

  function openNew() {
    setEditingDeal(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(deal: Deal) {
    setEditingDeal(deal);
    setForm({
      brand_name: deal.brand_name,
      brand_logo_url: deal.brand_logo_url ?? "",
      category: deal.category,
      product_description: deal.product_description,
      discount_text: deal.discount_text,
      coupon_code: deal.coupon_code,
      store_url: deal.store_url ?? "",
      expires_at: deal.expires_at ?? "",
      is_featured: deal.is_featured,
      is_active: deal.is_active,
      display_order: deal.display_order,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, display_order: Number(form.display_order) };
    if (editingDeal) {
      await fetch(`/api/admin/deals/${editingDeal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/admin/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setSaving(false);
    setModalOpen(false);
    loadDeals();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/deals/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    loadDeals();
  }

  async function toggleActive(deal: Deal) {
    await fetch(`/api/admin/deals/${deal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...deal, is_active: !deal.is_active }),
    });
    loadDeals();
  }

  const canSave = !saving && !!form.brand_name && !!form.coupon_code && !!form.product_description;

  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant, Assistant, sans-serif)", minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: "28px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" }}>ניהול הטבות</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>{deals.length} הטבות במערכת</p>
          </div>
          <button
            onClick={openNew}
            style={{
              background: "#E07A5F", color: "#FFFFFF", border: "none",
              borderRadius: 10, padding: "10px 22px", fontSize: 14,
              fontWeight: 600, cursor: "pointer",
            }}
          >
            + הוסף קופון חדש
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#6B7280" }}>טוען...</div>
          ) : deals.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#6B7280" }}>
              אין הטבות עדיין — לחצי &quot;הוסף קופון חדש&quot;
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                  {["סדר", "מותג", "קטגוריה", "תיאור", "קוד קופון", "הנחה", "תוקף", "⭐", "פעיל", "פעולות"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map((deal, i) => (
                  <tr key={deal.id} style={{ borderBottom: i < deals.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                    <td style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: 13 }}>{deal.display_order}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", fontSize: 14 }}>{deal.brand_name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "#F3F4F6", borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#374151" }}>{deal.category}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", maxWidth: 200 }}>{deal.product_description}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: "monospace", background: "#FFF6F0", border: "1px dashed #E07A5F", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "#E07A5F", fontWeight: 700 }}>
                        {deal.coupon_code}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{deal.discount_text}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: deal.expires_at ? "#374151" : "#9CA3AF" }}>
                      {deal.expires_at ? new Date(deal.expires_at).toLocaleDateString("he-IL") : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {deal.is_featured ? "⭐" : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => toggleActive(deal)}
                        style={{
                          border: "none", borderRadius: 9999, padding: "4px 12px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: deal.is_active ? "#DCFCE7" : "#F3F4F6",
                          color: deal.is_active ? "#16A34A" : "#9CA3AF",
                        }}
                      >
                        {deal.is_active ? "פעיל" : "כבוי"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openEdit(deal)}
                          style={{ background: "#EFF6FF", color: "#2563EB", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          עריכה
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(deal.id)}
                          style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 24,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 18, padding: 36,
            width: "100%", maxWidth: 560, maxHeight: "90vh",
            overflowY: "auto", direction: "rtl",
          }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              {editingDeal ? "עריכת הטבה" : "הוספת הטבה חדשה"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="שם המותג *">
                <input style={INPUT_STYLE} value={form.brand_name} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))} placeholder="טרמינל X" />
              </Field>

              <Field label="קטגוריה">
                <select style={INPUT_STYLE} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="תיאור המוצר / ההטבה *">
                <input style={INPUT_STYLE} value={form.product_description} onChange={e => setForm(f => ({ ...f, product_description: e.target.value }))} placeholder="20% הנחה על כל האתר" />
              </Field>

              <Field label="טקסט הנחה (תצוגה קצרה)">
                <input style={INPUT_STYLE} value={form.discount_text} onChange={e => setForm(f => ({ ...f, discount_text: e.target.value }))} placeholder="20% הנחה" />
              </Field>

              <Field label="קוד קופון *">
                <input style={{ ...INPUT_STYLE, fontFamily: "monospace", letterSpacing: "0.05em" }} value={form.coupon_code} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))} placeholder="SHIRI20" />
              </Field>

              <Field label="קישור לחנות">
                <input style={INPUT_STYLE} value={form.store_url ?? ""} onChange={e => setForm(f => ({ ...f, store_url: e.target.value }))} placeholder="https://..." type="url" />
              </Field>

              <Field label="URL לוגו (אופציונלי)">
                <input style={INPUT_STYLE} value={form.brand_logo_url ?? ""} onChange={e => setForm(f => ({ ...f, brand_logo_url: e.target.value }))} placeholder="https://..." type="url" />
              </Field>

              <Field label="תאריך תפוגה (אופציונלי)">
                <input style={INPUT_STYLE} value={form.expires_at ?? ""} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} type="date" />
              </Field>

              <Field label="סדר תצוגה">
                <input style={INPUT_STYLE} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} type="number" min={0} />
              </Field>

              <div style={{ display: "flex", gap: 24 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#374151" }}>
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  מומלץ (⭐)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#374151" }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  פעיל
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                ביטול
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  background: "#E07A5F", color: "#FFFFFF", border: "none",
                  borderRadius: 9, padding: "10px 22px", fontSize: 14,
                  fontWeight: 600, cursor: canSave ? "pointer" : "not-allowed",
                  opacity: canSave ? 1 : 0.5,
                }}
              >
                {saving ? "שומר..." : "שמור"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1001,
        }}>
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 32, maxWidth: 360, width: "100%", textAlign: "center", direction: "rtl" }}>
            <p style={{ fontSize: 16, color: "#111827", marginBottom: 24 }}>למחוק את ההטבה הזו?</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>ביטול</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ background: "#DC2626", color: "#FFFFFF", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
