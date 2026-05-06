"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

const WA_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "972539566961";
const WA_TEXT  = encodeURIComponent("היי, אני רוצה להיכנס לאזור האישי שלי אבל לא זוכרת באיזה אימייל נרשמתי. השם שלי: ");

const S = {
  page: {
    minHeight: "100vh",
    background: "#080C14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "Assistant, sans-serif",
  } as React.CSSProperties,
  card: {
    background: "#141820",
    border: "1px solid #2C323E",
    borderRadius: 12,
    padding: "36px 32px",
    width: "100%",
    maxWidth: 400,
    direction: "rtl" as const,
  } as React.CSSProperties,
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#EDE9E1",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9E9990",
    textAlign: "center" as const,
    marginBottom: 28,
    lineHeight: 1.6,
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#9E9990",
    marginBottom: 6,
    fontWeight: 600,
  },
  input: {
    width: "100%",
    background: "#0D1219",
    border: "1px solid #2C323E",
    borderRadius: 8,
    padding: "11px 12px",
    color: "#EDE9E1",
    fontSize: 14,
    fontFamily: "Assistant, sans-serif",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  } as React.CSSProperties,
  submitBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    color: "#080C14",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "Assistant, sans-serif",
    marginTop: 4,
    transition: "opacity 0.15s",
  } as React.CSSProperties,
  googleBtn: {
    width: "100%",
    padding: "11px 16px",
    borderRadius: 8,
    border: "1px solid #2C323E",
    background: "#fff",
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "Assistant, sans-serif",
    transition: "opacity 0.15s",
  } as React.CSSProperties,
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "20px 0",
  },
  dividerLine: { flex: 1, height: 1, background: "#2C323E" },
  dividerText:  { fontSize: 12, color: "#9E9990" },
  errorBox: {
    background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#E05555",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
  },
  waRow: {
    background: "#1a1f2a",
    border: "1px solid #2C323E",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "#9E9990",
    textAlign: "center" as const,
    lineHeight: 1.6,
  },
  bottomLink: {
    textAlign: "center" as const,
    marginTop: 14,
    fontSize: 13,
    color: "#9E9990",
  },
};

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

type Phase = "initializing" | "idle" | "loading" | "sent" | "not_found";

function AccessPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const supabase     = createBrowserClient();

  const [phase, setPhase] = useState<Phase>("initializing");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");

  // Process magic link hash OR existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/account");
      } else {
        setPhase("idle");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    setPhase("loading");
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=/account`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "loading") return;
    setPhase("loading");

    const res = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setPhase("sent");
    } else {
      const data = await res.json().catch(() => ({}));
      if ((data as { error?: string }).error === "not_found") {
        setPhase("not_found");
      } else {
        setPhase("not_found");
      }
    }
  }

  // ── Initializing (checking for magic link hash) ────────────
  if (phase === "initializing") {
    return (
      <div style={S.page} dir="rtl" lang="he">
        <div style={{ color: "#9E9990", fontSize: 14, fontFamily: "Assistant, sans-serif" }}>
          טוענת...
        </div>
      </div>
    );
  }

  // ── Sent ──────────────────────────────────────────────────
  if (phase === "sent") {
    return (
      <div style={S.page} dir="rtl" lang="he">
        <div style={S.card}>
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(109,184,109,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6db86d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={S.title}>הקישור בדרך אלייך</div>
            <p style={{ ...S.subtitle, margin: "8px 0 0" }}>
              שלחנו קישור כניסה ל-<br />
              <strong style={{ color: "#E8B94A" }}>{email}</strong>
            </p>
            <p style={{ fontSize: 13, color: "#9E9990", marginTop: 16, lineHeight: 1.6 }}>
              הקישור בתוקף ל-24 שעות.<br />
              לא קיבלת? בדקי גם ב-spam.
            </p>
            <button
              onClick={() => setPhase("idle")}
              style={{ marginTop: 20, background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 13, fontFamily: "Assistant, sans-serif", textDecoration: "underline" }}
            >
              לא הגיע? שלחי שוב
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form (idle / not_found / loading) ─────────────────
  return (
    <div style={S.page} dir="rtl" lang="he">
      <div style={S.card}>
        <div style={S.title}>כניסה לאזור האישי שלך</div>
        <div style={S.subtitle}>הזיני את האימייל שאיתו רכשת ונשלח לך קישור כניסה ישירות למייל</div>

        {phase === "not_found" && (
          <div style={S.errorBox}>
            לא מצאנו חשבון עם האימייל הזה. בדקי שוב, או השתמשי באימייל אחר.
          </div>
        )}

        <button
          style={{ ...S.googleBtn, opacity: phase === "loading" ? 0.6 : 1 }}
          onClick={handleGoogle}
          disabled={phase === "loading"}
        >
          <GoogleLogo />
          כניסה עם Google
        </button>

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span style={S.dividerText}>או</span>
          <div style={S.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label htmlFor="access-email" style={S.label}>אימייל</label>
            <input
              id="access-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              style={S.input}
              onFocus={(e)  => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e)   => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
          </div>
          <button
            type="submit"
            disabled={phase === "loading"}
            style={{ ...S.submitBtn, opacity: phase === "loading" ? 0.6 : 1, cursor: phase === "loading" ? "not-allowed" : "pointer" }}
          >
            {phase === "loading" ? "שולח..." : "שלחי לי קישור"}
          </button>
        </form>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={S.waRow}>
            לא זוכרת באיזה אימייל קנית?{" "}
            <a
              href={`https://wa.me/${WA_PHONE}?text=${WA_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6db86d", fontWeight: 700, textDecoration: "none" }}
            >
              כתבי לנו בוואטסאפ ↗
            </a>
          </div>
          <div style={S.bottomLink}>
            עוד לא לקוחה?{" "}
            <Link href="/quiz" style={{ color: "#E8B94A", textDecoration: "none", fontWeight: 700 }}>
              התחילי מהקוויז →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense>
      <AccessPageInner />
    </Suspense>
  );
}
