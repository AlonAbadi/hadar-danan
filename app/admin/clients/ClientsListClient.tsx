"use client";
import { useState } from "react";
import Link from "next/link";

type Client = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  total: number;
  products: string[];
  lastPurchase: string;
  count: number;
};

function getInitials(name: string | null, email: string): string {
  const str = name ?? email;
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return str.slice(0, 2).toUpperCase();
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 30) return `לפני ${days} ימים`;
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function ClientsListClient({ clients }: { clients: Client[] }) {
  const [q, setQ] = useState("");

  const filtered = q.trim()
    ? clients.filter((c) => {
        const lq = q.toLowerCase();
        return (
          (c.name ?? "").toLowerCase().includes(lq) ||
          c.email.toLowerCase().includes(lq) ||
          (c.phone ?? "").includes(lq)
        );
      })
    : clients;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .cl-root { direction: rtl; font-family: 'Assistant', sans-serif; padding: 40px 48px; background: #080C14; min-height: 100vh; color: #EDE9E1; }
        .cl-search { width: 100%; max-width: 440px; background: #141820; border: 1px solid #2C323E; border-radius: 10px; padding: 10px 16px; font-size: 14px; color: #EDE9E1; outline: none; font-family: inherit; }
        .cl-search::placeholder { color: #6B7280; }
        .cl-search:focus { border-color: rgba(201,150,74,0.45); }
        .cl-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .cl-th { text-align: right; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.07em; padding: 8px 12px; border-bottom: 1px solid #2C323E; }
        .cl-row { cursor: pointer; transition: background 0.15s; }
        .cl-row:hover td { background: #141820; }
        .cl-td { padding: 12px 12px; border-bottom: 1px solid rgba(44,50,62,0.5); font-size: 13px; vertical-align: middle; }
        .cl-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(127,119,221,0.2); color: #7F77DD; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; }
        .cl-chip { display: inline-block; background: rgba(201,150,74,0.12); color: #C9964A; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 5px; margin-left: 4px; }
        @media (max-width: 700px) { .cl-root { padding: 20px 16px; } .cl-hide { display: none; } }
      `}</style>
      <div className="cl-root">
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#EDE9E1", marginBottom: 6 }}>
            לקוחות
          </div>
          <div style={{ fontSize: 13, color: "#9E9990" }}>
            {clients.length} לקוחות · {filtered.length} מוצגים
          </div>
        </div>

        <input
          className="cl-search"
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <table className="cl-table">
          <thead>
            <tr>
              <th className="cl-th">לקוח</th>
              <th className="cl-th cl-hide">טלפון</th>
              <th className="cl-th">מוצרים</th>
              <th className="cl-th cl-hide">רכישות</th>
              <th className="cl-th">סה"כ שילם</th>
              <th className="cl-th">רכישה אחרונה</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="cl-row">
                <td className="cl-td">
                  <Link href={`/admin/clients/${c.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="cl-avatar">{getInitials(c.name, c.email)}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: "#EDE9E1" }}>{c.name ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "#9E9990", direction: "ltr" }}>{c.email}</div>
                    </div>
                  </Link>
                </td>
                <td className="cl-td cl-hide" style={{ color: "#9E9990", direction: "ltr" }}>{c.phone ?? "—"}</td>
                <td className="cl-td">
                  {c.products.map((p) => <span key={p} className="cl-chip">{p}</span>)}
                </td>
                <td className="cl-td cl-hide" style={{ color: "#9E9990", textAlign: "center" }}>{c.count}</td>
                <td className="cl-td">
                  <span style={{ fontWeight: 800, background: "linear-gradient(135deg,#E8B94A,#9E7C3A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    ₪{c.total.toLocaleString("he-IL")}
                  </span>
                </td>
                <td className="cl-td" style={{ color: "#9E9990" }}>{relTime(c.lastPurchase)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "#9E9990" }}>לא נמצאו תוצאות</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
