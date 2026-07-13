// The Signal Hive — English member home client.
// A focused LTR port of app/kaveret/KaveretClient.tsx: signal board, series
// shelf, episode scripts, social texts, designed assets. Styled with the
// /en Business OS palette (see app/en/signal/result/[id]/page.tsx), not the
// Hebrew Santosha module.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const BEE = "/beegood_logo.png";

// Business OS palette (matches /en pages)
const C = {
  bg:        "#0D0C0A",
  panel:     "#111009",
  card:      "#161410",
  cardSoft:  "#1A1814",
  border:    "rgba(242,237,228,0.10)",
  gold:      "#C2973F",
  goldDeep:  "#9A7526",
  goldFaint: "rgba(194,151,63,0.22)",
  green:     "#7FBF8E",
  red:       "#E08A8A",
  text:      "#F2EDE4",
  textSoft:  "rgba(242,237,228,0.78)",
  textMute:  "rgba(242,237,228,0.55)",
  textFaint: "rgba(242,237,228,0.36)",
  ctaBg:     "#C2973F",
  ctaFg:     "#0D0C0A",
};

export interface EpisodeScript {
  number: number;
  title: string;
  hook: string;
  body: string;
  cta: string;
  interviewQuestions?: string[];
}

export interface HiveHomeData {
  firstName: string;
  signal: string;
  element: string;
  promise: string;
  tool: string;
  people: string;
  bioInstagram: string;
  linkedinHeadline: string;
  facebookAbout: string;
  aboutSite: string;
  manifesto: string;
  identity: string;
  scripts: EpisodeScript[];
  extractionId: string | null;
  filmedNumbers: number[];
  takesPerScript: Record<number, number>;
  seasonUsed: number;
  seasonCap: number;
  email: string;
  takesCap: number;
}

interface Reel {
  editId: string;
  reviewItemId: string | null;
  videoNumber: number | null;
  createdAt: string;
  published: boolean;
  thumbUrl: string | null;
  downloadUrl: string | null;
}

// Canonical titles for the seven episodes — English mirror of the Hebrew
// methodology set. Placeholders on unbuilt rows, fallbacks when a generated
// video lacks a title.
const CANONICAL_TITLES: Record<number, string> = {
  1: "The problem",
  2: "The story",
  3: "The genius zone",
  4: "The opinion",
  5: "Breaking objections",
  6: "Story and opinion",
  7: "Testimonial and invitation",
};

// The kit's designed visual assets — same renderer API the Hebrew page uses
// (language-agnostic: it renders the extraction's own fields).
const VISUAL_ASSETS = [
  { type: "share-card-default", label: "Your public statement" },
  { type: "quote-signal", label: "Your signal" },
  { type: "quote-promise", label: "The promise" },
  { type: "quote-people", label: "Your audience" },
  { type: "quote-content-1", label: "Content direction 01" },
  { type: "quote-content-2", label: "Content direction 02" },
  { type: "quote-content-3", label: "Content direction 03" },
] as const;

function assetUrl(extractionId: string, type: string, bg: "color" | "image" = "color"): string {
  const q = `style=editorial&bg=${bg}&v=12&clean=1`;
  return type === "share-card-default"
    ? `/api/signal/${extractionId}/share-card?${q}`
    : `/api/signal/${extractionId}/asset?type=${type}&${q}`;
}

function safeJson(t: string): Record<string, unknown> | null {
  try { return JSON.parse(t); } catch { return null; }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function reelDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "Asia/Jerusalem",
    month: "long",
    day: "numeric",
  });
}

