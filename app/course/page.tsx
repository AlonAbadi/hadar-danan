import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "קורס דיגיטלי | בקרוב - הדר דנן",
  description: "קורס בידול מותג אישי. 8 מודולים, 16 שיעורים. בקרוב.",
  alternates: { canonical: "/course" },
};

export default function CoursePage() {
  return (
    <div
      dir="rtl"
      className="font-assistant"
      style={{
        minHeight: "100svh",
        background: "#0D1018",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        <div
          style={{
            fontSize: "3.5rem",
            marginBottom: "1.5rem",
            lineHeight: 1,
          }}
        >
          🎓
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "1rem",
            lineHeight: 1.2,
          }}
        >
          קורס דיגיטלי
        </h1>
        <p
          style={{
            fontSize: "1.4rem",
            color: "#EDE9E1",
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          בקרוב 🔜
        </p>
        <p
          style={{
            fontSize: "1.05rem",
            color: "#9E9990",
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}
        >
          8 מודולים. 16 שיעורים. שיטת TrueSignal© שעברו דרכה 3,500+ עסקים.
          <br />
          גישה לנצח — בקרוב.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            color: "#0D1018",
            fontWeight: 700,
            borderRadius: "0.5rem",
            textDecoration: "none",
            fontSize: "1rem",
          }}
        >
          חזרה לדף הבית ←
        </a>
      </div>
    </div>
  );
}
