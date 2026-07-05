// הבמאית עורכת → אישור כתוביות → תוצר: שיתוף נייטיבי ושמירה לתמונות.
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { api } from "../api";
import { C } from "../theme";

interface Line { id: string; text: string; start_ms: number; end_ms: number; deleted: boolean; edited: boolean }
interface Snap {
  status: string;
  captions: { source: string; lines: Line[] } | null;
  trim_start_ms: number | null;
  trim_end_ms: number | null;
  output_url: string | null;
}

export function PipelineScreen({ editId, takeUri, onAnother, onHome }: {
  editId: string; takeUri: string; onAnother: () => void; onHome: () => void;
}) {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [trimS, setTrimS] = useState(0);
  const [trimE, setTrimE] = useState(0);
  const [busy, setBusy] = useState(false);
  const gotCaptions = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const d = await api<Snap>(`/api/broadcast/edits/${editId}`);
      setSnap(d);
      if (d.captions && !gotCaptions.current) {
        gotCaptions.current = true;
        setLines(d.captions.lines ?? []);
        setTrimS(d.trim_start_ms ?? 0);
        setTrimE(d.trim_end_ms ?? 0);
      }
    } catch { /* next poll */ }
  }, [editId]);

  useEffect(() => {
    refresh();
    const iv = setInterval(() => {
      setSnap((s) => {
        if (s?.status !== "ready" && s?.status !== "failed") refresh();
        return s;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [refresh]);

  const approve = async () => {
    setBusy(true);
    try {
      await api(`/api/broadcast/edits/${editId}/captions`, {
        method: "POST",
        body: JSON.stringify({ mode: "captions", lines, trim_start_ms: trimS, trim_end_ms: trimE }),
      });
      gotCaptions.current = true;
      refresh();
    } catch {
      Alert.alert("שגיאה", "נסו שוב");
    } finally {
      setBusy(false);
    }
  };

  const status = snap?.status ?? "transcribing";

  if (status === "queued" || status === "transcribing" || (status === "awaiting_captions" && !lines.length && !snap?.captions)) {
    return <Waiting title="הבמאית עורכת" sub="מקשיבה לטייק ויוצרת כתוביות מסונכרנות" />;
  }

  if (status === "awaiting_captions") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}>
        <Text style={{ color: C.fg, fontSize: 22, fontWeight: "800", textAlign: "right" }}>אישור כתוביות</Text>
        <Text style={{ color: C.muted, fontSize: 13, textAlign: "right", marginTop: 6 }}>
          שום טקסט לא נצרב בלי האישור שלך
        </Text>
        <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 16 }}>
          <Trim title="תחילת הטייק" val={trimS} onMore={() => setTrimS((v) => Math.max(0, v - 250))} onLess={() => setTrimS((v) => v + 250)} />
          <Trim title="סוף הטייק" val={trimE} onMore={() => setTrimE((v) => v + 250)} onLess={() => setTrimE((v) => Math.max(trimS + 1000, v - 250))} />
        </View>
        {lines.filter((l) => !l.deleted).map((l) => (
          <View key={l.id} style={{ flexDirection: "row-reverse", gap: 8, marginTop: 10 }}>
            <TextInput
              value={l.text}
              onChangeText={(t) => setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, text: t, edited: true } : x)))}
              multiline
              style={{ flex: 1, backgroundColor: C.cardSoft, color: C.fg, borderRadius: 10, padding: 12, fontSize: 16, textAlign: "right" }}
            />
            <TouchableOpacity
              onPress={() => setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, deleted: true } : x)))}
              style={{ width: 42, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: C.muted, fontSize: 18 }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={approve} disabled={busy} style={{ backgroundColor: C.gold, borderRadius: 12, padding: 15, alignItems: "center", marginTop: 20, opacity: busy ? 0.6 : 1 }}>
          {busy ? <ActivityIndicator color="#2a1d05" /> : <Text style={{ color: "#2a1d05", fontSize: 16, fontWeight: "800" }}>אשר וסיים</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (status === "burning") return <Waiting title="הבמאית עורכת" sub="צורבת את הכתוביות ומכינה את הרילס" />;

  if (status === "ready" && snap?.output_url) {
    return <Output url={snap.output_url} editId={editId} onAnother={onAnother} onHome={onHome} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", padding: 30 }}>
      <Text style={{ color: C.fg, fontSize: 16, textAlign: "center", lineHeight: 26 }}>
        משהו לא הסתדר בעריכה. הטייק שלך שמור, אפשר לנסות שוב
      </Text>
      <TouchableOpacity onPress={onAnother} style={{ backgroundColor: C.gold, borderRadius: 12, padding: 14, marginTop: 18 }}>
        <Text style={{ color: "#2a1d05", fontWeight: "800", textAlign: "center" }}>טייק נוסף</Text>
      </TouchableOpacity>
    </View>
  );
}

function Waiting({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", padding: 30 }}>
      <ActivityIndicator color={C.gold} size="large" />
      <Text style={{ color: C.fg, fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: 18 }}>{title}</Text>
      <Text style={{ color: C.muted, fontSize: 14, textAlign: "center", marginTop: 8 }}>{sub}</Text>
    </View>
  );
}

function Trim({ title, val, onMore, onLess }: { title: string; val: number; onMore: () => void; onLess: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 12 }}>
      <Text style={{ color: C.muted, fontSize: 12, textAlign: "right" }}>{title}</Text>
      <Text style={{ color: C.fg, fontSize: 14, textAlign: "right", marginTop: 2 }}>{(val / 1000).toFixed(2)}s</Text>
      <View style={{ flexDirection: "row-reverse", gap: 6, marginTop: 8 }}>
        <MiniBtn label="להרחיב" onPress={onMore} />
        <MiniBtn label="לצמצם" onPress={onLess} />
      </View>
    </View>
  );
}

function MiniBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ borderWidth: 1, borderColor: C.lineGold, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8 }}>
      <Text style={{ color: C.gold, fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Output({ url, editId, onAnother, onHome }: { url: string; editId: string; onAnother: () => void; onHome: () => void }) {
  const player = useVideoPlayer(url, (p) => { p.loop = false; });
  const [busy, setBusy] = useState<string | null>(null);
  const approved = useRef(false);
  const localUri = useRef<string | null>(null);

  const approveOnce = () => {
    if (approved.current) return;
    approved.current = true;
    api(`/api/broadcast/edits/${editId}/approve`, { method: "POST" }).catch(() => {});
  };

  const download = async (): Promise<string> => {
    if (localUri.current) return localUri.current;
    const dest = `${FileSystem.cacheDirectory}reel-${editId}.mp4`;
    const r = await FileSystem.downloadAsync(url, dest);
    localUri.current = r.uri;
    return r.uri;
  };

  const share = async () => {
    setBusy("share");
    try {
      approveOnce();
      const uri = await download();
      await Sharing.shareAsync(uri, { mimeType: "video/mp4", UTI: "public.movie" });
    } catch {
      Alert.alert("שגיאה", "נסו שוב");
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      approveOnce();
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) throw new Error("no permission");
      const uri = await download();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("נשמר", "הרילס נשמר לתמונות שלך");
    } catch {
      Alert.alert("שגיאה", "לא הצלחנו לשמור לתמונות");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60, alignItems: "center" }}>
      <Text style={{ color: C.fg, fontSize: 22, fontWeight: "800" }}>הרילס מוכן</Text>
      <VideoView player={player} style={{ width: 260, height: 462, borderRadius: 14, backgroundColor: "#000", marginTop: 16 }} contentFit="contain" />
      <Text style={{ color: C.goldMid, fontSize: 12, letterSpacing: 1, marginTop: 10 }}>מצולם, לא מיוצר</Text>
      <View style={{ alignSelf: "stretch", marginTop: 20, gap: 10 }}>
        <TouchableOpacity onPress={share} disabled={busy !== null} style={{ backgroundColor: C.gold, borderRadius: 12, padding: 15, alignItems: "center", opacity: busy ? 0.6 : 1 }}>
          {busy === "share" ? <ActivityIndicator color="#2a1d05" /> : <Text style={{ color: "#2a1d05", fontSize: 16, fontWeight: "800" }}>שיתוף הרילס</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={save} disabled={busy !== null} style={{ borderWidth: 1, borderColor: C.lineGold, borderRadius: 12, padding: 14, alignItems: "center" }}>
          {busy === "save" ? <ActivityIndicator color={C.gold} /> : <Text style={{ color: C.gold, fontSize: 15, fontWeight: "700" }}>שמירה לתמונות</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onAnother} style={{ padding: 10, alignItems: "center" }}>
          <Text style={{ color: C.muted, fontSize: 15 }}>טייק נוסף</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onHome} style={{ padding: 4, alignItems: "center" }}>
          <Text style={{ color: C.goldMid, fontSize: 13 }}>חזרה לתסריטים</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
