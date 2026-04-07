"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

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
  logo: { textAlign: "center" as const, marginBottom: 24 },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "#EDE9E1",
    textAlign: "center" as const,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#9E9990",
    textAlign: "center" as const,
    marginBottom: 28,
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
    padding: "10px 12px",
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
  bottomLink: {
    textAlign: "center" as const,
    marginTop: 20,
    fontSize: 13,
    color: "#9E9990",
  },
};

function getStrength(pw: string): { score: 0 | 1 | 2; label: string; color: string } {
  if (pw.length < 6) return { score: 0, label: "חלשה", color: "#E05555" };
  const checks = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const passed = checks.filter((r) => r.test(pw)).length;
  if (pw.length >= 8 && passed >= 2) return { score: 2, label: "חזקה", color: "#34A853" };
  return { score: 1, label: "בינונית", color: "#E8B94A" };
}

type Phase = "idle" | "loading" | "invalid_link";
type ErrorType = "weak_password" | "mismatch" | "expired" | "generic";

export default function ResetPasswordPage() {
  const router   = useRouter();
  const supabase = createBrowserClient();

  const [phase, setPhase]         = useState<Phase>("idle");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [ready, setReady]         = useState(false);

  // Supabase puts the recovery token in the URL hash (#access_token=..&type=recovery)
  // The SSR client handles this automatically via onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const strength = getStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "loading") return;
    setErrorType(null);

    if (strength.score === 0) {
      setErrorType("weak_password");
      return;
    }
    if (password !== confirm) {
      setErrorType("mismatch");
      return;
    }

    setPhase("loading");

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (!error) {
        router.push("/login");
        return;
      }

      const msg = error.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes("used")) {
        setErrorType("expired");
        setPhase("invalid_link");
      } else {
        setErrorType("generic");
        setPhase("idle");
      }
    } catch {
      setErrorType("generic");
      setPhase("idle");
    }
  }

  if (phase === "invalid_link" || errorType === "expired") {
    return (
      <div style={S.page} dir="rtl" lang="he">
        <div style={S.card}>
          <div style={S.logo}><div style={S.logoText}>הדר דנן</div></div>
          <div style={S.title}>הקישור פג תוקף</div>
          <div style={S.subtitle}>
            קישור האיפוס כבר שומש או פג תוקפו.
          </div>
          <div style={S.bottomLink}>
            <Link href="/forgot-password" style={{ color: "#E8B94A", textDecoration: "none", fontWeight: 700 }}>
              שלח קישור חדש
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const errorNode = (() => {
    if (!errorType) return null;
    if (errorType === "weak_password") return <div style={S.errorBox}>הסיסמה חלשה מדי. לפחות 6 תווים.</div>;
    if (errorType === "mismatch") return <div style={S.errorBox}>הסיסמאות אינן תואמות.</div>;
    return <div style={S.errorBox}>אירעה שגיאה. נסה שוב.</div>;
  })();

  if (!ready) {
    return (
      <div style={S.page} dir="rtl" lang="he">
        <div style={S.card}>
          <div style={S.logo}><div style={S.logoText}>הדר דנן</div></div>
          <div style={{ ...S.subtitle, marginBottom: 0 }}>מאמת קישור...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page} dir="rtl" lang="he">
      <div style={S.card}>
        <div style={S.logo}><div style={S.logoText}>הדר דנן</div></div>
        <div style={S.title}>איפוס סיסמה</div>
        <div style={S.subtitle}>בחר סיסמה חדשה לחשבון שלך</div>

        {errorNode}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.label}>סיסמה חדשה</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
            {password.length > 0 && (
              <div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: i <= strength.score ? strength.color : "#2C323E",
                        transition: "background 0.3s",
                      }}
                    />
                  ))}
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: strength.color }}>{strength.label}</div>
              </div>
            )}
          </div>

          <div>
            <label style={S.label}>אימות סיסמה</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
          </div>

          <button
            type="submit"
            disabled={phase === "loading"}
            style={{ ...S.submitBtn, opacity: phase === "loading" ? 0.6 : 1, cursor: phase === "loading" ? "not-allowed" : "pointer" }}
          >
            {phase === "loading" ? "מאפס..." : "אפס סיסמה"}
          </button>
        </form>

        <div style={S.bottomLink}>
          <Link href="/login" style={{ color: "#9E9990", textDecoration: "none" }}>
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </div>
  );
}
