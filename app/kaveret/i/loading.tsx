// The bee rides the timeline while the locked kaveret is prepared server-side.
import { BeeWait } from "@/components/BeeWait";

export default function KaveretVisitorLoading() {
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", background: "#080C14", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <BeeWait title="פותחים את הכוורת שלך" durationMs={6000} showFacts={false} />
      </div>
    </div>
  );
}
