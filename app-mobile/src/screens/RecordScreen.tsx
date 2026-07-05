// מסך הצילום — the reason this app exists: the NATIVE camera (full portrait
// frame, the phone's own framing) with the teleprompter floating above the
// lens. Constant smooth scroll at a live-adjustable WPM, drag to reposition,
// tap to pause. Takes upload resumably the moment recording stops.
import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, PanResponder, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { api, tusUpload, type Script } from "../api";
import { C } from "../theme";

const WPM_MIN = 80;
const WPM_MAX = 220;
const READ_LINE = 0.34; // fraction of prompter height
const PROMPTER_H = 240;

export interface LocalTake {
  takeId: string;
  uri: string;
  durationMs: number;
  uploaded: boolean;
}

export function RecordScreen({
  extractionId,
  script,
  onDone,
  onBack,
}: {
  extractionId: string;
  script: Script;
  onDone: (editId: string, takeUri: string) => void;
  onBack: () => void;
}) {
  useKeepAwake();
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const camRef = useRef<CameraView | null>(null);

  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [wpm, setWpm] = useState(130);
  const [takes, setTakes] = useState<LocalTake[]>([]);
  const [review, setReview] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<Record<string, number>>({});

  const startedAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- prompter scroll (rAF, dt-based; drag overrides; tap pauses) ----
  const pos = useRef(new Animated.Value(0)).current;
  const posVal = useRef(0);
  const running = useRef(false);
  const paused = useRef(false);
  const [pausedUi, setPausedUi] = useState(false);
  const textH = useRef(600);
  const wordCount = `${script.hook} ${script.body} ${script.cta}`.trim().split(/\s+/).length;
  const wpmRef = useRef(wpm);
  wpmRef.current = wpm;
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const manualUntil = useRef(0);

  const tick = useCallback((ts: number) => {
    if (!running.current) return;
    const last = lastTs.current ?? ts;
    const dt = Math.min(ts - last, 200);
    lastTs.current = ts;
    if (!paused.current && ts >= manualUntil.current) {
      const pxPerWord = Math.max(textH.current / wordCount, 1.5);
      posVal.current += (wpmRef.current / 60) * pxPerWord * (dt / 1000);
      if (posVal.current > textH.current) posVal.current = textH.current;
      pos.setValue(-posVal.current);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [pos, wordCount]);

  const startPrompter = useCallback(() => {
    running.current = true;
    paused.current = false;
    setPausedUi(false);
    lastTs.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const resetPrompter = useCallback(() => {
    posVal.current = 0;
    pos.setValue(0);
    lastTs.current = null;
  }, [pos]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_e, g) => {
        manualUntil.current = Date.now() + 3600_000;
        const next = Math.max(0, Math.min(textH.current, posVal.current - g.dy * 0.6));
        pos.setValue(-next);
      },
      onPanResponderRelease: (_e, g) => {
        posVal.current = Math.max(0, Math.min(textH.current, posVal.current - g.dy * 0.6));
        manualUntil.current = Date.now() + 1000;
      },
    })
  ).current;

  // ---- permissions ----
  useEffect(() => {
    if (camPerm && !camPerm.granted) requestCamPerm();
    if (micPerm && !micPerm.granted) requestMicPerm();
  }, [camPerm?.granted, micPerm?.granted]);

  if (!camPerm?.granted || !micPerm?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", padding: 30 }}>
        <Text style={{ color: C.fg, fontSize: 18, fontWeight: "700", textAlign: "center", lineHeight: 28 }}>
          אנחנו צריכות את המצלמה והמיקרופון
        </Text>
        <TouchableOpacity onPress={() => { requestCamPerm(); requestMicPerm(); }}
          style={{ backgroundColor: C.gold, borderRadius: 12, padding: 14, marginTop: 20 }}>
          <Text style={{ color: "#2a1d05", fontWeight: "800", textAlign: "center", fontSize: 16 }}>אישור הרשאות</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 14 }}>
          <Text style={{ color: C.muted, textAlign: "center" }}>חזרה</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- record flow ----
  const begin = async () => {
    setCountdown(3);
    resetPrompter();
    for (const n of [2, 1, 0]) {
      await new Promise((r) => setTimeout(r, 1000));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCountdown(n === 0 ? null : n);
    }
    startedAt.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(Date.now() - startedAt.current), 500);
    setRecording(true);
    startPrompter();
    try {
      const video = await camRef.current!.recordAsync({ maxDuration: 240 });
      if (video?.uri) await onTakeRecorded(video.uri, Date.now() - startedAt.current);
    } catch {
      Alert.alert("הצילום נעצר", "אפשר לנסות טייק נוסף");
    } finally {
      setRecording(false);
      running.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const stop = () => {
    running.current = false;
    camRef.current?.stopRecording();
  };

  const onTakeRecorded = async (uri: string, durationMs: number) => {
    try {
      const created = await api<{ take_id: string; object_name: string; content_type: string }>(
        "/api/broadcast/takes",
        {
          method: "POST",
          body: JSON.stringify({
            extraction_id: extractionId,
            video_number: script.number,
            mime_type: uri.endsWith(".mov") ? "video/quicktime" : "video/mp4",
          }),
        }
      );
      setTakes((prev) => [...prev, { takeId: created.take_id, uri, durationMs, uploaded: false }]);
      setReview(true);
      // iron rule: upload starts now, in the background
      tusUpload({
        fileUri: uri,
        objectName: created.object_name,
        contentType: created.content_type,
        onProgress: (p) => setUploadPct((prev) => ({ ...prev, [created.take_id]: p })),
      })
        .then(async () => {
          await api(`/api/broadcast/takes/${created.take_id}/uploaded`, {
            method: "POST",
            body: JSON.stringify({ duration_seconds: durationMs / 1000 }),
          });
          setTakes((prev) => prev.map((t) => (t.takeId === created.take_id ? { ...t, uploaded: true } : t)));
        })
        .catch(() => {
          setUploadPct((prev) => ({ ...prev, [created.take_id]: -1 }));
        });
    } catch {
      Alert.alert("שגיאה", "הטייק שמור בטלפון. בדקו חיבור ונסו שוב");
    }
  };

  const selectTake = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await api<{ edit_id: string }>(`/api/broadcast/takes/${selected}/select`, { method: "POST" });
      const take = takes.find((t) => t.takeId === selected);
      onDone(res.edit_id, take?.uri ?? "");
    } catch {
      Alert.alert("שגיאה", "לא הצלחנו לשלוח לבמאית. נסו שוב");
    } finally {
      setBusy(false);
    }
  };

  // ---- take review ----
  if (review) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 60 }}>
        <Text style={{ color: C.fg, fontSize: 22, fontWeight: "800", textAlign: "right" }}>בחר טייק</Text>
        {takes.length >= 5 ? (
          <Text style={{ color: C.muted, fontSize: 13, textAlign: "right", marginTop: 8, lineHeight: 20 }}>
            מהטייק החמישי אתה לא נהיה יותר אמיתי, רק יותר מבוקר
          </Text>
        ) : takes.length >= 1 ? (
          <Text style={{ color: C.muted, fontSize: 13, textAlign: "right", marginTop: 8 }}>
            טייק שלישי הוא כמעט תמיד הטוב ביותר
          </Text>
        ) : null}
        <View style={{ flex: 1, marginTop: 16 }}>
          {takes.map((t, i) => {
            const pct = uploadPct[t.takeId] ?? 0;
            const isSel = selected === t.takeId;
            return (
              <TouchableOpacity
                key={t.takeId}
                onPress={() => setSelected(t.takeId)}
                style={{ backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: isSel ? C.gold : C.line }}
              >
                <Text style={{ color: C.fg, fontSize: 15, fontWeight: "700", textAlign: "right" }}>
                  טייק {i + 1} · {Math.round(t.durationMs / 1000)} שניות
                </Text>
                <Text style={{ color: t.uploaded ? C.ok : pct < 0 ? C.danger : C.gold, fontSize: 12.5, textAlign: "right", marginTop: 4 }}>
                  {t.uploaded ? "✓ הועלה" : pct < 0 ? "ההעלאה נכשלה" : `מעלה ${Math.round(pct * 100)}%`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          disabled={!selected || busy || !takes.find((t) => t.takeId === selected)?.uploaded}
          onPress={selectTake}
          style={{ backgroundColor: C.gold, borderRadius: 12, padding: 15, alignItems: "center", opacity: !selected || busy || !takes.find((t) => t.takeId === selected)?.uploaded ? 0.5 : 1 }}
        >
          {busy ? <ActivityIndicator color="#2a1d05" /> : <Text style={{ color: "#2a1d05", fontSize: 16, fontWeight: "800" }}>בחר את הטייק הזה</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setReview(false)} style={{ borderWidth: 1, borderColor: C.lineGold, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 10 }}>
          <Text style={{ color: C.gold, fontSize: 15, fontWeight: "700" }}>טייק נוסף</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---- camera + prompter ----
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* responsiveOrientation: without it iOS 26 stamps app recordings with a
          landscape orientation even when the phone is held upright (the server
          also self-heals that case, but correct-at-source beats corrected) */}
      <CameraView
        ref={camRef}
        style={{ flex: 1 }}
        facing="front"
        mode="video"
        mirror
        responsiveOrientationWhenOrientationLocked
      />
      {/* teleprompter over the lens */}
      <View
        {...pan.panHandlers}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: PROMPTER_H + 60, backgroundColor: "rgba(8,12,20,0.82)", paddingTop: 54, overflow: "hidden" }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (!recording) return;
            paused.current = !paused.current;
            setPausedUi(paused.current);
          }}
          style={{ height: PROMPTER_H, overflow: "hidden" }}
        >
          <View style={{ position: "absolute", top: PROMPTER_H * READ_LINE, left: 10, right: 10, height: 2, backgroundColor: "rgba(232,185,74,0.55)", zIndex: 2 }} />
          <Animated.View style={{ transform: [{ translateY: pos }], paddingTop: PROMPTER_H * READ_LINE * 0.6, paddingHorizontal: 18, paddingBottom: 300 }}>
            <Text
              onLayout={(e) => { textH.current = Math.max(e.nativeEvent.layout.height, 100); }}
              style={{ color: C.fg, fontSize: 34, lineHeight: 50, fontWeight: "700", textAlign: "center", writingDirection: "rtl" }}
            >
              <Text style={{ color: C.gold }}>{script.hook}</Text> {script.body}
              {script.cta ? <Text style={{ color: C.gold }}> {script.cta}</Text> : null}
            </Text>
          </Animated.View>
          {pausedUi ? (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,12,20,0.5)", justifyContent: "center" }}>
              <Text style={{ color: C.gold, textAlign: "center", fontSize: 15 }}>השהיה</Text>
            </View>
          ) : null}
        </TouchableOpacity>
        {/* speed row — its own touch zone */}
        <View style={{ flexDirection: "row-reverse", justifyContent: "center", alignItems: "center", gap: 14, paddingVertical: 8 }}>
          <TouchableOpacity onPress={() => setWpm((v) => Math.max(WPM_MIN, v - 10))} style={{ width: 44, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.lineGold, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: C.gold, fontSize: 18, fontWeight: "800" }}>-</Text>
          </TouchableOpacity>
          <Text style={{ color: C.gold, fontSize: 13, fontWeight: "700", minWidth: 60, textAlign: "center" }}>{wpm} מ/ד</Text>
          <TouchableOpacity onPress={() => setWpm((v) => Math.min(WPM_MAX, v + 10))} style={{ width: 44, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.lineGold, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: C.gold, fontSize: 18, fontWeight: "800" }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {countdown !== null ? (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,12,20,0.7)", justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: C.gold, fontSize: 120, fontWeight: "800" }}>{countdown}</Text>
        </View>
      ) : null}

      {/* bottom controls */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: 40, alignItems: "center", gap: 12 }}>
        {recording ? (
          <Text style={{ color: C.fg, fontSize: 15, fontVariant: ["tabular-nums"] }}>
            {Math.floor(elapsed / 60000)}:{String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0")}
          </Text>
        ) : null}
        <TouchableOpacity
          onPress={recording ? stop : begin}
          disabled={countdown !== null}
          style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 3, borderColor: C.gold, alignItems: "center", justifyContent: "center" }}
        >
          <View style={{ width: recording ? 28 : 56, height: recording ? 28 : 56, borderRadius: recording ? 6 : 28, backgroundColor: C.gold }} />
        </TouchableOpacity>
        {!recording ? (
          <View style={{ flexDirection: "row-reverse", gap: 20 }}>
            <TouchableOpacity onPress={onBack}>
              <Text style={{ color: C.muted, fontSize: 14 }}>חזרה</Text>
            </TouchableOpacity>
            {takes.length ? (
              <TouchableOpacity onPress={() => setReview(true)}>
                <Text style={{ color: C.gold, fontSize: 14 }}>הטייקים ({takes.length})</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}
