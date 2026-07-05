// כוורת האות — the native filming app. Thin client over beegood.online.
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, I18nManager } from "react-native";
import { supabase } from "./src/api";
import { C } from "./src/theme";
import { LoginScreen } from "./src/screens/LoginScreen";
import { ScriptsScreen } from "./src/screens/ScriptsScreen";
import { RecordScreen } from "./src/screens/RecordScreen";
import { PipelineScreen } from "./src/screens/PipelineScreen";
import type { Script } from "./src/api";

type Route =
  | { name: "login" }
  | { name: "scripts" }
  | { name: "record"; extractionId: string; script: Script }
  | { name: "pipeline"; editId: string; takeUri: string; extractionId: string; script: Script };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "login" });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    I18nManager.allowRTL(true);
    supabase.auth.getSession().then(({ data }) => {
      setRoute(data.session ? { name: "scripts" } : { name: "login" });
      setChecked(true);
    });
  }, []);

  if (!checked) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      {route.name === "login" && <LoginScreen onDone={() => setRoute({ name: "scripts" })} />}
      {route.name === "scripts" && (
        <ScriptsScreen onFilm={(extractionId, script) => setRoute({ name: "record", extractionId, script })} />
      )}
      {route.name === "record" && (
        <RecordScreen
          extractionId={route.extractionId}
          script={route.script}
          onBack={() => setRoute({ name: "scripts" })}
          onDone={(editId, takeUri) =>
            setRoute({ name: "pipeline", editId, takeUri, extractionId: route.extractionId, script: route.script })
          }
        />
      )}
      {route.name === "pipeline" && (
        <PipelineScreen
          editId={route.editId}
          takeUri={route.takeUri}
          onAnother={() => setRoute({ name: "record", extractionId: route.extractionId, script: route.script })}
          onHome={() => setRoute({ name: "scripts" })}
        />
      )}
    </View>
  );
}