export function HiveHomeClient({ data }: { data: HiveHomeData }) {
  const [toastMsg, setToastMsg] = useState("Copied to clipboard");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const spyLockRef = useRef(0);
  const zonesRef = useRef<(HTMLElement | null)[]>([]);
  const scriptsZoneRef = useRef<HTMLElement | null>(null);
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [deletedReels, setDeletedReels] = useState<Record<string, boolean>>({});
  const [viewerEditId, setViewerEditId] = useState<string | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);

  // Reels hydrate after first paint — same API the Hebrew home uses.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/broadcast/reels")
      .then((r) => (r.ok ? r.json() : { reels: [] }))
      .then((d) => {
        if (cancelled || !Array.isArray(d.reels)) return;
        setReels(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          d.reels.map((r: any) => ({
            editId: r.edit_id,
            reviewItemId: r.review_item_id,
            videoNumber: r.video_number,
            createdAt: r.created_at,
            published: r.published === true,
            thumbUrl: r.thumb_url ?? null,
            downloadUrl: r.download_url ?? null,
          }))
        );
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 1800);
  }, []);

  const copyText = useCallback(async (text: string) => {
    const t = text.trim();
    let ok = false;
    try {
      await navigator.clipboard.writeText(t);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { /* stays false */ }
      document.body.removeChild(ta);
    }
    toast(ok ? "Copied to clipboard" : "Copy failed");
    if (ok && navigator.vibrate) navigator.vibrate(6);
  }, [toast]);

  // Tab bar: tap scrolls, scrollspy follows (spy-locked while a tap-scroll
  // is in flight — same behavior as the Hebrew home).
  const goTab = useCallback((i: number) => {
    spyLockRef.current = Date.now() + 900;
    zonesRef.current[i]?.scrollIntoView({ behavior: "smooth" });
    setActiveTab(i);
    if (navigator.vibrate) navigator.vibrate(6);
  }, []);

  useEffect(() => {
    const onScrollEnd = () => { spyLockRef.current = 0; };
    if ("onscrollend" in window) addEventListener("scrollend", onScrollEnd);
    const spy = new IntersectionObserver(
      (es) => {
        if (Date.now() < spyLockRef.current) return;
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = Number((e.target as HTMLElement).dataset.tabIndex);
          if (Number.isInteger(idx)) setActiveTab(idx);
        });
      },
      { rootMargin: "-25% 0px -55% 0px" }
    );
    zonesRef.current.forEach((z) => { if (z) spy.observe(z); });
    if (scriptsZoneRef.current) spy.observe(scriptsZoneRef.current);
    return () => {
      spy.disconnect();
      removeEventListener("scrollend", onScrollEnd);
    };
  }, []);

  const liveReels = reels.filter((r) => !deletedReels[r.editId]);
  const seasonTotal = data.seasonCap || 7;

  const episodeName = (r: Reel): string => {
    const script = data.scripts.find((s) => s.number === r.videoNumber);
    return script?.title || `Filmed ${reelDate(r.createdAt)}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif",
        paddingBottom: 96,
      }}
    >
      <style>{`
        @keyframes hivePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.35; transform: scale(0.65); }
        }
        .hive-shelf::-webkit-scrollbar { display: none; }
        .hive-shelf { scrollbar-width: none; }
        details.hive-acc > summary { list-style: none; }
        details.hive-acc > summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* Top bar — beegood wordmark + "Your Hive" */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(13,12,10,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "14px clamp(20px, 4vw, 32px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Image
              src={BEE}
              alt="beegood"
              width={34}
              height={27}
              style={{ width: "auto", height: 27, display: "block" }}
            />
            <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>beegood</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.gold,
            }}
          >
            Your Hive
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "0 clamp(20px, 4vw, 32px)" }}>

        {/* ── Zone 0 · Signal board ─────────────────────────────────── */}
        <section
          data-tab-index={0}
          ref={(el) => { zonesRef.current[0] = el; }}
          style={{ paddingTop: "clamp(36px, 6vh, 64px)" }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: C.gold,
              marginBottom: 14,
            }}
          >
            The Signal Hive{data.firstName ? ` · Prepared for ${data.firstName}` : ""}
          </div>
          <h1
            style={{
              fontSize: "clamp(30px, 5vw, 48px)",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              margin: "0 0 28px",
            }}
          >
            Your signal, ready to work.
          </h1>

          {data.signal ? (
            <div
              style={{
                background: `linear-gradient(145deg, ${C.cardSoft}, ${C.card})`,
                border: `1px solid ${C.gold}`,
                borderRadius: 20,
                padding: "clamp(28px, 4vw, 44px) clamp(22px, 3.5vw, 38px)",
                textAlign: "center",
                boxShadow: "0 12px 32px rgba(194,151,63,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: C.gold,
                  marginBottom: 16,
                }}
              >
                The signal
              </div>
              <p
                style={{
                  fontSize: "clamp(19px, 2.8vw, 26px)",
                  fontStyle: "italic",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  letterSpacing: "-0.02em",
                  margin: "0 0 24px",
                }}
              >
                &ldquo;{data.signal}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => copyText(data.signal)}
                style={{
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: C.ctaFg,
                  background: C.ctaBg,
                  border: "none",
                  borderRadius: 10,
                  padding: "11px 22px",
                  cursor: "pointer",
                }}
              >
                Copy the line
              </button>
            </div>
          ) : null}

          <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
            {([
              ["The element you work in", data.element],
              ["What your signal promises", data.promise],
              ["Your central tool", data.tool],
              ["Who is looking for you", data.people],
            ] as const)
              .filter(([, text]) => text.trim().length > 0)
              .map(([label, text]) => (
                <BoardCard key={label} label={label} text={text} onCopy={() => copyText(text)} />
              ))}
          </div>
        </section>

        {/* ── Zone 1 · Your series ──────────────────────────────────── */}
        <section
          data-tab-index={1}
          ref={(el) => { zonesRef.current[1] = el; }}
          style={{ paddingTop: "clamp(52px, 8vh, 84px)" }}
        >
          <ZoneHead no="01" title="Your series" hint="Your first episode is free. A body of work that keeps growing" />

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              margin: "18px 0 12px",
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>Season one</span>
            <span style={{ fontSize: 12.5, color: C.textMute }}>
              {liveReels.length} of {seasonTotal} episodes
            </span>
            {liveReels.length >= seasonTotal ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.green,
                  border: `1px solid rgba(127,191,142,0.4)`,
                  borderRadius: 999,
                  padding: "3px 10px",
                }}
              >
                Season complete
              </span>
            ) : null}
          </div>

          <div
            className="hive-shelf"
            style={{
              display: "flex",
              gap: 14,
              overflowX: "auto",
              paddingBottom: 8,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {liveReels.map((r, idx) => {
              const isPub = r.published || published[r.editId];
              return (
                <div key={r.editId} style={{ flex: "0 0 150px", width: 150 }}>
                  <button
                    type="button"
                    aria-label={`Open episode ${pad2(idx + 1)}`}
                    onClick={() => setViewerEditId(r.editId)}
                    style={{
                      position: "relative",
                      display: "block",
                      width: "100%",
                      aspectRatio: "9 / 16",
                      borderRadius: 14,
                      overflow: "hidden",
                      border: `1px solid ${C.border}`,
                      background: C.card,
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {r.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.thumbUrl}
                        alt=""
                        loading="lazy"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : null}
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(13,12,10,0.85) 0%, transparent 55%)",
                      }}
                    />
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: "rgba(13,12,10,0.62)",
                        border: `1px solid ${C.goldFaint}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill={C.gold} aria-hidden="true">
                        <path d="M8 5.5v13l11-6.5z" />
                      </svg>
                    </span>
                  </button>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: isPub ? C.green : C.gold,
                    }}
                  >
                    {isPub ? "On air" : "Ready to publish"}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.4, color: C.textSoft }}>
                    <span style={{ color: C.textFaint, fontWeight: 700, marginRight: 6 }}>
                      {pad2(idx + 1)}
                    </span>
                    {episodeName(r)}
                  </div>
                </div>
              );
            })}

            {liveReels.length < seasonTotal ? (
              <div style={{ flex: "0 0 150px", width: 150 }}>
                <button
                  type="button"
                  aria-label="Film your next episode"
                  onClick={() => {
                    // The scripts live in the second half of the Episodes zone.
                    spyLockRef.current = Date.now() + 900;
                    scriptsZoneRef.current?.scrollIntoView({ behavior: "smooth" });
                    setActiveTab(1);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    aspectRatio: "9 / 16",
                    borderRadius: 14,
                    border: `1px dashed ${C.goldFaint}`,
                    background: "transparent",
                    color: C.gold,
                    fontSize: 26,
                    fontWeight: 300,
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {pad2(liveReels.length + 1)}
                </button>
                <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.45, color: C.textMute }}>
                  Your next episode is waiting in the broadcast room
                </div>
              </div>
            ) : null}
          </div>

          <p style={{ margin: "14px 0 0", fontSize: 13, lineHeight: 1.6, color: C.textFaint }}>
            More episodes are coming - we will invite you first when they open.
          </p>
        </section>

        {/* ── Zone 1b · Your episodes (scripts) ─────────────────────── */}
        <section
          data-tab-index={1}
          ref={(el) => { scriptsZoneRef.current = el; }}
          style={{ paddingTop: "clamp(44px, 7vh, 72px)" }}
        >
          <ZoneHead no="02" title="Your episodes" hint="Read before the camera. Each script is yours alone" />

          {data.scripts.length === 0 ? (
            <div
              style={{
                marginTop: 18,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: "22px 22px",
              }}
            >
              <BuildShootDay extractionId={data.extractionId} />
            </div>
          ) : (
            <>
              <SeasonProgress filmed={data.filmedNumbers.length} total={seasonTotal} />
              <EpisodesList
                extractionId={data.extractionId}
                scripts={data.scripts}
                filmedNumbers={data.filmedNumbers}
                identity={data.identity}
                takesPerScript={data.takesPerScript}
                takesCap={data.takesCap}
                seasonUsed={data.seasonUsed}
                seasonCap={data.seasonCap}
                email={data.email}
              />
            </>
          )}
        </section>

        {/* ── Zone 2 · Your texts ───────────────────────────────────── */}
        <section
          data-tab-index={2}
          ref={(el) => { zonesRef.current[2] = el; }}
          style={{ paddingTop: "clamp(52px, 8vh, 84px)" }}
        >
          <ZoneHead no="03" title="Your texts" hint="Tap to open, tap the text to copy" />

          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            {(() => {
              const dedupe = new Set<string>();
              const rows = ([
                ["Instagram bio", "Short and precise for your profile", data.bioInstagram],
                ["LinkedIn headline", "Your professional positioning line", data.linkedinHeadline],
                ["Facebook about", "The full introduction paragraph", data.facebookAbout],
                ["Website about", "The long version", data.aboutSite],
                ["Personal manifesto", "What you stand for", data.manifesto],
              ] as const).filter(([, , text]) => {
                const norm = text.trim().replace(/\s+/g, " ");
                if (!norm || dedupe.has(norm)) return false;
                dedupe.add(norm);
                return true;
              });
              if (!rows.length) {
                return (
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      padding: "20px 22px",
                      fontSize: 14.5,
                      lineHeight: 1.6,
                      color: C.textMute,
                    }}
                  >
                    Your social texts are still being prepared. As soon as they are ready they will
                    appear here, written for your audience.
                  </div>
                );
              }
              return rows.map(([label, sub, text]) => (
                <TextAccordion key={label} label={label} sub={sub} text={text} onCopy={() => copyText(text)} />
              ));
            })()}
          </div>
        </section>

        {/* ── Zone 3 · Visuals ──────────────────────────────────────── */}
        <section
          data-tab-index={3}
          ref={(el) => { zonesRef.current[3] = el; }}
          style={{ paddingTop: "clamp(52px, 8vh, 84px)" }}
        >
          <ZoneHead no="04" title="Your visuals" hint="Designed assets, ready for the feed" />

          {data.extractionId ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "16px 0 4px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 999,
                    padding: 4,
                  }}
                >
                  <span style={{ color: C.textFaint, fontSize: 12, margin: "0 6px 0 10px" }}>Backdrop</span>
                </span>
              </div>
              <div
                className="hive-shelf"
                style={{
                  display: "flex",
                  gap: 14,
                  overflowX: "auto",
                  paddingBottom: 8,
                  marginTop: 12,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {VISUAL_ASSETS.map((a) => (
                  <div key={a.type} style={{ flex: "0 0 220px", width: 220 }}>
                    <div
                      style={{
                        aspectRatio: "4 / 5",
                        borderRadius: 14,
                        overflow: "hidden",
                        border: `1px solid ${C.border}`,
                        background: C.card,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl(data.extractionId!, a.type, "color")}
                        alt={a.label}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: C.textSoft }}>
                      {a.label}
                    </div>
                    <a
                      href={assetUrl(data.extractionId!, a.type, "color")}
                      download
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: C.gold,
                        textDecoration: "none",
                        borderBottom: `1px solid ${C.goldFaint}`,
                        paddingBottom: 1,
                      }}
                    >
                      Download asset
                    </a>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>

        <footer
          style={{
            marginTop: "clamp(56px, 9vh, 96px)",
            paddingTop: 24,
            borderTop: `1px solid ${C.border}`,
            fontSize: 12,
            letterSpacing: "0.06em",
            color: C.textFaint,
            textAlign: "center",
          }}
        >
          The Signal Hive · beegood · The TrueSignal© Method
        </footer>
      </main>

      {/* Bottom tab bar — slim, IG proportions, LTR */}
      <nav
        aria-label="Sections"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          background: "rgba(13,12,10,0.94)",
          backdropFilter: "blur(12px)",
          borderTop: `1px solid ${C.border}`,
          padding: "6px 8px calc(6px + env(safe-area-inset-bottom))",
        }}
      >
        {([
          ["Signal", <svg key="i" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="2.4" /><path d="M12 4v3M12 17v3M4 12h3M17 12h3" /></svg>],
          ["Episodes", <svg key="i" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="7" width="12" height="10" rx="2" /><path d="M15.5 10.5l4.5-2.5v8l-4.5-2.5z" /></svg>],
          ["Texts", <svg key="i" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4h8a2 2 0 0 1 2 2v14l-2-1.5L14 20l-2-1.5L10 20l-2-1.5L6 20V6a2 2 0 0 1 2-2z" /><path d="M9.5 9h5M9.5 12.5h5" /></svg>],
          ["Visuals", <svg key="i" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4.5" y="4.5" width="15" height="15" rx="2" /><circle cx="9.5" cy="9.5" r="1.6" /><path d="M5 17l4.5-4.5 3 3 2.5-2.5L19 17" /></svg>],
        ] as const).map(([label, icon], i) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-current={activeTab === i ? "true" : undefined}
            onClick={() => {
              if (i === 1) {
                // Episodes tab anchors at the series shelf (zone 1 head).
                goTab(1);
              } else {
                goTab(i);
              }
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 0 4px",
              background: "transparent",
              border: "none",
              color: activeTab === i ? C.gold : C.textFaint,
              fontFamily: "inherit",
              fontSize: 10.5,
              fontWeight: activeTab === i ? 700 : 500,
              letterSpacing: "0.04em",
              cursor: "pointer",
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Toast */}
      <div
        role="status"
        style={{
          position: "fixed",
          bottom: "calc(74px + env(safe-area-inset-bottom))",
          left: "50%",
          transform: `translateX(-50%) translateY(${toastOn ? 0 : 12}px)`,
          opacity: toastOn ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity .25s, transform .25s",
          background: C.cardSoft,
          border: `1px solid ${C.goldFaint}`,
          borderRadius: 999,
          padding: "9px 18px",
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          zIndex: 60,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: C.green, marginRight: 8 }}>✓</span>
        {toastMsg}
      </div>

      {/* Episode viewer */}
      {viewerEditId && (() => {
        const r = liveReels.find((x) => x.editId === viewerEditId);
        if (!r) return null;
        const isPub = r.published || published[r.editId];
        return (
          <EpisodeViewer
            editId={r.editId}
            reviewItemId={r.reviewItemId}
            title={episodeName(r)}
            downloadUrl={r.downloadUrl}
            isPublished={isPub}
            onClose={() => setViewerEditId(null)}
            onMarkPublished={() => {
              setPublished((prev) => ({ ...prev, [r.editId]: true }));
              fetch(`/api/broadcast/review-items/${r.reviewItemId}/publish`, { method: "POST" }).catch(() => {});
              toast("Marked as published");
            }}
            onDelete={async () => {
              const res = await fetch(`/api/broadcast/edits/${r.editId}`, { method: "DELETE" }).catch(() => null);
              if (res?.ok) {
                setDeletedReels((prev) => ({ ...prev, [r.editId]: true }));
                setViewerEditId(null);
                toast("Episode deleted");
              } else {
                toast("Delete failed, try again");
              }
            }}
            onReedit={
              data.extractionId && r.videoNumber
                ? async () => {
                    const res = await fetch(`/api/broadcast/edits/${r.editId}/reopen`, { method: "POST" }).catch(() => null);
                    if (res?.ok) {
                      window.location.href = `/hive/signal-kit/broadcast/${data.extractionId}/${r.videoNumber}`;
                    } else if (res?.status === 410) {
                      toast("The raw takes are no longer stored, film a fresh take instead");
                    } else {
                      toast("That did not work, try again");
                    }
                  }
                : undefined
            }
          />
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Small shared pieces
// ─────────────────────────────────────────────────────────────────────

function ZoneHead({ no, title, hint }: { no: string; title: string; hint: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: C.textFaint,
          }}
        >
          {no}
        </span>
        <h2
          style={{
            fontSize: "clamp(21px, 3vw, 27px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, color: C.textMute }}>{hint}</p>
      <div
        aria-hidden="true"
        style={{
          height: 1,
          marginTop: 14,
          background: `linear-gradient(90deg, ${C.goldFaint}, transparent)`,
        }}
      />
    </div>
  );
}

function BoardCard({ label, text, onCopy }: { label: string; text: string; onCopy: () => void }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          color: C.gold,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <p
        onClick={onCopy}
        title="Tap to copy"
        style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: C.text, cursor: "pointer" }}
      >
        {text}
      </p>
    </div>
  );
}

function TextAccordion({
  label, sub, text, onCopy,
}: {
  label: string;
  sub: string;
  text: string;
  onCopy: () => void;
}) {
  return (
    <details
      className="hive-acc"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "16px 20px",
      }}
    >
      <summary style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: C.text }}>{label}</span>
          <span style={{ display: "block", fontSize: 12.5, color: C.textMute, marginTop: 2 }}>{sub}</span>
        </span>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={C.textFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <p
        onClick={onCopy}
        title="Tap to copy"
        style={{
          margin: "14px 0 0",
          padding: "14px 16px",
          background: "rgba(0,0,0,0.25)",
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          fontSize: 14.5,
          lineHeight: 1.7,
          color: C.textSoft,
          cursor: "pointer",
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={onCopy}
        style={{
          marginTop: 10,
          fontFamily: "inherit",
          fontSize: 12.5,
          fontWeight: 700,
          color: C.gold,
          background: "transparent",
          border: `1px solid ${C.goldFaint}`,
          borderRadius: 999,
          padding: "7px 16px",
          cursor: "pointer",
        }}
      >
        Copy
      </button>
    </details>
  );
}

function BgPill({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 34,
        padding: "0 14px",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12.5,
        fontWeight: on ? 800 : 600,
        color: on ? C.ctaFg : C.textMute,
        background: on ? C.ctaBg : "transparent",
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SeasonProgress — gold segmented bar, "{n}/{total} filmed".
// ─────────────────────────────────────────────────────────────────────
function SeasonProgress({ filmed, total }: { filmed: number; total: number }) {
  const cells = Array.from({ length: total }, (_, i) => i < filmed);
  return (
    <div style={{ margin: "18px 0 12px", display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          flex: "0 0 auto",
          fontSize: 12,
          fontWeight: 800,
          color: C.gold,
          letterSpacing: "0.04em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {filmed}/{total}
        <span style={{ color: C.textFaint, fontWeight: 500, marginLeft: 5 }}>
          {total <= 1 ? "free episode filmed" : "filmed"}
        </span>
      </span>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {cells.map((done, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              background: done ? C.gold : C.goldFaint,
              boxShadow: done ? "0 0 8px rgba(194,151,63,0.35)" : undefined,
              transition: "background .3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BuildShootDay — the empty-state builder. Same two-step flow as the Hebrew
// home: GET /shoot-day seeds identity + pillars (phase 1), then
// POST /shoot-day/finish writes episode 1; a reload picks up the cached plan.
// ─────────────────────────────────────────────────────────────────────
function BuildShootDay({ extractionId }: { extractionId: string | null }) {
  const [state, setState] = useState<"idle" | "phase1" | "phase2" | "done" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string>("");

  const build = useCallback(async () => {
    if (!extractionId) {
      setErrMsg("Missing extraction id - contact support");
      setState("err");
      return;
    }
    try {
      setState("phase1");
      const r1 = await fetch(`/api/signal/${extractionId}/shoot-day`);
      const t1 = await r1.text();
      const d1 = safeJson(t1) as { phase?: string; identity_statement?: string; pillars?: unknown; error?: string } | null;
      if (!r1.ok || !d1) throw new Error(String(d1?.error ?? `Step one failed (${r1.status})`));

      if (d1.phase !== "complete") {
        if (!d1.identity_statement || !d1.pillars) {
          throw new Error("Step one did not return identity and pillars");
        }
        setState("phase2");
        const r2 = await fetch(`/api/signal/${extractionId}/shoot-day/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identity_statement: d1.identity_statement,
            pillars: d1.pillars,
          }),
        });
        const t2 = await r2.text();
        const d2 = safeJson(t2) as { plan?: unknown; error?: string } | null;
        if (!r2.ok || !d2?.plan) throw new Error(String(d2?.error ?? `Step two failed (${r2.status})`));
      }
      setState("done");
      window.location.reload();
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
      setState("err");
    }
  }, [extractionId]);

  const working = state === "phase1" || state === "phase2" || state === "done";
  const label =
    state === "phase1" ? "Reading your signal..." :
    state === "phase2" ? "Writing your first episode..." :
    state === "done" ? "One moment..." :
    "Write my episodes";
  return (
    <>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.65, color: C.textMute }}>
        Your episode scripts have not been written yet. It takes a few minutes, and it happens here.
      </p>
      {state === "err" && (
        <p style={{ margin: "10px 0 0", fontSize: 13.5, color: C.red }}>{errMsg}</p>
      )}
      <button
        type="button"
        onClick={build}
        disabled={working}
        style={{
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 700,
          color: C.ctaFg,
          background: C.ctaBg,
          border: "none",
          borderRadius: 10,
          padding: "12px 24px",
          cursor: working ? "wait" : "pointer",
          opacity: working ? 0.75 : 1,
        }}
      >
        {working && (
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 9,
              height: 9,
              borderRadius: 999,
              background: C.ctaFg,
              animation: "hivePulse 1s ease-in-out infinite",
            }}
          />
        )}
        <span>{label}</span>
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EpisodesList — seven rows, three states each (unbuilt / built / filmed),
// per-row generation via POST /shoot-day/videos, film button into the
// broadcast room. Same gating math as the Hebrew home.
// ─────────────────────────────────────────────────────────────────────
function EpisodesList({
  extractionId,
  scripts,
  filmedNumbers,
  identity,
  takesPerScript,
  takesCap,
  seasonUsed,
  seasonCap,
  email,
}: {
  extractionId: string | null;
  scripts: EpisodeScript[];
  filmedNumbers: number[];
  identity: string;
  takesPerScript: Record<number, number>;
  takesCap: number;
  seasonUsed: number;
  seasonCap: number;
  email: string;
}) {
  const seasonFull = seasonUsed >= seasonCap;
  // Free launch plan (one episode): a full season is an ACHIEVEMENT, not an
  // error. Locked rows read as the upcoming season, and the CTA is a
  // first-in-line waitlist — never "delete an episode".
  const freePlan = seasonCap <= 1;
  const [notifyState, setNotifyState] = useState<"idle" | "busy" | "done" | "err">("idle");
  const requestNotify = useCallback(async () => {
    if (notifyState === "busy" || notifyState === "done") return;
    setNotifyState("busy");
    try {
      const r = await fetch("/api/en/hive/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setNotifyState("done");
    } catch {
      setNotifyState("err");
    }
  }, [email, notifyState]);
  const [localScripts, setLocalScripts] = useState<EpisodeScript[]>(scripts);
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [errByNumber, setErrByNumber] = useState<Record<number, string>>({});

  const requestBuild = useCallback(async (n: number) => {
    if (!extractionId) return;
    setErrByNumber((p) => { const c = { ...p }; delete c[n]; return c; });
    setGenerating((prev) => new Set(prev).add(n));
    try {
      const r0 = await fetch(`/api/signal/${extractionId}/shoot-day`);
      const d0 = safeJson(await r0.text()) as {
        identity_statement?: string;
        pillars?: unknown;
        plan?: { identity_statement?: string; pillars?: unknown };
      } | null;
      if (!r0.ok || !d0) throw new Error(`Step one failed (${r0.status})`);
      const identityStmt = d0.identity_statement || d0.plan?.identity_statement || identity;
      const pillars = d0.pillars || d0.plan?.pillars;
      if (!identityStmt || !Array.isArray(pillars) || pillars.length !== 4) {
        throw new Error("Could not load the identity line and four pillars");
      }

      const r = await fetch(`/api/signal/${extractionId}/shoot-day/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identity_statement: identityStmt,
          pillars,
          numbers: [n],
        }),
      });
      const d = safeJson(await r.text()) as { videos?: unknown[]; error?: string } | null;
      if (!r.ok || !d?.videos || d.videos.length === 0) {
        throw new Error(String(d?.error ?? `Generation failed (${r.status})`));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = d.videos[0] as any;
      const built: EpisodeScript = {
        number: v.number,
        title: String(v.title ?? CANONICAL_TITLES[n] ?? `Episode ${pad2(n)}`),
        hook: String(v.script?.hook ?? ""),
        body: String(v.script?.body ?? ""),
        cta: v.script?.cta ? String(v.script.cta) : "",
        interviewQuestions: Array.isArray(v.client_interview_questions)
          ? v.client_interview_questions.filter((q: unknown): q is string => typeof q === "string" && q.length > 0)
          : undefined,
      };
      setLocalScripts((prev) => {
        const withoutN = prev.filter((s) => s.number !== n);
        return [...withoutN, built].sort((a, b) => a.number - b.number);
      });
    } catch (e) {
      setErrByNumber((prev) => ({ ...prev, [n]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setGenerating((prev) => { const c = new Set(prev); c.delete(n); return c; });
    }
  }, [extractionId, identity]);

  const scriptByNumber = new Map(localScripts.map((s) => [s.number, s]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
      {identity && (
        <div
          style={{
            marginBottom: 6,
            padding: "14px 18px",
            borderLeft: `3px solid ${C.gold}`,
            background: `linear-gradient(90deg, rgba(194,151,63,0.08), rgba(194,151,63,0.02) 60%, transparent)`,
            borderRadius: 10,
          }}
        >
          <span
            style={{
              color: C.gold,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "block",
              marginBottom: 6,
            }}
          >
            The core of the season
          </span>
          <span style={{ fontSize: 15, lineHeight: 1.55, color: C.text }}>{identity}</span>
        </div>
      )}

      {freePlan && !seasonFull && (
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(194,151,63,0.06)",
            border: "1px dashed rgba(194,151,63,0.4)",
            borderRadius: 14,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 14.5, fontWeight: 800, color: C.gold, lineHeight: 1.4 }}>
            One episode is on us
          </div>
          <div style={{ fontSize: 13.5, color: C.textMute, lineHeight: 1.65, marginTop: 5 }}>
            All seven scripts below are yours to read. Filming is open for one free episode - pick
            the script that feels most like you, and film that one. The rest of the season opens later.
          </div>
        </div>
      )}

      {freePlan && seasonFull && (
        <div
          style={{
            padding: "18px 20px",
            background: "linear-gradient(135deg, rgba(194,151,63,0.12), rgba(194,151,63,0.04))",
            border: "1px solid rgba(194,151,63,0.35)",
            borderRadius: 14,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 15.5, fontWeight: 800, color: C.text, lineHeight: 1.4 }}>
            Your first episode is on air.
          </div>
          <div style={{ fontSize: 13.5, color: C.textMute, lineHeight: 1.65, marginTop: 6 }}>
            The rest of your season is already written - six more episodes, each one drawn from your
            signal. We open the doors gradually, and people on the list go first.
          </div>
          {notifyState === "done" ? (
            <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 700, color: C.green }}>
              You are on the list. We will write to you the moment episodes open.
            </div>
          ) : (
            <button
              type="button"
              onClick={requestNotify}
              disabled={notifyState === "busy"}
              style={{
                marginTop: 12,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDeep})`,
                color: "#15130F",
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                fontFamily: "inherit",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: notifyState === "busy" ? "wait" : "pointer",
              }}
            >
              {notifyState === "busy"
                ? "One moment..."
                : notifyState === "err"
                ? "Try again"
                : "Tell me when episodes open"}
            </button>
          )}
        </div>
      )}

      {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => {
        const s = scriptByNumber.get(n);
        const filmed = s ? filmedNumbers.includes(n) : false;
        const inFlight = generating.has(n);
        const err = errByNumber[n];

        // ── Unbuilt row ────────────────────────────────────────────────
        if (!s) {
          return (
            <div
              key={n}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <EpisodeBadge state={inFlight ? "active" : "idle"}>{n}</EpisodeBadge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  {CANONICAL_TITLES[n] ?? `Episode ${pad2(n)}`}
                </div>
                {inFlight ? (
                  <div style={{ fontSize: 12.5, color: C.gold, marginTop: 2 }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: C.gold,
                        marginRight: 6,
                        animation: "hivePulse 1s ease-in-out infinite",
                      }}
                    />
                    Writing the episode, about twenty seconds
                  </div>
                ) : err ? (
                  <div style={{ fontSize: 12.5, color: C.red, marginTop: 2 }}>{err}</div>
                ) : (
                  <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 2 }}>Not written yet</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => requestBuild(n)}
                disabled={inFlight || !extractionId}
                style={{
                  flex: "0 0 auto",
                  padding: "0 16px",
                  minHeight: 38,
                  background: "transparent",
                  color: inFlight ? C.textFaint : err ? C.red : C.gold,
                  border: `1px solid ${inFlight ? C.goldFaint : err ? "rgba(224,138,138,0.5)" : "rgba(194,151,63,0.55)"}`,
                  borderRadius: 999,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: inFlight ? "wait" : "pointer",
                }}
              >
                {inFlight ? "Writing..." : err ? "Try again" : "Write this episode"}
              </button>
            </div>
          );
        }

        // ── Built row (may or may not be filmed) ──────────────────────
        const takes = takesPerScript[n] ?? 0;
        const takesFull = takes >= takesCap;
        const blocked = seasonFull || takesFull;
        const freeLocked = freePlan && seasonFull && !filmed;
        const statusLabel = filmed
          ? "Filmed"
          : freeLocked
            ? "Written and waiting - opens with the full season"
            : seasonFull
              ? `Season full (${seasonCap}/${seasonCap} episodes) - delete an episode first`
              : takesFull
                ? `This episode is full (${takesCap}/${takesCap} takes) - delete a take first`
                : "Ready to film";
        const statusColor = filmed ? C.green : freeLocked ? C.textMute : blocked ? C.red : C.gold;

        return (
          <details
            key={n}
            className="hive-acc"
            style={{
              background: C.card,
              border: `1px solid ${filmed ? "rgba(127,191,142,0.28)" : "rgba(194,151,63,0.2)"}`,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <summary style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <EpisodeBadge state={filmed ? "done" : "active"}>{filmed ? "✓" : n}</EpisodeBadge>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>
                  <span style={{ color: C.textFaint, fontWeight: 700, marginRight: 8 }}>
                    Episode {pad2(n)}
                  </span>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: statusColor, fontWeight: 700, marginTop: 3 }}>
                  {statusLabel}
                </div>
                {!blocked && takes > 0 && (
                  <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>
                    {takes}/{takesCap} takes on this episode
                  </div>
                )}
              </div>
              {blocked && !filmed ? (
                <span
                  style={{
                    flex: "0 0 auto",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 14px",
                    minHeight: 38,
                    background: freePlan ? "rgba(194,151,63,0.07)" : "rgba(224,138,138,0.08)",
                    color: freePlan ? C.gold : C.textFaint,
                    border: freePlan ? "1px dashed rgba(194,151,63,0.4)" : "1px dashed rgba(224,138,138,0.35)",
                    borderRadius: 999,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "default",
                  }}
                >
                  {freePlan ? "Opening soon" : "Filming closed"}
                </span>
              ) : blocked && filmed ? null : (
                <a
                  href={`/hive/signal-kit/broadcast/${extractionId}/${n}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: "0 0 auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "inherit",
                    ...(filmed
                      ? {
                          padding: "0 2px",
                          minHeight: 38,
                          background: "transparent",
                          color: C.textMute,
                          fontSize: 12.5,
                          fontWeight: 700,
                          textDecoration: "underline",
                          textDecorationColor: "rgba(242,237,228,0.3)",
                          textUnderlineOffset: 3,
                        }
                      : {
                          padding: "0 18px",
                          minHeight: 42,
                          background: C.ctaBg,
                          color: C.ctaFg,
                          borderRadius: 999,
                          fontSize: 13.5,
                          fontWeight: 800,
                          textDecoration: "none",
                          boxShadow: "0 6px 18px rgba(194,151,63,0.28)",
                        }),
                  }}
                >
                  {filmed ? "Another take" : "Film this episode →"}
                </a>
              )}
            </summary>
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: "rgba(0,0,0,0.24)",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                fontSize: 14.5,
                lineHeight: 1.65,
                color: C.textSoft,
              }}
            >
              <span style={{ color: C.gold, fontWeight: 700 }}>{s.hook}</span>{" "}
              <span>{s.body}</span>
              {s.cta ? (
                <>
                  {" "}
                  <span style={{ color: C.gold, fontWeight: 700 }}>{s.cta}</span>
                </>
              ) : null}
            </div>
            {s.interviewQuestions && s.interviewQuestions.length > 0 ? (
              <InterviewQuestionsCard questions={s.interviewQuestions} />
            ) : null}
          </details>
        );
      })}
    </div>
  );
}

function EpisodeBadge({ state, children }: { state: "idle" | "active" | "done"; children: React.ReactNode }) {
  return (
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        background:
          state === "done" ? "rgba(127,191,142,0.15)" : state === "active" ? C.ctaBg : "rgba(194,151,63,0.1)",
        color: state === "done" ? C.green : state === "active" ? C.ctaFg : C.goldDeep,
        border: state === "done" ? "1px solid rgba(127,191,142,0.4)" : state === "idle" ? `1px solid ${C.goldFaint}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 800,
        flex: "0 0 auto",
      }}
    >
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// InterviewQuestionsCard — V7 testimonial episodes carry the questions the
// member asks their own clients, so the answers voice the signal.
// ─────────────────────────────────────────────────────────────────────
function InterviewQuestionsCard({ questions }: { questions: string[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  }, [questions]);

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        background: "rgba(194,151,63,0.06)",
        border: `1px solid ${C.goldFaint}`,
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <span style={{ color: C.gold, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Testimonial interview questions
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: `1px solid rgba(194,151,63,0.4)`,
            color: C.gold,
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copied ? "Copied ✓" : "Copy all"}
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: C.textMute, margin: "0 0 10px", lineHeight: 1.55 }}>
        These questions guide your client to say the signal line in their own words. Ask them in a
        testimonial interview before you record.
      </p>
      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: C.textSoft }}>
        {questions.map((q, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{q}</li>
        ))}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EpisodeViewer — full-screen modal: 9:16 video + download / re-edit /
