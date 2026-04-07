"use client";

import { useState } from "react";

interface Note {
  id:         string;
  author:     string;
  content:    string;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק'`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שע'`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "אתמול";
  return new Date(iso).toLocaleDateString("he-IL");
}

export function NotesSection({
  userId,
  initialNotes,
}: {
  userId:       string;
  initialNotes: Note[];
}) {
  const [notes,   setNotes]   = useState<Note[]>(initialNotes);
  const [content, setContent] = useState("");
  const [saving,  setSaving]  = useState(false);

  async function addNote() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, author: "admin", content: content.trim() }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setContent("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#141820", border: "1px solid #2C323E", borderRadius: 12, padding: "20px 24px" }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: "#9E9990",
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16,
      }}>
        הערות ({notes.length})
      </div>

      {/* New note */}
      <div style={{ marginBottom: 20 }}>
        <textarea
          placeholder="הוסף הערה..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{
            width: "100%", background: "#0D1219", border: "1px solid #2C323E",
            borderRadius: 8, padding: "10px 12px", color: "#EDE9E1", fontSize: 13,
            fontFamily: "Assistant, sans-serif", resize: "vertical", outline: "none",
            marginBottom: 10, direction: "rtl",
          }}
        />
        <button
          onClick={addNote}
          disabled={saving || !content.trim()}
          style={{
            padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: "linear-gradient(135deg, #E8B94A, #9E7C3A)", color: "#080C14",
            border: "none", fontFamily: "Assistant, sans-serif",
            cursor: saving || !content.trim() ? "not-allowed" : "pointer",
            opacity: saving || !content.trim() ? 0.6 : 1,
          }}
        >
          {saving ? "שומר..." : "שמור הערה"}
        </button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p style={{ color: "#9E9990", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
          אין הערות עדיין
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.map((note) => (
            <div
              key={note.id}
              style={{
                background: "#0D1219", border: "1px solid rgba(44,50,62,0.6)",
                borderRadius: 8, padding: "12px 14px",
              }}
            >
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 8,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#C9964A" }}>
                  {note.author}
                </span>
                <span style={{ fontSize: 11, color: "#9E9990" }}>
                  {relativeTime(note.created_at)}
                </span>
              </div>
              <p style={{
                fontSize: 13, color: "#EDE9E1", lineHeight: 1.65,
                whiteSpace: "pre-wrap", margin: 0,
              }}>
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
