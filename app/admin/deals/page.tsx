"use client";

import { useEffect, useState } from "react";

const CATEGORIES = ["כללי", "אופנה", "מזון", "בית", "בריאות", "טיפוח", "ספורט", "טכנולוגיה"];

const INPUT: React.CSSProperties = {
  width: "100%", padding: "9px 14px",
  border: "1px solid #2C323E", borderRadius: 8,
  fontSize: 14, fontFamily: "inherit",
  color: "#EDE9E1", background: "#1D2430",
  outline: "none", boxSizing: "border-box",
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

const EMPTY: Omit<Deal, "id"> = {
  brand_name: "", brand_logo_url: "", category: "כללי",
  product_description: "", discount_text: "", coupon_code: "",
  store_url: "", expires_at: "", is_featured: false, is_active: true, display_order: 0,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#9E9990" }}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminDealsPage() {
  const [deals, setDeals]               = useState<Deal[]>([]);
  const [loading, setLoading]           = useState(true);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingDeal, setEditingDeal]   = useState<Deal | null>(null);
  const [form, setForm]                 = useState<Omit<Deal, "id">>(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/admin/deals").then(r => r.json());
    setDeals(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() { setEditingDeal(null); setForm(EMPTY); setModalOpen(true); }
  function openEdit(d: Deal) {
    setEditingDeal(d);
    setForm({ brand_name: d.brand_name, brand_logo_url: d.brand_logo_url ?? "", category: d.category,
      product_description: d.product_description, discount_text: d.discount_text, coupon_code: d.coupon_code,
      store_url: d.store_url ?? "", expires_at: d.expires_at ?? "", is_featured: d.is_featured,
      is_active: d.is_active, display_order: d.display_order });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    const payload = { ...form, display_order: Number(form.display_order) };
    if (editingDeal) {
      await fetch(`/api/admin/deals/${editingDeal.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/admin/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setSaving(false); setModalOpen(false); load();
  }

  async function del(id: string) {
    await fetch(`/api/admin/deals/${id}`, { method: "DELETE" });
    setDeleteConfirm(null); load();
  }

  async function toggle(d: Deal) {
    await fetch(`/api/admin/deals/${d.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...d, is_active: !d.is_active }),
    });
    load();
  }

  const canSave = !saving && !!form.brand_name && !!form.coupon_code && !!form.product_description;

  return (
    <div dir="rtl" style={{ fontFamily: "var(--font-assistant, Assistant, sans-serif)", minHeight: "100vh", padding: "32px 48px", color: "#EDE9E1" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#EDE9E1" }}>קופונים ודילים</div>
          <div style={{ fontSize: 13, color: "#9E9990", marginTop: 3 }}>{deals.length} הטבות במערכת</div>
        </div>
        <button
          onClick={openNew}
          style={{
            background: "linear-gradient(135deg, #E8B94A, #C9964A)",
            color: "#1A1206", border: "none",
            borderRadius: 10, padding: "10px 22px",
            fontSize: 14, fontWeight: 800, cursor: "pointer",
          }}
        >
          + קופון חדש
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9E9990" }}>טוען...</div>
        ) : deals.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9E9990" }}>אין הטבות עדיין — לחץ &quot;קופון חדש&quot;</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1D2430", borderBottom: "1px solid #2C323E" }}>
                {["סדר", "מותג", "קטגוריה", "תיאור", "קוד קופון", "הנחה", "תוקף", "⭐", "פעיל", "פעולות"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#9E9990", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((d, i) => (
                <tr key={d.id} style={{ borderBottom: i < deals.length - 1 ? "1px solid #2C323E" : "none" }}>
                  <td style={{ padding: "12px 16px", color: "#9E9990", fontSize: 13 }}>{d.display_order}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#EDE9E1", fontSize: 14 }}>{d.brand_name}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: "#1D2430", border: "1px solid #2C323E", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#9E9990" }}>{d.category}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#9E9990", maxWidth: 200 }}>{d.product_description}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontFamily: "monospace", background: "rgba(201,150,74,0.12)", border: "1px dashed rgba(201,150,74,0.4)", borderRadius: 6, padding: "4px 10px", fontSize: 13, color: "#C9964A", fontWeight: 700 }}>
                      {d.coupon_code}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "#EDE9E1" }}>{d.discount_text}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: d.expires_at ? "#EDE9E1" : "#9E9990" }}>
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString("he-IL") : "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>{d.is_featured ? "⭐" : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => toggle(d)}
                      style={{
                        border: "none", borderRadius: 9999, padding: "4px 12px",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                        background: d.is_active ? "rgba(52,168,83,0.15)" : "#1D2430",
                        color: d.is_active ? "#34A853" : "#9E9990",
                        border_: `1px solid ${d.is_active ? "rgba(52,168,83,0.3)" : "#2C323E"}`,
                      } as React.CSSProperties}
                    >
                      {d.is_active ? "פעיל" : "כבוי"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(d)}
                        style={{ background: "rgba(66,133,244,0.12)", color: "#4285F4", border: "1px solid rgba(66,133,244,0.3)", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        עריכה
                      </button>
                      <button onClick={() => setDeleteConfirm(d.id)}
                        style={{ background: "rgba(234,67,53,0.12)", color: "#EA4335", border: "1px solid rgba(234,67,53,0.3)", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 18, padding: 36, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", direction: "rtl" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#EDE9E1", marginBottom: 24 }}>
              {editingDeal ? "עריכת הטבה" : "הטבה חדשה"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="שם המותג *">
                <input style={INPUT} value={form.brand_name} onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))} placeholder="טרמינל X" />
              </Field>
              <Field label="קטגוריה">
                <select style={INPUT} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="תיאור ההטבה *">
                <input style={INPUT} value={form.product_description} onChange={e => setForm(f => ({ ...f, product_description: e.target.value }))} placeholder="20% הנחה על כל האתר" />
              </Field>
              <Field label="טקסט הנחה קצר">
                <input style={INPUT} value={form.discount_text} onChange={e => setForm(f => ({ ...f, discount_text: e.target.value }))} placeholder="20% הנחה" />
              </Field>
              <Field label="קוד קופון *">
                <input style={{ ...INPUT, fontFamily: "monospace", letterSpacing: "0.05em" }} value={form.coupon_code} onChange={e => setForm(f => ({ ...f, coupon_code: e.target.value.toUpperCase() }))} placeholder="HADAR20" />
              </Field>
              <Field label="קישור לחנות">
                <input style={INPUT} value={form.store_url ?? ""} onChange={e => setForm(f => ({ ...f, store_url: e.target.value }))} placeholder="https://..." type="url" />
              </Field>
              <Field label="URL לוגו (אופציונלי)">
                <input style={INPUT} value={form.brand_logo_url ?? ""} onChange={e => setForm(f => ({ ...f, brand_logo_url: e.target.value }))} placeholder="https://..." type="url" />
              </Field>
              <Field label="תאריך תפוגה">
                <input style={{ ...INPUT, colorScheme: "dark" }} value={form.expires_at ?? ""} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} type="date" />
              </Field>
              <Field label="סדר תצוגה">
                <input style={INPUT} value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} type="number" min={0} />
              </Field>
              <div style={{ display: "flex", gap: 24 }}>
                {[
                  { key: "is_featured" as keyof typeof form, label: "מומלץ (⭐)" },
                  { key: "is_active"   as keyof typeof form, label: "פעיל" },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#EDE9E1" }}>
                    <input type="checkbox" checked={form[key] as boolean} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              <button onClick={() => setModalOpen(false)}
                style={{ background: "#1D2430", color: "#9E9990", border: "1px solid #2C323E", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                ביטול
              </button>
              <button onClick={save} disabled={!canSave}
                style={{
                  background: canSave ? "linear-gradient(135deg, #E8B94A, #C9964A)" : "#2C323E",
                  color: canSave ? "#1A1206" : "#9E9990",
                  border: "none", borderRadius: 9, padding: "10px 22px",
                  fontSize: 14, fontWeight: 800,
                  cursor: canSave ? "pointer" : "not-allowed",
                }}>
                {saving ? "שומר..." : "שמור"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001 }}>
          <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 16, padding: 32, maxWidth: 360, width: "100%", textAlign: "center", direction: "rtl" }}>
            <div style={{ fontSize: 16, color: "#EDE9E1", marginBottom: 8, fontWeight: 700 }}>למחוק את ההטבה?</div>
            <div style={{ fontSize: 13, color: "#9E9990", marginBottom: 24 }}>פעולה זו אינה הפיכה</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ background: "#1D2430", color: "#9E9990", border: "1px solid #2C323E", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                ביטול
              </button>
              <button onClick={() => del(deleteConfirm)}
                style={{ background: "rgba(234,67,53,0.9)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                מחק
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
