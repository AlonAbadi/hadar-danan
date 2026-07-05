import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../api";
import { C } from "../theme";

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const login = async () => {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr("האימייל או הסיסמה לא נכונים");
    else onDone();
  };

  // Same Google account as the site: Supabase-hosted OAuth in an in-app
  // browser, PKCE code returned on the exp:// redirect and exchanged here.
  const loginGoogle = async () => {
    setBusy(true);
    setErr(null);
    try {
      const redirectTo = Linking.createURL("");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) throw error ?? new Error("no url");
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== "success") return;
      const code = new URL(res.url).searchParams.get("code");
      if (!code) throw new Error(new URL(res.url).searchParams.get("error_description") ?? "no code");
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      onDone();
    } catch {
      setErr("ההתחברות עם Google לא הושלמה. נסו שוב");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", padding: 24 }}
    >
      <Text style={{ color: C.goldMid, fontSize: 12, letterSpacing: 3, textAlign: "center", fontWeight: "700" }}>
        כוורת האות
      </Text>
      <Text style={{ color: C.fg, fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 8, marginBottom: 28 }}>
        חדר השידור
      </Text>
      <TouchableOpacity
        onPress={loginGoogle}
        disabled={busy}
        style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.lineGold, borderRadius: 12, padding: 15, alignItems: "center", opacity: busy ? 0.5 : 1, marginBottom: 18 }}
      >
        <Text style={{ color: C.fg, fontSize: 16, fontWeight: "700" }}>התחברות עם Google</Text>
      </TouchableOpacity>
      <Text style={{ color: C.muted, fontSize: 12, textAlign: "center", marginBottom: 14 }}>או עם אימייל וסיסמה</Text>
      <TextInput
        placeholder="אימייל"
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ backgroundColor: C.cardSoft, color: C.fg, borderRadius: 12, padding: 14, fontSize: 16, textAlign: "right", marginBottom: 12 }}
      />
      <TextInput
        placeholder="סיסמה"
        placeholderTextColor={C.muted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ backgroundColor: C.cardSoft, color: C.fg, borderRadius: 12, padding: 14, fontSize: 16, textAlign: "right", marginBottom: 16 }}
      />
      {err ? <Text style={{ color: C.danger, textAlign: "center", marginBottom: 12 }}>{err}</Text> : null}
      <TouchableOpacity
        onPress={login}
        disabled={busy || !email || !password}
        style={{ backgroundColor: C.gold, borderRadius: 12, padding: 15, alignItems: "center", opacity: busy || !email || !password ? 0.5 : 1 }}
      >
        {busy ? <ActivityIndicator color="#2a1d05" /> : <Text style={{ color: "#2a1d05", fontSize: 17, fontWeight: "800" }}>כניסה</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
