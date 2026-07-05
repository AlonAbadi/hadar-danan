import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { supabase } from "../api";
import { C } from "../theme";

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
