const items = [
  {
    icon: "⚡",
    title: "מתחילות מיד",
    sub: "תוך שניות אחרי התשלום",
  },
  {
    icon: "🎬",
    title: "מפגש פתיחה מחכה",
    sub: "מוקלט ופתוח עכשיו",
  },
  {
    icon: "🕒",
    title: "בקצב שלכן",
    sub: "אין מחזורים, אין המתנות",
  },
];

export function InstantAccessStrip() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        margin: "12px auto 16px",
        maxWidth: 560,
        background: "rgba(201,150,74,0.06)",
        border: "1px solid rgba(201,150,74,0.25)",
        borderRadius: 14,
        padding: "14px 10px",
      }}
    >
      {items.map((it, i) => (
        <div key={i} style={{ textAlign: "center", direction: "rtl" }}>
          <div style={{ fontSize: 22, lineHeight: 1, marginBottom: 6 }}>{it.icon}</div>
          <div style={{ color: "#E8B94A", fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
            {it.title}
          </div>
          <div style={{ color: "#9E9990", fontSize: 11, lineHeight: 1.35, marginTop: 2 }}>
            {it.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
