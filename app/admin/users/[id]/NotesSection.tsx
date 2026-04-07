"use client";

import { useState } from "react";

interface Note {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `לפני ${hrs} שע׳`;
  return new Date(iso).toLocaleDateString("he-IL");
}

export function NotesSection({ userId, initialNotes }: { userId: string; initialNotes: Note[] }) {
  const [notes, setNotes]     = useState<Note[]>(initialNotes);
  const [content, setContent] = useState("");
  const [saving, setSaving]   = useState(false);

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
        setNotes(prev => [data.note, ...prev]);
        setContent("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        הערות ({notes.length})
      </h2>

      {/* Add note form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 flex flex-col gap-3">
        <textarea
          placeholder="הוסף הערה..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none outline-none focus:border-amber-400"
          style={{ fontFamily: "var(--font-assistant), Assistant, sans-serif" }}
        />
        <button
          onClick={addNote}
          disabled={saving || !content.trim()}
          className="self-start px-5 py-2 rounded-lg text-sm font-bold transition disabled:opacity-40"
          style={{ background: "#C9964A", color: "#1A1206" }}
        >
          {saving ? "שומר..." : "הוסף הערה"}
        </button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-6">אין הערות עדיין</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-amber-600">{note.author}</span>
                <span className="text-xs text-gray-400">{relativeTime(note.created_at)}</span>
              </div>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
