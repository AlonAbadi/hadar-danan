"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "a11y_prefs";

interface A11yPrefs {
  fontSize:        number;   // 0 = normal, 1 = large, 2 = larger
  highContrast:    boolean;
  grayscale:       boolean;
  highlightLinks:  boolean;
  stopAnimations:  boolean;
  readingMode:     boolean;
}

const DEFAULT: A11yPrefs = {
  fontSize: 0, highContrast: false, grayscale: false,
  highlightLinks: false, stopAnimations: false, readingMode: false,
};

const FONT_SIZES = [100, 120, 140];
const FONT_LABELS = ["רגיל", "גדול", "גדול מאוד"];

function applyPrefs(p: A11yPrefs) {
  const html = document.documentElement;
  // Font size via inline style so it doesn't conflict with Tailwind
  html.style.fontSize = p.fontSize === 0 ? "" : `${FONT_SIZES[p.fontSize]}%`;
  // Combined filter (supports both grayscale + high-contrast together)
  const filters: string[] = [];
  if (p.highContrast) filters.push("contrast(1.6)");
  if (p.grayscale)    filters.push("grayscale(1)");
  html.style.filter = filters.join(" ") || "";
  html.classList.toggle("a11y-high-contrast",   p.highContrast);
  html.classList.toggle("a11y-highlight-links", p.highlightLinks);
  html.classList.toggle("a11y-stop-animations", p.stopAnimations);
  html.classList.toggle("a11y-reading-mode",    p.readingMode);
}

export function AccessibilityWidget() {
  const [open, setOpen]   = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT);
  const panelRef          = useRef<HTMLDivElement>(null);
  const btnRef            = useRef<HTMLButtonElement>(null);

  // Load saved prefs on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = { ...DEFAULT, ...JSON.parse(raw) };
        setPrefs(saved);
        applyPrefs(saved);
      }
    } catch { /* ignore */ }
  }, []);

  // Apply + persist whenever prefs change
  useEffect(() => {
    applyPrefs(prefs);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  // Escape key closes panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle(key: keyof Omit<A11yPrefs, "fontSize">) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  }

  function reset() {
    setPrefs(DEFAULT);
  }

  const anyActive =
    prefs.fontSize > 0 || prefs.highContrast || prefs.grayscale ||
    prefs.highlightLinks || prefs.stopAnimations || prefs.readingMode;

  return (
    <div dir="rtl">
      {/* ── Floating toggle button ── */}
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "סגור תפריט נגישות" : "פתח תפריט נגישות"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center justify-center focus-visible:outline-none"
        style={{
          position: "fixed",
          bottom: "144px",
          left: "0",
          width: "48px",
          height: "48px",
          background: "rgba(201,150,74,0.15)",
          borderRadius: "0 14px 14px 0",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          padding: 0,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="11" stroke="#C9964A" strokeWidth="1.5" />
          <circle cx="12" cy="6.5" r="1.5" fill="#C9964A" />
          <path d="M9 10h6M12 10v4.5l2.5 3" stroke="#C9964A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.5 14.5A3 3 0 1 0 14 17" stroke="#C9964A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* ── Panel ── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="הגדרות נגישות"
          aria-modal="false"
          className="fixed bottom-20 left-2 w-72 rounded-2xl shadow-2xl flex flex-col gap-3 p-4"
          style={{ background: "#fff", border: "2px solid #C9964A", color: "#111827", zIndex: 9999 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black" id="a11y-dialog-title">אפשרויות נגישות</h2>
            <button
              onClick={() => { setOpen(false); btnRef.current?.focus(); }}
              aria-label="סגור תפריט נגישות"
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition text-sm"
            >
              ✕
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Font size adjuster */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">גודל טקסט</span>
            <div className="flex items-center gap-1" role="group" aria-label="שינוי גודל טקסט">
              <button
                onClick={() => setPrefs(p => ({ ...p, fontSize: Math.max(0, p.fontSize - 1) }))}
                disabled={prefs.fontSize === 0}
                aria-label="הקטן טקסט"
                className="w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm disabled:opacity-30 hover:bg-amber-50 transition"
                style={{ borderColor: "#C9964A", color: "#C9964A" }}
              >
                א-
              </button>
              <span
                className="text-xs w-16 text-center"
                aria-live="polite"
                aria-atomic="true"
              >
                {FONT_LABELS[prefs.fontSize]}
              </span>
              <button
                onClick={() => setPrefs(p => ({ ...p, fontSize: Math.min(2, p.fontSize + 1) }))}
                disabled={prefs.fontSize === 2}
                aria-label="הגדל טקסט"
                className="w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm disabled:opacity-30 hover:bg-amber-50 transition"
                style={{ borderColor: "#C9964A", color: "#C9964A" }}
              >
                א+
              </button>
            </div>
          </div>

          {/* Toggle options */}
          {([
            { key: "highContrast",   label: "ניגודיות גבוהה",  icon: "◑" },
            { key: "grayscale",      label: "גווני אפור",       icon: "◐" },
            { key: "highlightLinks", label: "הדגש קישורים",    icon: "🔗" },
            { key: "stopAnimations", label: "עצור אנימציות",   icon: "⏸" },
            { key: "readingMode",    label: "מצב קריאה",       icon: "📖" },
          ] as Array<{ key: keyof Omit<A11yPrefs,"fontSize">; label: string; icon: string }>
          ).map(({ key, label, icon }) => {
            const active = prefs[key];
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </span>
                <button
                  role="switch"
                  aria-checked={active}
                  onClick={() => toggle(key)}
                  aria-label={`${label} - ${active ? "פעיל" : "כבוי"}`}
                  className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus-visible:outline-2"
                  style={{
                    background: active ? "#C9964A" : "#d1d5db",
                    outlineColor: "#C9964A",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                    style={active ? { right: "2px", left: "auto" } : { left: "2px", right: "auto" }}
                  />
                </button>
              </div>
            );
          })}

          <hr className="border-gray-200" />

          {/* Reset */}
          <button
            onClick={reset}
            disabled={!anyActive}
            className="w-full rounded-xl py-2 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-40"
            style={{ border: "1px solid #2C323E", color: "#6b7280" }}
          >
            איפוס הגדרות
          </button>

          {/* Accessibility statement link */}
          <a
            href="/accessibility"
            className="text-center text-xs underline hover:opacity-70 transition"
            style={{ color: "#C9964A" }}
          >
            הצהרת נגישות
          </a>
        </div>
      )}
    </div>
  );
}
