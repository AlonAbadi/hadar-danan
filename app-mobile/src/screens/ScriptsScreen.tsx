import { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { api, type Script } from "../api";
import { C } from "../theme";

export function ScriptsScreen({
  onFilm,
}: {
  onFilm: (extractionId: string, script: Script) => void;
}) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [filmed, setFilmed] = useState<number[]>([]);
  const [extractionId, setExtractionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<{ extraction_id: string | null; scripts: Script[]; filmed: number[] }>(
        "/api/broadcast/scripts"
      );
      setScripts(d.scripts ?? []);
      setFilmed(d.filmed ?? []);
      setExtractionId(d.extraction_id);
    } catch {
      /* pull to refresh retries */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center" }}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        data={scripts}
        keyExtractor={(s) => String(s.number)}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.gold} />
        }
        ListHeaderComponent={
          <Text style={{ color: C.fg, fontSize: 24, fontWeight: "800", textAlign: "right", marginBottom: 16 }}>
            התסריטים שלך
          </Text>
        }
        ListEmptyComponent={
          <Text style={{ color: C.muted, fontSize: 15, textAlign: "center", marginTop: 40, lineHeight: 24 }}>
            ערכת יום הצילום עוד לא נבנתה.{"\n"}בונים אותה באתר, בעמוד הכוורת.
          </Text>
        }
        renderItem={({ item }) => {
          const done = filmed.includes(item.number);
          return (
            <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(232,185,74,0.14)" }}>
              <Text style={{ color: C.fg, fontSize: 16, fontWeight: "700", textAlign: "right" }}>
                {done ? "✓ " : ""}{item.number}. {item.title}
              </Text>
              <Text numberOfLines={2} style={{ color: C.muted, fontSize: 14, textAlign: "right", marginTop: 6, lineHeight: 21 }}>
                {item.hook}
              </Text>
              <TouchableOpacity
                onPress={() => extractionId && onFilm(extractionId, item)}
                style={{ backgroundColor: done ? "transparent" : C.gold, borderWidth: done ? 1 : 0, borderColor: C.lineGold, borderRadius: 12, padding: 13, alignItems: "center", marginTop: 12 }}
              >
                <Text style={{ color: done ? C.gold : "#2a1d05", fontSize: 15, fontWeight: "800" }}>
                  {done ? "טייק נוסף" : "לצלם עכשיו"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}
