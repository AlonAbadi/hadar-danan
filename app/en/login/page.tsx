// English sign-in for The Signal Hive members. Mirrors /login's auth flow
// (Google OAuth + email/password via the browser client — the one sanctioned
// client-side Supabase use) inside the /en editorial chrome, so an English
// member whose session expired never lands on a Hebrew screen.
"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/browser";

const GOLD = "#C2973F";

function LoginEnInner() {
  const supabase = createBrowserClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("next") || "/en/kaveret";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setBusy(true);
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (!err) {
      router.push(redirect);
      return;
    }
    const msg = err.message.toLowerCase();
    setError(
      msg.includes("rate") || msg.includes("too many")
        ? "Too many attempts. Wait a minute and try again."
        : msg.includes("confirm") || msg.includes("verify")
        ? "This email is not confirmed yet. Check your inbox for the confirmation link."
        : "That email and password combination did not work."
    );
    setBusy(false);
  }

  const field: React.CSSProperties = {
    width: "100%",
    background: "#15130F",
    border: "1px solid rgba(194,151,63,0.25)",
    borderRadius: 10,
    color: "#EFEAE0",
    padding: "13px 14px",
    fontSize: 15,
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#0D0C0A", color: "#EFEAE0", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/en" style={{ color: "#EFEAE0", textDecoration: "none", fontWeight: 700, letterSpacing: "0.04em" }}>
          beegood
        </Link>
        <span style={{ color: "#8d8779", fontSize: 13 }}>The Signal Hive</span>
      </nav>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px 64px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Sign in</h1>
          <p style={{ color: "#8d8779", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Your hive is waiting - the signal, the episodes, the broadcast room.
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            style={{
              marginTop: 24,
              width: "100%",
              background: "#EFEAE0",
              color: "#15130F",
              border: "none",
              borderRadius: 10,
              padding: "13px 14px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <span style={{ flex: 1, height: 1, background: "rgba(239,234,224,0.12)" }} />
            <span style={{ color: "#8d8779", fontSize: 12 }}>or</span>
            <span style={{ flex: 1, height: 1, background: "rgba(239,234,224,0.12)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              required
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={field}
            />
            <input
              type="password"
              required
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={field}
            />
            {error ? (
              <p style={{ color: "#e08f8f", fontSize: 13, margin: 0, lineHeight: 1.5 }}>{error}</p>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              style={{
                background: GOLD,
                color: "#15130F",
                border: "none",
                borderRadius: 10,
                padding: "13px 14px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p style={{ color: "#8d8779", fontSize: 13, marginTop: 18, lineHeight: 1.7 }}>
            No account yet? Your entrance link arrives by email when you join{" "}
            <Link href="/en/hive" style={{ color: GOLD }}>The Signal Hive</Link>.
            <br />
            Forgot your password? <Link href="/forgot-password" style={{ color: GOLD }}>Reset it here</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginEnPage() {
  return (
    <Suspense fallback={null}>
      <LoginEnInner />
    </Suspense>
  );
}
