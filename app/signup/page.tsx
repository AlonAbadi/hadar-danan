"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

// ── Styles ────────────────────────────────────────────────────
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
  dividerText: { fontSize: 12, color: "#9E9990" },
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
  infoBox: {
    background: "rgba(232,185,74,0.08)",
    border: "1px solid rgba(232,185,74,0.25)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#E8B94A",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.5,
    textAlign: "center" as const,
  },
  bottomLink: {
    textAlign: "center" as const,
    marginTop: 20,
    fontSize: 13,
    color: "#9E9990",
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    transition: "background 0.3s, width 0.3s",
  },
  strengthLabel: {
    fontSize: 11,
    marginTop: 4,
  },
};

// ── Google Logo SVG ───────────────────────────────────────────
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

// ── Password strength ─────────────────────────────────────────
function getStrength(pw: string): { score: 0 | 1 | 2; label: string; color: string } {
  if (pw.length < 6) return { score: 0, label: "חלשה", color: "#E05555" };
  const checks = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const passed = checks.filter((r) => r.test(pw)).length;
  if (pw.length >= 8 && passed >= 2) return { score: 2, label: "חזקה", color: "#34A853" };
  return { score: 1, label: "בינונית", color: "#E8B94A" };
}

// ── Component ─────────────────────────────────────────────────
type Phase = "idle" | "loading" | "check_email";
type ErrorType = "email_taken" | "weak_password" | "invalid_email" | "google_user" | "network" | "generic";

function SignupPageInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const supabase     = createBrowserClient();

  const redirect      = searchParams.get("redirect") ?? "/account";
  const prefillEmail  = searchParams.get("email") ?? "";

  const [phase, setPhase]         = useState<Phase>("idle");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState(prefillEmail);
  const [password, setPassword]   = useState("");
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [sentEmail, setSentEmail] = useState("");

  const strength = getStrength(password);

  async function handleGoogle() {
    setPhase("loading");
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  async function handleResend() {
    await supabase.auth.resend({ type: "signup", email: sentEmail });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "loading") return;
    setErrorType(null);

    if (strength.score === 0) {
      setErrorType("weak_password");
      return;
    }

    setPhase("loading");

    try {
      // Check if email is a Google-only account (has auth_id but via Google)
      const checkRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.exists && checkData.hasAuth) {
          setErrorType("google_user");
          setPhase("idle");
          return;
        }
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });

      if (!error) {
        setSentEmail(email);
        setPhase("check_email");
        return;
      }

      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("taken")) {
        setErrorType("email_taken");
      } else if (msg.includes("password") || msg.includes("weak")) {
        setErrorType("weak_password");
      } else if (msg.includes("email") || msg.includes("invalid")) {
        setErrorType("invalid_email");
      } else {
        setErrorType("generic");
      }
      setPhase("idle");
    } catch {
      setErrorType("network");
      setPhase("idle");
    }
  }

  // ── Check email screen ────────────────────────────────────
  if (phase === "check_email") {
    return (
      <div style={S.page} dir="rtl" lang="he">
        <div style={S.card}>
          <div style={S.title}>בדוק את האימייל שלך</div>
          <div style={S.subtitle}>
            שלחנו קישור אימות לכתובת<br />
            <strong style={{ color: "#EDE9E1" }}>{sentEmail}</strong>
          </div>
          <div style={S.infoBox}>
            לחץ על הקישור באימייל כדי להפעיל את החשבון שלך.
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button
              onClick={handleResend}
              style={{ background: "none", border: "none", color: "#E8B94A", cursor: "pointer", fontSize: 13, fontFamily: "Assistant, sans-serif", textDecoration: "underline" }}
            >
              לא קיבלת? שלח שוב
            </button>
          </div>
          <div style={S.bottomLink}>
            <Link href="/login" style={{ color: "#9E9990", textDecoration: "none" }}>
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error message ─────────────────────────────────────────
  const errorNode = (() => {
    if (!errorType) return null;
    if (errorType === "email_taken") return (
      <div style={S.errorBox}>
        כתובת אימייל זו כבר רשומה.{" "}
        <Link href="/login" style={{ color: "#E05555" }}>להתחברות</Link>
      </div>
    );
    if (errorType === "google_user") return (
      <div style={S.errorBox}>
        כתובת אימייל זו מחוברת דרך Google. יש להשתמש בכפתור "המשך עם Google".
      </div>
    );
    if (errorType === "weak_password") return (
      <div style={S.errorBox}>הסיסמה חלשה מדי. לפחות 6 תווים.</div>
    );
    if (errorType === "invalid_email") return (
      <div style={S.errorBox}>כתובת אימייל לא תקינה.</div>
    );
    if (errorType === "network") return (
      <div style={S.errorBox}>שגיאת רשת. בדוק חיבור ונסה שוב.</div>
    );
    return <div style={S.errorBox}>אירעה שגיאה. נסה שוב.</div>;
  })();

  // ── Main form ─────────────────────────────────────────────
  return (
    <div style={S.page} dir="rtl" lang="he">
      <div style={S.card}>
        <div style={S.title}>יצירת חשבון</div>
        <div style={S.subtitle}>הצטרף אלינו בחינם</div>

        {errorNode}

        <button
          style={{ ...S.googleBtn, opacity: phase === "loading" ? 0.6 : 1 }}
          onClick={handleGoogle}
          disabled={phase === "loading"}
        >
          <GoogleLogo />
          המשך עם Google
        </button>

        <div style={S.divider}>
          <div style={S.dividerLine} />
          <span style={S.dividerText}>או</span>
          <div style={S.dividerLine} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={S.label}>שם מלא</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ישראל ישראלי"
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
          </div>

          <div>
            <label style={S.label}>אימייל</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="israel@example.com"
              dir="ltr"
              style={S.input}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
          </div>

          <div>
            <label style={S.label}>סיסמה</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              style={{ ...S.input, marginTop: 0 }}
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
                <div style={{ ...S.strengthLabel, color: strength.color }}>{strength.label}</div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={phase === "loading"}
            style={{ ...S.submitBtn, opacity: phase === "loading" ? 0.6 : 1, cursor: phase === "loading" ? "not-allowed" : "pointer" }}
          >
            {phase === "loading" ? "יוצר חשבון..." : "צור חשבון"}
          </button>
        </form>

        <div style={S.bottomLink}>
          כבר יש לך חשבון?{" "}
          <Link href="/login" style={{ color: "#E8B94A", textDecoration: "none", fontWeight: 700 }}>
            התחבר
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageInner />
    </Suspense>
  );
}
