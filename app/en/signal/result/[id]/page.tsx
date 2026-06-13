import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { validateSignalOutputEn, type SignalOutputEn } from "@/lib/prompts/signal-engine-en";

export const metadata: Metadata = {
  title: "Your signal",
  description: "Your TrueSignal© diagnostic, prepared by hand.",
  robots: { index: false, follow: false },
};

type ResultRow = {
  id:           string;
  user_id:      string;
  signal:       SignalOutputEn;
  generated_at: string;
};

async function fetchResult(id: string): Promise<ResultRow | null> {
  const db = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from("signal_extractions")
    .select("id, user_id, signal, generated_at")
    .eq("id", id)
    .maybeSingle();

  if (!data?.signal) return null;
  if (!validateSignalOutputEn(data.signal)) return null;

  return data as ResultRow;
}

export default async function EnSignalResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await fetchResult(id);
  if (!row) notFound();

  const s = row.signal;
  const letterNo = id.replace(/[^0-9]/g, "").slice(-3).padStart(3, "0") || "001";
  const dateStr = new Date(row.generated_at).toLocaleDateString("en-US", {
    day:   "numeric",
    month: "long",
    year:  "numeric",
  });

  const paper     = "#F4EFE4";
  const paperDeep = "#EBE3D2";
  const card      = "#FCFAF3";
  const ink       = "#211B12";
  const inkSoft   = "#594F41";
  const inkFaint  = "#988D7B";
  const goldDeep  = "#6F521A";
  const goldLeaf  = "#BE9540";
  const line      = "rgba(33,27,18,0.12)";
  const lineSoft  = "rgba(33,27,18,0.08)";
  const ctaBg     = "#211B12";
  const ctaFg     = "#F4EFE4";

  return (
    <div style={{ background: paper, color: ink, minHeight: "100vh", fontFamily: "var(--font-spectral), Georgia, serif" }}>
      <header
        style={{
          maxWidth:       1120,
          margin:         "0 auto",
          padding:        "30px clamp(22px, 5vw, 40px) 0",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            14,
          flexWrap:       "wrap",
        }}
      >
        <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: ink }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "#111113", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src="/beegood_logo.png" alt="beegood" width={20} height={20} style={{ width: "64%", height: "auto", display: "block" }} />
          </div>
          <span style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 21, fontWeight: 500, letterSpacing: "-0.01em" }}>
            beegood
          </span>
        </Link>
        <div style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: goldDeep }}>
          Prepared for you · No. {letterNo}
        </div>
      </header>

      {/* Hero — the signal sentence */}
      <section
        style={{
          maxWidth:  840,
          margin:    "0 auto",
          padding:   "clamp(56px, 9vh, 104px) clamp(22px, 5vw, 40px) clamp(60px, 9vh, 100px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color:         goldDeep,
            marginBottom:  22,
          }}
        >
          Your signal
        </div>
        <p
          style={{
            fontFamily: "var(--font-spectral), Georgia, serif",
            fontStyle:  "italic",
            fontSize:   "clamp(17px, 2vw, 20px)",
            lineHeight: 1.5,
            color:      inkSoft,
            margin:     "0 0 40px",
          }}
        >
          From your five answers, one thing came through clearly.
        </p>
        <div style={{ width: 34, height: 1, background: goldLeaf, margin: "0 auto 36px" }} />
        <h1
          style={{
            fontFamily:    "var(--font-spectral), Georgia, serif",
            fontStyle:     "italic",
            fontWeight:    400,
            fontSize:      "clamp(32px, 5.2vw, 62px)",
            lineHeight:    1.18,
            letterSpacing: "-0.02em",
            color:         ink,
            margin:        "0 auto",
            maxWidth:      "18ch",
          }}
        >
          {s.signal}
        </h1>
        <div style={{ width: 34, height: 1, background: goldLeaf, margin: "36px auto 0" }} />
        <p
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12.5,
            letterSpacing: "0.06em",
            color:         inkFaint,
            margin:        "30px 0 0",
          }}
        >
          This is yours. You can say it out loud.
        </p>
      </section>

      <div style={{ maxWidth: 640, margin: "0 auto", height: 1, background: lineSoft }} />

      {/* What we saw — 3 fields */}
      <section style={{ maxWidth: 660, margin: "0 auto", padding: "clamp(72px, 11vw, 96px) clamp(22px, 5vw, 40px) 40px" }}>
        <div style={{ width: 26, height: 2, background: goldLeaf, marginBottom: 22 }} />
        <div
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      11.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color:         goldDeep,
            marginBottom:  34,
          }}
        >
          What we saw
        </div>

        <Row label="The element you work in" body={s.element} lineColor={lineSoft} inkFaint={inkFaint} ink={ink} />
        <Row label="Who is looking for you" body={s.people} lineColor={lineSoft} inkFaint={inkFaint} ink={ink} />
        <BulletRow
          label="Where to begin, this week"
          items={s.content_directions}
          lineColor={lineSoft}
          inkFaint={inkFaint}
          ink={ink}
          isLast
        />
      </section>

      {/* Warm note from founders */}
      <section style={{ maxWidth: 660, margin: "0 auto", padding: "clamp(40px, 6vw, 60px) clamp(22px, 5vw, 40px)", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-spectral), Georgia, serif",
            fontStyle:  "italic",
            fontSize:   "clamp(17px, 2vw, 20px)",
            lineHeight: 1.55,
            color:      inkSoft,
            margin:     "0 auto",
            maxWidth:   "40ch",
          }}
        >
          {s.warm_note}
        </p>
        <div style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 18, letterSpacing: "-0.01em", color: ink, marginTop: 28 }}>
          Hadar &amp; Alon
        </div>
        <div style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 11, letterSpacing: "0.06em", color: inkFaint, marginTop: 5 }}>
          Founders of beegood
        </div>
      </section>

      {/* Soft upgrade CTA — Signal Kit teaser */}
      <section style={{ background: paperDeep }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "clamp(76px, 12vw, 100px) clamp(22px, 5vw, 40px)", textAlign: "center" }}>
          <h2
            style={{
              fontFamily:    "var(--font-spectral), Georgia, serif",
              fontWeight:    400,
              fontSize:      "clamp(26px, 3.6vw, 36px)",
              lineHeight:    1.3,
              letterSpacing: "-0.02em",
              color:         ink,
              margin:        0,
            }}
          >
            The signal is yours — free, and forever.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-spectral), Georgia, serif",
              fontSize:   "clamp(17px, 2vw, 19px)",
              lineHeight: 1.7,
              color:      inkSoft,
              margin:     "22px auto 0",
              maxWidth:   "46ch",
            }}
          >
            When you are ready to build a body of work from it — the posts, the rhythm, the reach — we will make the rest with you, in your voice.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22, flexWrap: "wrap", marginTop: 36 }}>
            <Link
              href="/en"
              style={{
                fontFamily:     "var(--font-hanken-grotesk), sans-serif",
                fontSize:       12.5,
                fontWeight:     500,
                letterSpacing:  "0.18em",
                textTransform:  "uppercase",
                color:          ctaFg,
                background:     ctaBg,
                border:         "none",
                borderRadius:   4,
                padding:        "15px 30px",
                textDecoration: "none",
                display:        "inline-flex",
                alignItems:     "center",
                gap:            10,
              }}
            >
              Continue with beegood <span style={{ fontSize: 15 }}>→</span>
            </Link>
            <Link
              href="/en/signal"
              style={{
                fontFamily:     "var(--font-hanken-grotesk), sans-serif",
                fontSize:       12,
                letterSpacing:  "0.06em",
                color:          inkSoft,
                textDecoration: "none",
                borderBottom:   `1px solid ${line}`,
                paddingBottom:  2,
              }}
            >
              Take the five questions again
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${lineSoft}` }}>
        <div
          style={{
            maxWidth:       1120,
            margin:         "0 auto",
            padding:        "42px clamp(22px, 5vw, 40px) 56px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            gap:            20,
            flexWrap:       "wrap",
          }}
        >
          <Link href="/en" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: ink }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "#111113", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src="/beegood_logo.png" alt="" width={15} height={15} style={{ width: "64%", height: "auto", display: "block" }} />
            </div>
            <span style={{ fontFamily: "var(--font-spectral), Georgia, serif", fontSize: 17 }}>beegood</span>
          </Link>
          <div style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 11.5, color: inkFaint }}>
            The TrueSignal© Method · Wherever you are, in every language · {dateStr}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Row({
  label, body, lineColor, inkFaint, ink,
}: { label: string; body: string; lineColor: string; inkFaint: string; ink: string }) {
  return (
    <div style={{ padding: "26px 0", borderTop: `1px solid ${lineColor}` }}>
      <div
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      10.5,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color:         inkFaint,
          marginBottom:  10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily:    "var(--font-spectral), Georgia, serif",
          fontSize:      "clamp(19px, 2.4vw, 22px)",
          lineHeight:    1.5,
          letterSpacing: "-0.01em",
          color:         ink,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function BulletRow({
  label, items, lineColor, inkFaint, ink, isLast,
}: {
  label: string;
  items: [string, string, string];
  lineColor: string;
  inkFaint: string;
  ink: string;
  isLast?: boolean;
}) {
  return (
    <div
      style={{
        padding:       "26px 0",
        borderTop:     `1px solid ${lineColor}`,
        borderBottom:  isLast ? `1px solid ${lineColor}` : undefined,
      }}
    >
      <div
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      10.5,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color:         inkFaint,
          marginBottom:  12,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily:    "var(--font-spectral), Georgia, serif",
          fontSize:      "clamp(19px, 2.4vw, 22px)",
          lineHeight:    1.85,
          letterSpacing: "-0.01em",
          color:         ink,
        }}
      >
        {items.map((it, i) => (
          <div key={i}>{it}</div>
        ))}
      </div>
    </div>
  );
}
