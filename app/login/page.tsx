"use client";

import { useState, useEffect, useRef } from "react";
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
  logo: {
    textAlign: "center" as const,
    marginBottom: 24,
  },
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
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#2C323E",
  },
  dividerText: {
    fontSize: 12,
    color: "#9E9990",
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
  passwordRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    color: "#9E9990",
    textDecoration: "none",
  },
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
  },
  bottomLink: {
    textAlign: "center" as const,
    marginTop: 20,
    fontSize: 13,
    color: "#9E9990",
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

// ── Component ─────────────────────────────────────────────────
type Phase = "idle" | "loading" | "found_lead";
type ErrorType = "wrong_password" | "unverified" | "rate_limit" | "network" | "auth_failed" | "generic";

interface LeadInfo {
  name: string | null;
  status: string;
  created_at: string;
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const supabase     = createBrowserClient();

  const redirect = searchParams.get("redirect") ?? "/account";
  const urlError = searchParams.get("error");

  const [phase, setPhase]           = useState<Phase>("idle");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [errorType, setErrorType]   = useState<ErrorType | null>(urlError === "auth_failed" ? "auth_failed" : null);
  const [wrongCount, setWrongCount] = useState(0);
  const [countdown, setCountdown]   = useState(0);
  const [leadInfo, setLeadInfo]     = useState<LeadInfo | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rate-limit countdown
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            setErrorType(null);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [countdown]);

  async function handleGoogle() {
    setPhase("loading");
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "loading") return;
    setPhase("loading");
    setErrorType(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (!error) {
        router.push(redirect);
        return;
      }

      const msg = error.message.toLowerCase();

      if (msg.includes("rate") || msg.includes("too many")) {
        setErrorType("rate_limit");
        setCountdown(60);
        setPhase("idle");
        return;
      }

      if (msg.includes("email not confirmed") || msg.includes("verify")) {
        setErrorType("unverified");
        setPhase("idle");
        return;
      }

      if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")) {
        const newCount = wrongCount + 1;
        setWrongCount(newCount);
        setErrorType("wrong_password");
        setPhase("idle");

        // After 3 wrong attempts, check if they're a known lead
        if (newCount >= 3) {
          const res = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.exists && !data.hasAuth) {
              setLeadInfo({ name: data.name, status: data.status, created_at: data.created_at });
              setPhase("found_lead");
              return;
            }
          }
        }
        return;
      }

      setErrorType("generic");
      setPhase("idle");
    } catch {
      setErrorType("network");
      setPhase("idle");
    }
  }

  async function handleResendVerification() {
    await supabase.auth.resend({ type: "signup", email });
  }

  // ── Found-lead screen ──────────────────────────────────────
  if (phase === "found_lead" && leadInfo) {
    const joined = new Date(leadInfo.created_at).toLocaleDateString("he-IL");
    return (
      <div style={S.page} dir="rtl" lang="he">
        <div style={S.card}>
          <div style={S.logo}><div style={S.logoText}>הדר דנן</div></div>
          <div style={S.title}>מצאנו אותך</div>
          <div style={S.subtitle}>
            {leadInfo.name ? `שלום ${leadInfo.name},` : ""} אתה אצלנו מ-{joined}.
            כדי להיכנס, צור סיסמה או המשך עם Google.
          </div>
          <button
            style={S.googleBtn}
            onClick={handleGoogle}
          >
            <GoogleLogo />
            המשך עם Google
          </button>
          <div style={S.divider}>
            <div style={S.dividerLine} />
            <span style={S.dividerText}>או</span>
            <div style={S.dividerLine} />
          </div>
          <Link href={`/signup?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect)}`}
            style={{ ...S.submitBtn, display: "block", textAlign: "center", textDecoration: "none", lineHeight: "1.4" }}
          >
            צור סיסמה לחשבון שלך
          </Link>
          <div style={S.bottomLink}>
            <button
              onClick={() => { setPhase("idle"); setErrorType(null); setWrongCount(0); setLeadInfo(null); }}
              style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 13, fontFamily: "Assistant, sans-serif" }}
            >
              חזרה
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Error message ──────────────────────────────────────────
  const errorNode = (() => {
    if (!errorType) return null;
    if (errorType === "wrong_password") return (
      <div style={S.errorBox}>
        סיסמה שגויה ({wrongCount}/5 ניסיונות).{" "}
        {wrongCount >= 5 && <><Link href="/forgot-password" style={{ color: "#E05555" }}>שכחת סיסמה?</Link></>}
      </div>
    );
    if (errorType === "unverified") return (
      <div style={S.errorBox}>
        האימייל לא אומת.{" "}
        <button onClick={handleResendVerification} style={{ background: "none", border: "none", color: "#E05555", cursor: "pointer", fontSize: 13, fontFamily: "Assistant, sans-serif", padding: 0, textDecoration: "underline" }}>
          שלח שוב
        </button>
      </div>
    );
    if (errorType === "rate_limit") return (
      <div style={S.errorBox}>
        יותר מדי ניסיונות. נסה שוב בעוד {countdown} שניות.
      </div>
    );
    if (errorType === "network") return (
      <div style={S.errorBox}>שגיאת רשת. בדוק חיבור ונסה שוב.</div>
    );
    if (errorType === "auth_failed") return (
      <div style={S.errorBox}>הכניסה נכשלה. נסה שוב.</div>
    );
    return <div style={S.errorBox}>אירעה שגיאה. נסה שוב.</div>;
  })();

  // ── Main form ──────────────────────────────────────────────
  return (
    <div style={S.page} dir="rtl" lang="he">
      <div style={S.card}>
        <div style={S.logo}><div style={S.logoText}>הדר דנן</div></div>
        <div style={S.title}>התחברות</div>
        <div style={S.subtitle}>כניסה לחשבון שלך</div>

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
            <div style={S.passwordRow}>
              <label style={{ ...S.label, margin: 0 }}>סיסמה</label>
              <Link href="/forgot-password" style={S.forgotLink}>שכחתי סיסמה</Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              dir="ltr"
              style={{ ...S.input, marginTop: 6 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
            />
          </div>

          <button
            type="submit"
            disabled={phase === "loading" || countdown > 0}
            style={{ ...S.submitBtn, opacity: (phase === "loading" || countdown > 0) ? 0.6 : 1, cursor: (phase === "loading" || countdown > 0) ? "not-allowed" : "pointer" }}
          >
            {phase === "loading" ? "מתחבר..." : "התחבר"}
          </button>
        </form>

        <div style={S.bottomLink}>
          אין לך חשבון?{" "}
          <Link href="/signup" style={{ color: "#E8B94A", textDecoration: "none", fontWeight: 700 }}>
            הרשמה
          </Link>
        </div>
      </div>
    </div>
  );
}
