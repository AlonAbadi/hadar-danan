import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TrueSignal© diagnostic",
  description: "Five questions to reveal your signal. Currently being prepared.",
};

export default function EnSignalPlaceholder() {
  return (
    <section
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "clamp(80px, 14vh, 160px) clamp(20px, 4vw, 40px)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-hanken-grotesk), sans-serif",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#9A7526",
          marginBottom: 24,
        }}
      >
        Coming this season
      </div>
      <h1
        style={{
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontWeight: 700,
          fontSize: "clamp(36px, 6vw, 72px)",
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          margin: 0,
          color: "#0F1011",
        }}
      >
        Your signal, prepared by hand.
      </h1>
      <p
        style={{
          fontFamily: "var(--font-hanken-grotesk), sans-serif",
          fontSize: "clamp(17px, 2vw, 20px)",
          lineHeight: 1.55,
          color: "#54565A",
          maxWidth: "52ch",
          margin: "26px auto 0",
        }}
      >
        We are finishing the English edition of the TrueSignal© diagnostic. The first opening is going out to a small list. Hold your sentence — we will write back when the five questions are ready for you.
      </p>

      <div style={{ marginTop: 40 }}>
        <Link
          href="/en"
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#0F1011",
            textDecoration: "none",
            borderBottom: "1px solid rgba(15,16,17,0.2)",
            paddingBottom: 4,
          }}
        >
          ← Back to beegood
        </Link>
      </div>
    </section>
  );
}