// mark published / delete. Same handler surface as the Hebrew home.
// ─────────────────────────────────────────────────────────────────────
function EpisodeViewer({
  editId, reviewItemId, title, downloadUrl, isPublished,
  onClose, onMarkPublished, onDelete, onReedit,
}: {
  editId: string;
  reviewItemId: string | null;
  title: string;
  downloadUrl: string | null;
  isPublished: boolean;
  onClose: () => void;
  onMarkPublished: () => void;
  onDelete: () => Promise<void>;
  onReedit?: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [reediting, setReediting] = useState(false);

  // Strip the ?download=true param so <video> streams instead of downloading.
  const streamUrl = downloadUrl
    ? downloadUrl.replace(/([?&])download=true(&?)/, (_, sep, tail) => (tail ? sep : "")).replace(/[?&]$/, "")
    : null;

  const download = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${title || `beegood-episode-${editId}`}.mp4`;
    a.rel = "noopener";
    a.click();
  }, [downloadUrl, title, editId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,9,7,0.96)",
        zIndex: 9500,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Title strip */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "calc(14px + env(safe-area-inset-top)) 20px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: isPublished ? C.green : C.gold, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>
            {isPublished ? "On air" : "Ready to publish"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "rgba(194,151,63,0.14)",
            border: `1px solid rgba(194,151,63,0.35)`,
            color: C.gold,
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: "pointer",
            lineHeight: 1,
            flex: "0 0 auto",
          }}
        >
          ×
        </button>
      </div>

      {/* Video area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 16px",
        }}
      >
        {streamUrl ? (
          <video
            key={streamUrl}
            src={streamUrl}
            controls
            playsInline
            autoPlay
            preload="metadata"
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              aspectRatio: "9 / 16",
              objectFit: "contain",
              background: "#000",
              borderRadius: 8,
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          />
        ) : (
          <div style={{ color: C.text, padding: 20 }}>The video is not available yet</div>
        )}
      </div>

      {/* Action bar */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "center",
          gap: 10,
          overflowX: "auto",
          scrollbarWidth: "none",
          borderTop: `1px solid rgba(194,151,63,0.12)`,
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))",
        }}
      >
        <ViewerPill onClick={download} label="Download" primary>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v11m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </ViewerPill>

        {onReedit && (
          <ViewerPill
            onClick={async () => {
              if (reediting) return;
              setReediting(true);
              try { await onReedit(); } finally { setReediting(false); }
            }}
            label={reediting ? "Opening..." : "Re-edit"}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </ViewerPill>
        )}

        {!isPublished && reviewItemId && (
          <ViewerPill onClick={() => { onMarkPublished(); onClose(); }} label="Published">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l4.5 4.5L20 6.5" />
            </svg>
          </ViewerPill>
        )}

        <ViewerPill
          onClick={async () => {
            if (!confirmDel) { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 3500); return; }
            setDeleting(true);
            try { await onDelete(); } finally { setDeleting(false); }
          }}
          label={deleting ? "Deleting..." : confirmDel ? "Tap again to confirm" : "Delete"}
          danger
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16" /><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        </ViewerPill>
      </div>
    </div>
  );
}

function ViewerPill({
  children, label, onClick, primary, danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  const bg = primary ? C.ctaBg : danger ? "rgba(224,138,138,0.14)" : "rgba(22,20,16,0.9)";
  const color = primary ? C.ctaFg : danger ? "#F0B3B3" : C.text;
  const border = primary
    ? "none"
    : danger
    ? "1px solid rgba(224,138,138,0.4)"
    : `1px solid rgba(194,151,63,0.3)`;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        padding: "0 18px",
        background: bg,
        color,
        border,
        borderRadius: 999,
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
        flex: "0 0 auto",
        whiteSpace: "nowrap",
        boxShadow: primary ? "0 8px 22px rgba(194,151,63,0.35)" : "0 6px 16px rgba(0,0,0,0.45)",
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
