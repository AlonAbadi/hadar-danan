"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

interface Props {
  email: string;
  redirectTo: string;
}

export function AccountSetupStep({ email, redirectTo }: Props) {
  const router   = useRouter();
  const supabase = createBrowserClient();
  const isGmail  = email.toLowerCase().endsWith("@gmail.com");

  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);

  async function handleGoogle() {
    setLoading(true);
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      // 1. Create / update auth account server-side
      const res = await fetch("/api/auth/setup-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה, נסה שוב");
        setLoading(false);
        return;
      }

      // 2. Sign in with the new password
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError("הסיסמה נשמרה, אך הכניסה נכשלה. נסה להיכנס ידנית.");
        setLoading(false);
        return;
      }

      setDone(true);
      router.push(redirectTo);
    } catch {
      setError("שגיאת רשת. בדוק חיבור ונסה שוב.");
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#34A853", fontWeight: 700, fontSize: 16 }}>
        ✓ הכל מוכן — נכנסים...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        background: "linear-gradient(145deg, #141820, #0D1018)",
        border: "1px solid rgba(201,150,74,0.25)",
        borderRadius: 16,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
      }}
    >
      {/* Header */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#EDE9E1", marginBottom: 4 }}>
          צעד אחרון — הגדר גישה לתוכן
        </div>
        <div style={{ fontSize: 13, color: "#9E9990" }}>
          בחר איך להיכנס בפעם הבאה מכל מכשיר
        </div>
      </div>

      {/* Google button — only for Gmail */}
      {isGmail && (
        <>
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #2C323E",
              background: loading ? "#1D2430" : "#fff",
              color: "#1A1A1A",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontFamily: "Assistant, sans-serif",
              transition: "opacity 0.15s",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <GoogleLogo />
            המשך עם גוגל
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#2C323E" }} />
            <span style={{ fontSize: 12, color: "#9E9990" }}>או</span>
            <div style={{ flex: 1, height: 1, background: "#2C323E" }} />
          </div>
        </>
      )}

      {/* Password form */}
      <form onSubmit={handlePassword} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#9E9990", fontWeight: 600 }}>
          בחר סיסמה
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="לפחות 6 תווים"
          disabled={loading}
          required
          minLength={6}
          style={{
            width: "100%",
            background: "#0D1219",
            border: "1px solid #2C323E",
            borderRadius: 8,
            padding: "11px 14px",
            color: "#EDE9E1",
            fontSize: 15,
            fontFamily: "Assistant, sans-serif",
            outline: "none",
            direction: "ltr",
          }}
        />

        {error && (
          <div style={{
            background: "rgba(224,85,85,0.1)",
            border: "1px solid rgba(224,85,85,0.3)",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#E05555",
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || password.length < 6}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 10,
            border: "none",
            background: loading || password.length < 6
              ? "#2C323E"
              : "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            color: loading || password.length < 6 ? "#9E9990" : "#0D1018",
            fontSize: 15,
            fontWeight: 800,
            cursor: loading || password.length < 6 ? "not-allowed" : "pointer",
            fontFamily: "Assistant, sans-serif",
            transition: "all 0.15s",
          }}
        >
          {loading ? "רגע..." : "שמור וכנס לתוכן ←"}
        </button>
      </form>

      <div style={{ fontSize: 12, color: "#9E9990", textAlign: "center" }}>
        האימייל שלך: <span style={{ direction: "ltr", display: "inline-block" }}>{email}</span>
      </div>
    </div>
  );
}
