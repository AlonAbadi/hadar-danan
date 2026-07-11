// כוורת האות — client render of the master mockup
// (design/kaveret/beegood-kaveret-haot-master.html). The DOM structure, class
// values and interaction logic are a one-to-one port; only the texts are the
// member's own. Do not restyle by hand — visual-check compares against the
// mockup at 1.5% tolerance.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import sty from "./kaveret.module.css";
import { KAVERET_SEASONS, KAVERET_SEASONS_INTRO, type KaveretSeason } from "@/lib/kaveret-seasons";

export interface KaveretCard {
  name: string;
  use: string;
  text: string;
  file: string;
}

export interface KaveretData {
  firstName: string;
  gender: "m" | "f" | null;
  signalText: string;
  positioning: string;
  persona: string;
  cards: KaveretCard[];
  identity: string;
  bioInstagram: string;
  linkedinHeadline: string;
  facebookAbout: string;
  challengeDay: number;
  monthLabel: string;
  filmedCount: number;
  scriptsTotal: number;
  scripts: { number: number; title: string; hook: string; body: string; cta: string; interviewQuestions?: string[] }[];
  extractionId: string | null;
  challengeDays: { day: number; title: string; videoId: string; portrait: boolean }[];
  completedDays: number[];
  challengeDone: boolean;
  liveMeeting: { label: string; zoomUrl: string | null } | null;
  filmedNumbers: number[];
  aboutSite: string;
  manifesto: string;
  // Dynamic Hadar letter (2026-07-10). null → render the legacy static
  // fallback in the letterbox. Two-line shape: body diagnosis, close invitation.
  letterFromHadar: { body: string; close: string } | null;
  // Pillars for the shoot-day plan. Loaded from signal.shoot_day_phase1 so
  // <EpisodesList> can POST /shoot-day/videos for per-row generation without
  // an extra round-trip. null → per-row build button is hidden (customer
  // needs to run BuildShootDay first to seed phase 1).
  pillars: unknown[] | null;
  // Filming caps (Alon 2026-07-11). takesPerScript = live count of non-failed
  // edits per video_number; takesCap = the ceiling (3). seasonUsed = live
  // count across the entire season; seasonCap = the ceiling (7). Both bounds
  // drive the client-side gate on לצלם עכשיו — the same limits are enforced
  // server-side at /api/broadcast/takes and /takes/[id]/select, but showing
  // the count on-row saves the customer from starting a recording that will
  // fail on upload.
  takesPerScript: Record<number, number>;
  seasonUsed: number;
  seasonCap: number;
  takesCap: number;
  reels: {
    editId: string;
    reviewItemId: string | null;
    videoNumber: number | null;
    createdAt: string;
    published: boolean;
    thumbUrl: string | null;
    downloadUrl: string | null;
  }[];
  waPhone: string;
  demo: boolean;
}

// Per-day signal frames — mirrors the kit's challenge framing lines.
const DAY_FRAMES: Record<number, string> = {
  1: "היום נתחיל לראות מה מסתיר את האות שלך.",
  2: "היום ניקח סיפור אחד, ונחבר אותו לאות שלך.",
  3: "היום נמצא את הרגע שבו האות שלך הכי חזק.",
  4: "היום נחדד למי האות שלך מדבר.",
  5: "היום נתחיל לבטא את האות שלך מול העולם.",
  6: "היום ניתן לאות שלך מבנה שאפשר לחזור עליו.",
  7: "היום נבין איך האות שלך מושך את הלקוחות הנכונים.",
};

// The kit's designed visual assets (same API the ויזואל tab uses).
const VISUAL_ASSETS = [
  { type: "share-card-default", label: "המשפט הציבורי שלך" },
  { type: "quote-signal", label: "האות שלך" },
  { type: "quote-promise", label: "ההבטחה" },
  { type: "quote-people", label: "הקהל שלך" },
  { type: "quote-content-1", label: "כיוון תוכן #1" },
  { type: "quote-content-2", label: "כיוון תוכן #2" },
  { type: "quote-content-3", label: "כיוון תוכן #3" },
] as const;

// Members always get logo-free assets — they paid; the beegood-branded look
// exists only on the free card of the locked (pre-purchase) page.
function assetUrl(extractionId: string, type: string, bg: "color" | "image" = "color", clean = true): string {
  const q = `style=editorial&bg=${bg}&v=10${clean ? "&clean=1" : ""}`;
  return type === "share-card-default"
    ? `/api/signal/${extractionId}/share-card?${q}`
    : `/api/signal/${extractionId}/asset?type=${type}&${q}`;
}

// Signal-kit's visual controls, absorbed (the kit page now redirects here).
function AssetPill({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 40, padding: "0 16px", borderRadius: 999, border: "none", cursor: "pointer",
        fontFamily: "inherit", fontSize: 13.5, fontWeight: on ? 800 : 600,
        color: on ? "#171204" : "#9E9990",
        background: on ? "linear-gradient(180deg,#F1D07E 0%,#E2B34A 55%,#CE9C38 100%)" : "transparent",
        boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(232,185,74,0.2)" : "none",
      }}
    >
      {children}
    </button>
  );
}

const REVEAL_KEY = "kaveret_reveal_seen";

// Signal words: the final clause (after the last comma) carries the gold.
function signalWords(text: string): [string, number][] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let strongFrom = words.length;
  for (let i = words.length - 1; i >= 0; i--) {
    if (words[i].endsWith(",")) { strongFrom = i + 1; break; }
    if (i === 0) strongFrom = Math.max(0, words.length - 4);
  }
  if (strongFrom >= words.length) strongFrom = Math.max(0, words.length - 4);
  return words.map((w, i) => [w, i >= strongFrom ? 1 : 0]);
}

export function KaveretClient({
  data,
  cardsSplit,
}: {
  data: KaveretData;
  cardsSplit: { lead: string; main: string }[];
}) {
  const [toastMsg, setToastMsg] = useState("הועתק ללוח");
  const [toastOn, setToastOn] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dot, setDot] = useState(0);
  const [seen, setSeen] = useState(true); // SSR-safe: animate only after mount check
  const carRef = useRef<HTMLDivElement | null>(null);
  const spyLockRef = useRef(0);
  const zonesRef = useRef<(HTMLElement | null)[]>([]);
  const strategyRef = useRef<HTMLElement | null>(null);
  const okTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const [okBtns, setOkBtns] = useState<Record<string, boolean>>({});
  const pngBusy = useRef(false);
  const [published, setPublished] = useState<Record<string, boolean>>({});
  const [deletedReels, setDeletedReels] = useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [viewerEditId, setViewerEditId] = useState<string | null>(null);
  const [assetBg, setAssetBg] = useState<"color" | "image">("color");
  // Reels hydrate after first paint (server no longer signs storage URLs on
  // the critical path). Shape mirrors the old server assembly.
  const [reels, setReels] = useState<KaveretData["reels"]>(data.reels);
  useEffect(() => {
    if (data.demo) return;
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
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.demo]);
  const [curDay, setCurDay] = useState(data.challengeDay);
  const [doneDays, setDoneDays] = useState<number[]>(data.completedDays);
  const [viewDay, setViewDay] = useState(data.challengeDay);
  const [dayBusy, setDayBusy] = useState(false);

  // Word reveal only on first visit per session (spec: kaveret_reveal_seen).
  useEffect(() => {
    try {
      if (!sessionStorage.getItem(REVEAL_KEY)) {
        setSeen(false);
        sessionStorage.setItem(REVEAL_KEY, "1");
      }
    } catch { /* storage blocked — skip the animation */ }
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 1800);
  }, []);

  const copyText = useCallback(async (text: string, btnKey?: string) => {
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
    toast(ok ? "הועתק ללוח" : "ההעתקה נכשלה");
    if (ok && navigator.vibrate) navigator.vibrate(6);
    if (ok && btnKey) {
      setOkBtns((prev) => ({ ...prev, [btnKey]: true }));
      const existing = okTimers.current.get(btnKey);
      if (existing) clearTimeout(existing);
      okTimers.current.set(
        btnKey,
        setTimeout(() => setOkBtns((prev) => ({ ...prev, [btnKey]: false })), 1500)
      );
    }
  }, [toast]);

  const completeDay = useCallback(async (day: number) => {
    setDayBusy(true);
    try {
      const res = await fetch("/api/challenge/complete-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_number: day }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setDoneDays((prev) => (prev.includes(day) ? prev : [...prev, day]));
      const next = Math.min(day + 1, 7);
      setCurDay((prev) => Math.max(prev, next));
      setViewDay(next);
      toast(day >= 7 ? "סיימת את האתגר" : "יום הושלם, ממשיכים");
    } catch {
      toast("משהו לא הסתדר, נסו שוב");
    } finally {
      setDayBusy(false);
    }
  }, [toast]);

  // Tab bar: sliding pill + scrollspy (IntersectionObserver, spy-locked while
  // a tap-scroll is in flight — exactly the mockup behavior).
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
    if (strategyRef.current) spy.observe(strategyRef.current);
    return () => {
      spy.disconnect();
      removeEventListener("scrollend", onScrollEnd);
    };
  }, []);

  // Carousel dots via absolute scroll progress (RTL-safe, per the spec).
  const syncDots = useCallback(() => {
    const car = carRef.current;
    if (!car) return;
    const max = car.scrollWidth - car.clientWidth;
    if (max <= 0) return;
    const pos = Math.min(Math.abs(car.scrollLeft), max);
    const n = data.cards.length;
    setDot(Math.min(n - 1, Math.round((pos / max) * (n - 1))));
  }, [data.cards.length]);

  // Card PNG: canvas render + share sheet, download fallback.
  const makePNG = useCallback(async (idx: number) => {
    if (pngBusy.current) return;
    pngBusy.current = true;
    setTimeout(() => { pngBusy.current = false; }, 1500);
    const c = data.cards[idx];
    const split = cardsSplit[idx];
    await document.fonts.load("300 46px Assistant");
    await document.fonts.load("800 64px Assistant");
    const S = 1080;
    const cv = document.createElement("canvas");
    cv.width = S; cv.height = S;
    const ctx = cv.getContext("2d")!;
    ctx.direction = "rtl";
    ctx.textAlign = "center";
    ctx.fillStyle = "#0B0F18";
    ctx.fillRect(0, 0, S, S);
    const g = ctx.createRadialGradient(S / 2, 0, 0, S / 2, 0, S * 0.85);
    g.addColorStop(0, "rgba(232,185,74,0.08)");
    g.addColorStop(1, "rgba(232,185,74,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = "#9E7C3A";
    ctx.lineWidth = 3;
    const m = 60, L = 52;
    ([[m, m, 1, 1], [S - m, m, -1, 1], [m, S - m, 1, -1], [S - m, S - m, -1, -1]] as const).forEach(
      ([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x + dx * L, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * L);
        ctx.stroke();
      }
    );
    const wrapText = (text: string, mw: number) => {
      const ws = text.split(" ");
      const ls: string[] = [];
      let l = "";
      ws.forEach((w) => {
        const t = l ? l + " " + w : w;
        if (ctx.measureText(t).width > mw && l) { ls.push(l); l = w; } else l = t;
      });
      if (l) ls.push(l);
      return ls;
    };
    ctx.fillStyle = "#9E7C3A";
    ctx.font = "800 96px Assistant";
    ctx.fillText('"', S / 2, 240);
    ctx.fillStyle = "#9E9990";
    ctx.font = "300 44px Assistant";
    let y = 370;
    wrapText(split.lead, 800).forEach((l) => { ctx.fillText(l, S / 2, y); y += 66; });
    y += 24;
    ctx.fillStyle = "#EDE9E1";
    ctx.font = "800 62px Assistant";
    wrapText(split.main, 800).forEach((l) => { ctx.fillText(l, S / 2, y); y += 90; });
    const lg = ctx.createLinearGradient(S / 2 - 70, 0, S / 2 + 70, 0);
    lg.addColorStop(0, "rgba(232,185,74,0)");
    lg.addColorStop(0.5, "#E8B94A");
    lg.addColorStop(1, "rgba(232,185,74,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(S / 2 - 70, y + 8, 140, 3);
    const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/png"));
    if (!blob) return;
    const file = new File([blob], c.file, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        toast("הכרטיס נשמר");
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    const a = document.createElement("a");
    a.download = c.file;
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast("הכרטיס נשמר");
  }, [data.cards, cardsSplit, toast]);

  const words = signalWords(data.signalText);

  const CopyIcon = (
    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></svg>
  );
  const SaveIcon = (
    <svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
  );

  const copyBtn = (key: string, text: string) => (
    <button type="button" className={`${sty.btnCopy} ${okBtns[key] ? sty.okState : ""}`} onClick={() => copyText(text, key)}>
      {CopyIcon}
      <span>{okBtns[key] ? "הועתק" : "העתקה"}</span>
    </button>
  );

  return (
    <div className={sty.page} dir="rtl">
      {/* pixel parity with the mockup: same hosted font, same weights */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
      {/* Shared pulse keyframe — used by BuildShootDay and EpisodesList
          to show that generation is in flight. Hoisted here so both
          empty state and populated state have access without duplicating. */}
      <style>{`
        @keyframes kavPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.35; transform: scale(0.65); }
        }
      `}</style>
      <div className={sty.bgfix} aria-hidden="true" />
      <div className={sty.glow} aria-hidden="true" />

      <main className={sty.wrap}>

        <div className={sty.hero} id="top" data-tab-index={0} ref={(el) => { zonesRef.current[0] = el; }}>
          <div className={sty.ghost} aria-hidden="true">הכוורת</div>
          <div className={sty.k}>כוורת האות · חבילת התוכן שלך</div>
          <h1><span className={sty.thin}>האות שלך,</span><br /><span className={sty.goldTxt}>ארוז לפעולה.</span></h1>
        </div>

        <div className={sty.board}>
          <span className={sty.seal}>לוח האות שלך</span>
          <span className={sty.bigq} aria-hidden="true">&quot;</span>
          <div className={sty.txt}>
            {words.map(([w, strong], i) => (
              <span key={i}>
                <span
                  className={seen ? (strong ? sty.seenStrong : sty.seen) : strong ? sty.strong : sty.w}
                  style={seen ? undefined : { animationDelay: `${0.15 + i * 0.05}s${strong ? ", 3s" : ""}` }}
                >
                  {w}
                </span>{" "}
              </span>
            ))}
          </div>
          <div className={sty.bfoot}>
            <span className={sty.sig}>האות של {data.firstName}</span>
            <button type="button" className={`${sty.btnGold} ${okBtns.signal ? sty.okState : ""}`} onClick={() => copyText(data.signalText, "signal")}>
              {CopyIcon}
              <span>{okBtns.signal ? "הועתק" : "העתקה"}</span>
            </button>
          </div>
        </div>

        {!data.demo ? (() => {
          const allDone = data.challengeDone || doneDays.includes(7);
          const firstUnfilmed = data.scripts.find((sc) => !data.filmedNumbers.includes(sc.number));
          const pendingReel = reels.find((r) => !r.published && !published[r.editId]);
          let label: string, sub: string, act: () => void;
          if (!allDone) {
            const started = doneDays.length > 0 || curDay > 0;
            label = started ? `להמשיך באתגר, יום ${Math.max(curDay, 1)}` : "מתחילים את האתגר";
            sub = started
              ? "הצעד היומי הבא מחכה לך למטה"
              : "שבעה ימים, צעד ביום. הפתיחה מחכה לך";
            act = () => goTab(1);
          } else if (firstUnfilmed && data.extractionId) {
            label = "לצלם עכשיו";
            sub = `התסריט הבא שלך: ${firstUnfilmed.title}`;
            const href = `/hive/signal-kit/broadcast/${data.extractionId}/${firstUnfilmed.number}`;
            act = () => { window.location.href = href; };
          } else if (pendingReel) {
            label = "לפרסם את הרילס";
            sub = "יש לך רילס מוכן שממתין לפרסום";
            act = () => goTab(4);
          } else {
            label = "לצלם טייק נוסף";
            sub = "כל התסריטים צולמו. אפשר תמיד לחדד";
            act = () => goTab(3);
          }
          return (
            <div className={sty.trow} style={{ borderColor: "rgba(232,185,74,0.4)" }}>
              <div className={sty.head}>
                <span className={sty.plat}>הצעד הבא שלך</span>
              </div>
              <p className={sty.txt}>{sub}</p>
              <div className={sty.tfoot}>
                <button type="button" className={`${sty.btnCopy} ${sty.btnCard}`} onClick={act}>
                  <span>{label}</span>
                </button>
              </div>
            </div>
          );
        })() : null}

        <section className={sty.zone} id="z-strategy" data-tab-index={0} ref={(el) => { strategyRef.current = el; }}>
          <div className={sty.zhead}>
            <span className={sty.zt}><h2>אסטרטגיה</h2><span className={sty.hint}>לעיניך בלבד, לא לפרסום</span></span>
          </div>
          <div className={sty.zrule} />

          <details className={sty.disc} open>
            <summary>
              <span className={sty.st}>
                <span className={sty.ic}><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M14.6 9.4l-1.8 4-4 1.8 1.8-4z" /></svg></span>
                <span><span className={sty.t}>הצהרת המיקום שלך</span><br /><span className={sty.p}>המשפט שמכוון כל החלטה</span></span>
              </span>
              <span className={sty.chev}><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg></span>
            </summary>
            <div className={sty.body}>{data.positioning}</div>
            <div className={sty.dfoot}>{copyBtn("pos", data.positioning)}</div>
          </details>

          <details className={sty.disc}>
            <summary>
              <span className={sty.st}>
                <span className={sty.ic}><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4" /><path d="M5 19.5c1.3-3.2 3.9-4.8 7-4.8s5.7 1.6 7 4.8" /></svg></span>
                <span><span className={sty.t}>הלקוח האידיאלי שלך</span><br /><span className={sty.p}>פרסונה מלאה</span></span>
              </span>
              <span className={sty.chev}><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg></span>
            </summary>
            <div className={sty.body}>{data.persona}</div>
            <div className={sty.dfoot}>{copyBtn("persona", data.persona)}</div>
          </details>
        </section>

        <section className={sty.zone} id="z-challenge" data-tab-index={1} ref={(el) => { zonesRef.current[1] = el; }}>
          <div className={sty.zhead}>
            <span className={sty.zn}>01</span>
            <span className={sty.zt}><h2>אתגר האות</h2><span className={sty.hint}>שבעה ימים, צעד ביום</span></span>
          </div>
          <div className={sty.zrule} />
          <div className={sty.trow}>
            <div className={sty.head}><span className={sty.plat}>לוח האתגר שלך</span><span className={sty.check}>{
              data.demo
                ? `יום ${data.challengeDay} מתוך 7`
                : data.challengeDone || doneDays.includes(7)
                  ? <><span className={sty.v}>✓</span> הושלם</>
                  : doneDays.length === 0 && curDay === 0
                    ? "עוד לא התחלת, הפתיחה מחכה לך"
                    : `יום ${Math.max(curDay, 1)} מתוך 7`
            }</span></div>
            {data.demo || !data.challengeDays.length ? (
              <>
                <p className={sty.txt}>
                  כאן נטען לוח האתגר החי מהערכה: הצעד היומי, הסטטוס, וההנחיה של הדר להיום.
                </p>
                <div className={sty.tfoot}>
                  <a className={sty.btnCopy} href="/hive/signal-kit"><span>להמשיך באתגר</span></a>
                </div>
              </>
            ) : (() => {
              const shown = data.challengeDays.find((d) => d.day === Math.min(viewDay, 7)) ?? data.challengeDays[0];
              const isDone = doneDays.includes(shown.day);
              const allDone = data.challengeDone || doneDays.includes(7);
              return (
                <div>
                  {/* day chips: done / current / locked */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "4px 0 12px" }}>
                    {data.challengeDays.map((d) => {
                      const done = doneDays.includes(d.day);
                      const locked = d.day > curDay;
                      const active = d.day === shown.day;
                      return (
                        <button
                          key={d.day}
                          type="button"
                          disabled={locked}
                          onClick={() => setViewDay(d.day)}
                          style={{
                            minWidth: 40,
                            height: 32,
                            borderRadius: 999,
                            border: active ? "none" : "1px solid rgba(232,185,74,0.3)",
                            background: active
                              ? "linear-gradient(160deg,#F6DFA0,#9E7C3A)"
                              : "transparent",
                            color: active ? "#080C14" : done ? "#7FBF8E" : locked ? "#5A564E" : "#E8B94A",
                            fontFamily: "inherit",
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: locked ? "default" : "pointer",
                          }}
                        >
                          {done ? "✓ " : ""}{d.day === 0 ? "פתיחה" : d.day}
                        </button>
                      );
                    })}
                  </div>
                  {DAY_FRAMES[shown.day] ? (
                    <p className={sty.txt} style={{ color: "#E8B94A", fontWeight: 600 }}>
                      {DAY_FRAMES[shown.day]}
                    </p>
                  ) : null}
                  <p className={sty.txt} style={{ marginTop: 8 }}>
                    {shown.day === 0 ? "פתיחה" : `יום ${shown.day}`} · {shown.title}
                  </p>
                  <div
                    style={{
                      maxWidth: shown.portrait ? 300 : "100%",
                      margin: "14px auto 0",
                      aspectRatio: shown.portrait ? "9 / 16" : "16 / 9",
                      background: "#000",
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <iframe
                      loading="lazy"
                      src={`https://player.vimeo.com/video/${shown.videoId}`}
                      allow="autoplay; fullscreen; picture-in-picture"
                      style={{ width: "100%", height: "100%", border: 0 }}
                      title={`יום ${shown.day}`}
                    />
                  </div>
                  <div className={sty.tfoot}>
                    {allDone ? (
                      <span className={sty.txt} style={{ flex: 1, color: "#7FBF8E" }}>
                        סיימת את האתגר, כל הכבוד
                      </span>
                    ) : isDone ? (
                      <span className={sty.txt} style={{ flex: 1, color: "#7FBF8E" }}>
                        היום הזה הושלם
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={`${sty.btnCopy} ${sty.btnCard}`}
                        disabled={dayBusy || shown.day > curDay}
                        onClick={() => completeDay(shown.day)}
                      >
                        <span>{dayBusy ? "רגע..." : "סיימתי את היום"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {data.liveMeeting ? (
            <div className={sty.trow} style={{ marginTop: 16 }}>
              <div className={sty.head}>
                <span className={sty.plat}>מפגש הסיום החי עם הדר</span>
                <span className={sty.check} style={{ color: "#7FD49B" }}>בזום, אחרי שבעת הימים</span>
              </div>
              <p className={sty.txt}>{data.liveMeeting.label}</p>
              {data.liveMeeting.zoomUrl ? (
                <div className={sty.tfoot}>
                  <a
                    className={sty.btnCopy}
                    style={{ textDecoration: "none" }}
                    href={data.liveMeeting.zoomUrl}
                    target="_blank"
                    rel="noopener"
                  >
                    <span>לכניסה למפגש בזום</span>
                  </a>
                </div>
              ) : (
                <p className={sty.txt} style={{ fontSize: 13, color: "#ACA79E", marginTop: 8 }}>
                  הקישור לזום יפורסם כאן סמוך למפגש.
                </p>
              )}
            </div>
          ) : null}
        </section>

        <section className={sty.zone} id="z-visual" data-tab-index={2} ref={(el) => { zonesRef.current[2] = el; }}>
          <div className={sty.zhead}>
            <span className={sty.zn}>02</span>
            <span className={sty.zt}><h2>ויזואל</h2><span className={sty.hint}>החליקו בין הכרטיסים</span></span>
          </div>
          <div className={sty.zrule} />

          <div className={sty.carousel} ref={carRef} onScroll={syncDots}>
            {data.cards.map((c, i) => (
              <div className={sty.vc} key={c.name}>
                <div className={sty.frame}>
                  <span className={`${sty.corner} ${sty.c1}`} /><span className={`${sty.corner} ${sty.c2}`} /><span className={`${sty.corner} ${sty.c3}`} /><span className={`${sty.corner} ${sty.c4}`} />
                  <div className={sty.q}>&quot;</div>
                  {cardsSplit[i].lead ? <div className={sty.lead}>{cardsSplit[i].lead}</div> : null}
                  <div className={sty.main}>{cardsSplit[i].main}</div>
                </div>
                <div className={sty.meta}><span className={sty.name}>{c.name}</span><span className={sty.use}>{c.use}</span></div>
                <div className={sty.vfoot}>
                  <button type="button" className={`${sty.btnCopy} ${sty.btnCard}`} aria-label={`שמירת כרטיס ${c.name}`} onClick={() => makePNG(i)}>
                    {SaveIcon}
                    <span>שמירת הכרטיס</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={sty.dots} aria-hidden="true">
            {data.cards.map((_, i) => (
              <span key={i} className={i === dot ? sty.on : undefined} />
            ))}
          </div>

          {!data.demo && data.extractionId ? (
            <div>
              <div className={sty.zhead} style={{ marginTop: 34 }}>
                <span className={sty.zt}>
                  <h2 style={{ fontSize: 19 }}>הנכסים המעוצבים</h2>
                  <span className={sty.hint}>מוכנים לפיד, בהתאמה אישית</span>
                </span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 14px", margin: "14px 0 2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#141820", border: "1px solid #2C323E", borderRadius: 999, padding: 5 }}>
                  <span style={{ color: "#9E9990", fontSize: 12, fontWeight: 300, marginInlineStart: 12, marginInlineEnd: 4 }}>עיצוב</span>
                  <AssetPill on={assetBg === "color"} onClick={() => setAssetBg("color")}>צבע נקי</AssetPill>
                  <AssetPill on={assetBg === "image"} onClick={() => setAssetBg("image")}>תמונה ברמה גבוהה</AssetPill>
                </div>
              </div>
              <div className={sty.carousel}>
                {VISUAL_ASSETS.map((a) => (
                  <div className={sty.vc} key={a.type}>
                    <div className={sty.frame} style={{ padding: 0, aspectRatio: "4 / 5" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetUrl(data.extractionId!, a.type, assetBg)}
                        alt={a.label}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }}
                      />
                    </div>
                    <div className={sty.meta}><span className={sty.name}>{a.label}</span></div>
                    <div className={sty.vfoot}>
                      <a
                        className={`${sty.btnCopy} ${sty.btnCard}`}
                        style={{ textDecoration: "none" }}
                        href={assetUrl(data.extractionId!, a.type, assetBg)}
                        download
                      >
                        <span>הורדת הנכס</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className={sty.zone} id="z-filming" data-tab-index={3} ref={(el) => { zonesRef.current[3] = el; }}>
          <div className={sty.zhead}>
            <span className={sty.zn}>03</span>
            <span className={sty.zt}><h2>יום הצילום</h2><span className={sty.hint}>לקרוא לפני המצלמה</span></span>
          </div>
          <div className={sty.zrule} />

          {data.letterFromHadar && (
            <div className={sty.letterbox}>
              <p>{data.letterFromHadar.body}</p>
              <p className={sty.em}>{data.letterFromHadar.close}</p>
              <p className={sty.lsig}>הדר</p>
            </div>
          )}

          <div style={{ marginTop: 32 }}>
            {/* Divider: signal a new movement inside zone 03 (letter → series). */}
            <div
              aria-hidden="true"
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(232,185,74,0.28), transparent)",
                marginBottom: 20,
              }}
            />
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, color: "#EDE9E1", margin: 0 }}>
                הסדרה שלך
              </h3>
              <span className={sty.hint} style={{ flex: "0 0 auto" }}>
                7 פרקים בהתאמה אישית
              </span>
            </div>
            {data.scripts.length === 0 ? (
              <div className={sty.trow}>
                <BuildShootDay extractionId={data.extractionId} />
              </div>
            ) : (
              <>
                <ShootDayProgress filmed={data.filmedCount} total={data.scriptsTotal} />
                <EpisodesList
                  extractionId={data.extractionId}
                  scripts={data.scripts}
                  filmedNumbers={data.filmedNumbers}
                  identity={data.identity}
                  takesPerScript={data.takesPerScript}
                  takesCap={data.takesCap}
                  seasonUsed={data.seasonUsed}
                  seasonCap={data.seasonCap}
                />
              </>
            )}
          </div>
        </section>

        <section className={sty.zone} id="z-mine" data-tab-index={4} ref={(el) => { zonesRef.current[4] = el; }}>
          <div className={sty.zhead}>
            <span className={sty.zn}>04</span>
            <span className={sty.zt}><h2>התכנים שלי</h2><span className={sty.hint}>הפרקים שכבר צילמת</span></span>
          </div>
          <div className={sty.zrule} />

          {!data.demo ? (
            <div>
              <div className={sty.zhead} style={{ marginTop: 8 }}>
                <span className={sty.zt}>
                  <h2 style={{ fontSize: 19 }}>הסדרה שלך</h2>
                  <span className={sty.hint}>כל עונה, שבעה פרקים. גוף עבודה שממשיך לגדול</span>
                </span>
              </div>

              <div className={sty.seShelfHead}>
                <span className={sty.seT}>עונה ראשונה</span>
                <span className={sty.seS}>
                  {reels.filter((r) => !deletedReels[r.editId]).length} מתוך {data.scriptsTotal || 7} פרקים
                </span>
                {reels.filter((r) => !deletedReels[r.editId]).length >= (data.scriptsTotal || 7) ? (
                  <span className={sty.seSeal}>העונה הושלמה</span>
                ) : null}
              </div>

              <div className={sty.seCar}>
                {reels.filter((r) => !deletedReels[r.editId]).map((r, idx) => {
                  const isPub = r.published || published[r.editId];
                  const script = data.scripts.find((s) => s.number === r.videoNumber);
                  const epName = script?.title || `הפרק שצולם ב-${new Date(r.createdAt).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" })}`;
                  return (
                    <div className={sty.seCard} key={r.editId}>
                      <button
                        type="button"
                        className={sty.seThumb}
                        aria-label={`פתח פרק ${idx + 1}`}
                        onClick={() => setViewerEditId(r.editId)}
                      >
                        {r.thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.thumbUrl} alt="" loading="lazy" />
                        ) : null}
                        <span className={sty.seGrad} />
                        <span className={sty.sePlay} />
                      </button>
                      <span className={`${sty.seTag} ${isPub ? sty.seTagAir : sty.seTagWait}`}>
                        {isPub ? "באוויר" : "מוכן לפרסום"}
                      </span>
                      <div className={sty.seName}>
                        <span className={sty.seNo}>{String(idx + 1).padStart(2, "0")}</span>
                        {epName}
                      </div>
                    </div>
                  );
                })}
                {reels.filter((r) => !deletedReels[r.editId]).length < (data.scriptsTotal || 7) ? (
                  <div className={sty.seNextCard}>
                    <button type="button" className={sty.seThumb} onClick={() => goTab(3)} aria-label="לצלם את הפרק הבא">
                      <span className={sty.seNum}>
                        {String(reels.filter((r) => !deletedReels[r.editId]).length + 1).padStart(2, "0")}
                      </span>
                    </button>
                    <div className={sty.seName} style={{ color: "#9E9990" }}>הפרק הבא מחכה בחדר השידור</div>
                  </div>
                ) : null}
              </div>

              <SeasonsRoadmap />
            </div>
          ) : null}

          <div className={sty.zhead} style={{ marginTop: 34 }}>
            <span className={sty.zt}>
              <h2 style={{ fontSize: 19 }}>התכנים לרשתות</h2>
              <span className={sty.hint}>ביו, אודות ומניפסט. לחיצה פותחת, נגיעה בטקסט מעתיקה</span>
            </span>
          </div>
          <div className={sty.zrule} />

          {(() => {
            // outward texts come only from the content kit; show each once
            const seen = new Set<string>();
            const rows = ([
              ["ביו לאינסטגרם", "קצר ומדויק לפרופיל", data.bioInstagram, "bio"],
              ["כותרת ללינקדאין", "שורת המיצוב המקצועית", data.linkedinHeadline, "li"],
              ["אודות לפייסבוק", "פסקת ההיכרות המלאה", data.facebookAbout, "fb"],
              ["אודות לאתר", "הגרסה הארוכה", data.aboutSite, "about"],
              ["מניפסט אישי", "האני-מאמין שלך", data.manifesto, "manifesto"],
            ] as const).filter(([, , text]) => {
              const norm = text.trim().replace(/\s+/g, " ");
              if (!norm || seen.has(norm)) return false;
              seen.add(norm);
              return true;
            });
            if (!rows.length) {
              return (
                <div className={sty.trow}>
                  <div className={sty.head}><span className={sty.plat}>התכנים לרשתות</span></div>
                  <p className={sty.txt}>
                    התכנים שלך לרשתות עדיין בהכנה. ברגע שהם מוכנים הם יופיעו כאן, כתובים ומדויקים לקהל שלך
                  </p>
                </div>
              );
            }
            return rows.map(([label, sub, text, key]) => (
              <details className={sty.disc} key={key}>
                <summary>
                  <span className={sty.st}>
                    <span className={sty.ic}><svg viewBox="0 0 24 24"><path d="M8 4h8a2 2 0 0 1 2 2v14l-2-1.5L14 20l-2-1.5L10 20l-2-1.5L6 20V6a2 2 0 0 1 2-2z" /><path d="M9.5 9h5M9.5 12.5h5" /></svg></span>
                    <span><span className={sty.t}>{label}</span><br /><span className={sty.p}>{sub}</span></span>
                  </span>
                  <span className={sty.chev}><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg></span>
                </summary>
                <div className={sty.body}>
                  <p className={`${sty.txt} ${sty.txtCopy}`} onClick={() => copyText(text, key)} style={{ margin: 0 }}>{text}</p>
                </div>
                <div className={sty.dfoot}>{copyBtn(key, text)}</div>
              </details>
            ));
          })()}


          {data.demo ? (
            <>
              <div className={sty.zhead} style={{ marginTop: 34 }}>
                <span className={sty.zt}><h2 style={{ fontSize: 19 }}>הפרקים בסדרה שלך</h2><span className={sty.hint}>שבעה סרטונים במסגרת כוורת האות</span></span>
              </div>
              <div className={sty.trow}>
                <div className={sty.head}><span className={sty.plat}>חבילת כוורת האות</span><span className={sty.check}>{data.filmedCount} מתוך {data.scriptsTotal} הופקו</span></div>
                <p className={sty.txt}>שבעת התסריטים שלך, כל אחד עם כפתור לצלם עכשיו.</p>
              </div>
            </>
          ) : null}
        </section>

        <KaveretChatLauncher />
        <a
          className={sty.wa}
          href={`https://wa.me/${data.waPhone}`}
          target="_blank"
          rel="noopener"
          style={{ display: "none" }}
          aria-hidden="true"
        >
          <span className={sty.ic}><svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-13.2 8L3 21l1.1-4.6A9 9 0 1 1 21 12z" /></svg></span>
          <span><span className={sty.t}>שאלה על הכוורת שלך?</span><br /><span className={sty.s}>הדר והצוות עונים בוואטסאפ</span></span>
        </a>

        {!data.demo ? <div style={{ height: 72 }} aria-hidden="true" /> : null}
        <footer className={sty.note}>כוורת האות · beegood · שיטת TrueSignal</footer>
      </main>

      <nav className={sty.tabbar} aria-label="ניווט">
        {([
          ["האות", <svg key="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2.4" /><path d="M12 4v3M12 17v3M4 12h3M17 12h3" /></svg>],
          ["אתגר", <svg key="i" viewBox="0 0 24 24"><path d="M8 4h8M12 4v5" /><circle cx="12" cy="14" r="6" /><path d="M12 12v2.5l1.8 1.2" /></svg>],
          ["ויזואל", <svg key="i" viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="2" /><circle cx="9.5" cy="9.5" r="1.6" /><path d="M5 17l4.5-4.5 3 3 2.5-2.5L19 17" /></svg>],
          ["צילום", <svg key="i" viewBox="0 0 24 24"><rect x="3.5" y="7" width="12" height="10" rx="2" /><path d="M15.5 10.5l4.5-2.5v8l-4.5-2.5z" /></svg>],
          ["התכנים", <svg key="i" viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></svg>],
        ] as const).map(([label, icon], i) => (
          <button
            key={label}
            type="button"
            className={`${sty.tb} ${activeTab === i ? sty.on : ""}`}
            aria-label={label}
            aria-current={activeTab === i ? "true" : undefined}
            onClick={() => goTab(i)}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className={`${sty.toast} ${toastOn ? sty.on : ""}`} role="status">
        <span className={sty.ok}>✓</span><span>{toastMsg}</span>
      </div>

      {viewerEditId && (() => {
        const r = reels.find((x) => x.editId === viewerEditId);
        if (!r) return null;
        const script = data.scripts.find((s) => s.number === r.videoNumber);
        const title  = script?.title || `הפרק שצולם ב-${new Date(r.createdAt).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" })}`;
        const isPub  = r.published || published[r.editId];
        return (
          <EpisodeViewer
            editId={r.editId}
            reviewItemId={r.reviewItemId}
            title={title}
            downloadUrl={r.downloadUrl}
            isPublished={isPub}
            onClose={() => setViewerEditId(null)}
            onMarkPublished={() => {
              setPublished((prev) => ({ ...prev, [r.editId]: true }));
              fetch(`/api/broadcast/review-items/${r.reviewItemId}/publish`, { method: "POST" }).catch(() => {});
              toast("סומן כפורסם");
            }}
            onDelete={async () => {
              const res = await fetch(`/api/broadcast/edits/${r.editId}`, { method: "DELETE" }).catch(() => null);
              if (res?.ok) {
                setDeletedReels((prev) => ({ ...prev, [r.editId]: true }));
                setViewerEditId(null);
                toast("הפרק נמחק");
              } else {
                toast("המחיקה לא הצליחה, נסו שוב");
              }
            }}
            onShareResult={(msg) => toast(msg)}
          />
        );
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BuildShootDay — the empty-state builder.
// The old "לבנות את ערכת הצילום" button was an <a href="/hive/signal-kit">
// pointing at a route that has since become a redirect back to /kaveret.
// Alon flagged the resulting no-op 2026-07-10 evening. Now the button runs
// the actual generation flow inline:
//   1. GET  /api/signal/[id]/shoot-day       → identity + pillars + letter
//   2. POST /api/signal/[id]/shoot-day/finish → Video #1 (identity, 15s)
// Videos 2-7 are generated on demand when the customer expands each row
// (existing /videos batching lives in the ShootDayBuilder flow); after step 2
// the page reloads so the just-cached Video #1 shows up and the letterbox
// renders the customer-tuned letter_from_hadar.
// ─────────────────────────────────────────────────────────────────────
function BuildShootDay({ extractionId }: { extractionId: string | null }) {
  const [state, setState]   = useState<"idle" | "phase1" | "phase2" | "done" | "err">("idle");
  const [errMsg, setErrMsg] = useState<string>("");

  const build = useCallback(async () => {
    if (!extractionId) {
      setErrMsg("חסר extractionId — פנה לתמיכה");
      setState("err");
      return;
    }
    try {
      setState("phase1");
      const r1 = await fetch(`/api/signal/${extractionId}/shoot-day`);
      const t1 = await r1.text();
      const d1 = safeJson(t1) as { phase?: string; identity_statement?: string; pillars?: unknown; error?: string } | null;
      if (!r1.ok || !d1) throw new Error(String(d1?.error ?? `שלב 1 נכשל (${r1.status})`));

      // If the plan is already fully cached, jump straight to reload.
      if (d1.phase !== "complete") {
        if (!d1.identity_statement || !d1.pillars) {
          throw new Error("שלב 1 לא החזיר identity+pillars");
        }
        setState("phase2");
        const r2 = await fetch(`/api/signal/${extractionId}/shoot-day/finish`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            identity_statement: d1.identity_statement,
            pillars:            d1.pillars,
          }),
        });
        const t2 = await r2.text();
        const d2 = safeJson(t2) as { plan?: unknown; error?: string } | null;
        if (!r2.ok || !d2?.plan) throw new Error(String(d2?.error ?? `שלב 2 נכשל (${r2.status})`));
      }
      setState("done");
      // The page reads shoot_day slices on the server; a hard reload picks up
      // the new phase-1 fields (identity, letter_from_hadar) + Video #1.
      window.location.reload();
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
      setState("err");
    }
  }, [extractionId]);

  const working = state === "phase1" || state === "phase2" || state === "done";
  const label =
    state === "phase1" ? "מחלצים את משפט הזהות שלך…" :
    state === "phase2" ? "בונים את הסרטון הראשון…" :
    state === "done"   ? "רגע…" :
    "לבנות את ערכת הצילום";
  return (
    <>
      <p className={sty.txt}>ערכת יום הצילום שלך עוד לא נבנתה. זה לוקח כמה דקות, ומחכה לך בערכה.</p>
      {state === "err" && (
        <p className={sty.txt} style={{ color: "#FF8888", marginTop: 10, fontSize: 14 }}>
          {errMsg}
        </p>
      )}
      <div className={sty.tfoot}>
        <button
          type="button"
          className={`${sty.btnCopy} ${sty.btnCard}`}
          onClick={build}
          disabled={working}
          style={{
            cursor: working ? "wait" : "pointer",
            gap: 10,
          }}
        >
          {working && (
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#171204",
                marginInlineEnd: 4,
                animation: "kavPulse 1s ease-in-out infinite",
              }}
            />
          )}
          <span>{label}</span>
        </button>
      </div>
    </>
  );
}

// Same JSON-tolerant parser used elsewhere in the client (fetch bodies can
// come back with prose wrapping, esp. from 4xx paths).
function safeJson(t: string): Record<string, unknown> | null {
  try { return JSON.parse(t); } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────
// EpisodeViewer — video modal for zone 04 reels.
// Alon 2026-07-11: clicking a reel used to open `?download=true` in a new
// tab (Chrome/Safari treat the storage URL as a forced download), so tapping
// a video on mobile started a download instead of showing the video. Now
// tap → this modal — 9:16 native <video> autoplay, floating action pills at
// bottom for share (Web Share API + WhatsApp fallback), download, mark
// published, delete. Same handler surface as the removed "..." dropdown,
// but reachable from the primary interaction instead of a hidden triple-dot.
// ─────────────────────────────────────────────────────────────────────
function EpisodeViewer({
  editId, reviewItemId, title, downloadUrl, isPublished,
  onClose, onMarkPublished, onDelete, onShareResult,
}: {
  editId: string;
  reviewItemId: string | null;
  title: string;
  downloadUrl: string | null;
  isPublished: boolean;
  onClose: () => void;
  onMarkPublished: () => void;
  onDelete: () => Promise<void>;
  onShareResult: (msg: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Strip the ?download=true param the storage URL ships with so <video> can
  // stream it instead of triggering a browser download.
  const streamUrl = downloadUrl
    ? downloadUrl.replace(/([?&])download=true(&?)/, (_, sep, tail) => (tail ? sep : "")).replace(/[?&]$/, "")
    : null;

  const share = useCallback(async () => {
    if (!downloadUrl) { onShareResult("אין קישור זמין"); return; }
    // Prefer native share sheet — supports files on iOS + Android.
    // Fall back to copying the URL if unavailable.
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav?.share) {
      try {
        await nav.share({ title, url: downloadUrl });
        onShareResult("הפרק שותף");
        return;
      } catch {
        /* user cancelled — silent */
        return;
      }
    }
    try {
      await nav?.clipboard?.writeText(downloadUrl);
      onShareResult("הקישור הועתק ללוח");
    } catch {
      onShareResult("שיתוף לא נתמך במכשיר זה");
    }
  }, [downloadUrl, title, onShareResult]);

  const download = useCallback(() => {
    if (!downloadUrl) { onShareResult("אין קישור זמין"); return; }
    // Existing download URL from Supabase Storage carries ?download=true,
    // which coerces browsers to treat the response as a file attachment.
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${title || `beegood-episode-${editId}`}.mp4`;
    a.rel = "noopener";
    a.click();
  }, [downloadUrl, title, editId, onShareResult]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,10,18,0.96)",
        zIndex: 9500,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Title strip — fixed height, sits above the video */}
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
              color: "#EDE9E1",
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: isPublished ? "#7FBF8E" : "#E8B94A", fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>
            {isPublished ? "באוויר" : "מוכן לפרסום"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: "rgba(232,185,74,0.14)",
            border: "1px solid rgba(232,185,74,0.35)",
            color: "#E8B94A",
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

      {/* Video area — flex-grows to fill remaining space, video is
          contained inside so native controls sit BELOW its own bottom edge
          rather than colliding with our action pills. */}
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
          <div style={{ color: "#EDE9E1", padding: 20 }}>הסרטון עוד לא זמין</div>
        )}
      </div>

      {/* Action bar — its own strip below the video, so it never overlays
          the native play/pause bar. Horizontally scrolls on very narrow
          screens rather than wrapping to a second line. */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "16px 16px calc(16px + env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "center",
          gap: 10,
          overflowX: "auto",
          scrollbarWidth: "none",
          borderTop: "1px solid rgba(232,185,74,0.1)",
          background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.35))",
        }}
      >
        <ViewerPill onClick={share} label="שיתוף">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 10.6l6.8-4.1M8.6 13.4l6.8 4.1" />
          </svg>
        </ViewerPill>

        <ViewerPill onClick={download} label="הורדה" primary>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v11m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </ViewerPill>

        {!isPublished && reviewItemId && (
          <ViewerPill onClick={() => { onMarkPublished(); onClose(); }} label="פורסם">
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
          label={deleting ? "מוחק…" : confirmDel ? "לחץ שוב לאישור" : "מחיקה"}
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
  const bg = primary
    ? "linear-gradient(180deg,#F1D07E,#E2B34A,#CE9C38)"
    : danger
    ? "rgba(255,136,136,0.14)"
    : "rgba(20,24,32,0.9)";
  const color = primary ? "#171204" : danger ? "#FF9F9F" : "#EDE9E1";
  const border = primary
    ? "none"
    : danger
    ? "1px solid rgba(255,136,136,0.4)"
    : "1px solid rgba(232,185,74,0.3)";
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
        boxShadow: primary
          ? "0 8px 22px rgba(232,185,74,0.35)"
          : "0 6px 16px rgba(0,0,0,0.45)",
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ShootDayProgress + EpisodesList — the redesigned zone 03 UX.
// Alon 2026-07-10 evening: the "מתוך N" counter went nonsensical
// ("2 מתוך 1") whenever caching landed partial slices, only one script row
// showed even though the season is always 7 episodes, no way to trigger
// videos 2-7 after the initial build, and no progress feedback ("looks
// stuck"). Fixed all four:
//   • Total is now hardcoded at 7 (canonical shoot day).
//   • 7 rows always render — each in one of three states (unbuilt,
//     built-not-filmed, built-filmed) with the right CTA.
//   • Unbuilt rows have "צור את הפרק"; POST /shoot-day/videos with
//     numbers=[N]. Spinner + status text while generating.
//   • ShootDayProgress renders a gold segmented bar so the customer sees
//     "3 מתוך 7" as visual progress, not just text.
// ─────────────────────────────────────────────────────────────────────

// Titles for the seven episodes — one per methodology from Hadar's
// 7-day challenge (Alon 2026-07-11 realignment). Used as placeholders on
// unbuilt rows and as fallbacks when the generated video lacks a title.
const CANONICAL_TITLES: Record<number, string> = {
  1: "סרטון בעיה",
  2: "סרטון סיפור",
  3: "אזור הגאונות",
  4: "סרטון דעה",
  5: "פירוק התנגדויות",
  6: "סיפור + דעה",
  7: "עדות + הזמנה",
};

function ShootDayProgress({ filmed, total }: { filmed: number; total: number }) {
  const cells = Array.from({ length: total }, (_, i) => i < filmed);
  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Counter FIRST in DOM so RTL flex-row puts it on the right (leading edge). */}
      <span
        style={{
          flex: "0 0 auto",
          fontSize: 12,
          fontWeight: 800,
          color: "#E8B94A",
          letterSpacing: 0.5,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span dir="ltr" style={{ unicodeBidi: "isolate" }}>{filmed}/{total}</span>
        <span style={{ color: "#7A756D", fontWeight: 500, marginInlineStart: 4 }}>צולמו</span>
      </span>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {cells.map((done, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: done
                ? "linear-gradient(90deg,#F6DFA0,#E2B34A)"
                : "rgba(232,185,74,0.14)",
              boxShadow: done ? "0 0 8px rgba(232,185,74,0.35)" : undefined,
              transition: "background .3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

type BuiltScript = { number: number; title: string; hook: string; body: string; cta: string; interviewQuestions?: string[] };

function EpisodesList({
  extractionId,
  scripts,
  filmedNumbers,
  identity,
  takesPerScript,
  takesCap,
  seasonUsed,
  seasonCap,
}: {
  extractionId: string | null;
  scripts: BuiltScript[];
  filmedNumbers: number[];
  identity: string;
  takesPerScript: Record<number, number>;
  takesCap: number;
  seasonUsed: number;
  seasonCap: number;
}) {
  const seasonFull = seasonUsed >= seasonCap;
  const [localScripts, setLocalScripts] = useState<BuiltScript[]>(scripts);
  const [generating, setGenerating]     = useState<Set<number>>(new Set());
  const [errByNumber, setErrByNumber]   = useState<Record<number, string>>({});

  const requestBuild = useCallback(async (n: number) => {
    if (!extractionId) return;
    setErrByNumber((p) => { const c = { ...p }; delete c[n]; return c; });
    setGenerating((prev) => new Set(prev).add(n));
    try {
      // The videos endpoint wants identity + pillars. Fetch them fresh so we
      // don't rely on client-cached copies going stale between page loads.
      const r0 = await fetch(`/api/signal/${extractionId}/shoot-day`);
      const d0 = safeJson(await r0.text()) as { identity_statement?: string; pillars?: unknown; phase?: string; plan?: { identity_statement?: string; pillars?: unknown } } | null;
      if (!r0.ok || !d0) throw new Error(`שלב 1 נכשל (${r0.status})`);
      const identityStmt = d0.identity_statement || d0.plan?.identity_statement || identity;
      const pillars      = d0.pillars || d0.plan?.pillars;
      if (!identityStmt || !Array.isArray(pillars) || pillars.length !== 4) {
        throw new Error("לא ניתן להשיג את משפט הזהות + 4 עמודי המסר");
      }

      const r = await fetch(`/api/signal/${extractionId}/shoot-day/videos`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          identity_statement: identityStmt,
          pillars,
          numbers: [n],
        }),
      });
      const d = safeJson(await r.text()) as { videos?: BuiltScript[]; error?: string; details?: string } | null;
      if (!r.ok || !d?.videos || d.videos.length === 0) {
        throw new Error(String(d?.error ?? `יצירה נכשלה (${r.status})`));
      }
      // Videos endpoint returns full Video objects; project to BuiltScript shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = d.videos[0] as any;
      const built: BuiltScript = {
        number: v.number,
        title:  String(v.title ?? CANONICAL_TITLES[n] ?? `פרק ${n}`),
        hook:   String(v.script?.hook ?? ""),
        body:   String(v.script?.body ?? ""),
        cta:    v.script?.cta ? String(v.script.cta) : "",
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
            borderInlineStart: "3px solid #E8B94A",
            background: "linear-gradient(90deg, rgba(232,185,74,0.08), rgba(232,185,74,0.02) 60%, transparent)",
            borderRadius: 10,
            color: "#EDE9E1",
          }}
        >
          <span
            style={{
              color: "#E8B94A",
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: 2,
              display: "block",
              marginBottom: 6,
            }}
          >
            הליבה של העונה
          </span>
          <span style={{ fontSize: 15, fontWeight: 400, lineHeight: 1.55, color: "#EDE9E1" }}>
            {identity}
          </span>
        </div>
      )}
      {Array.from({ length: 7 }, (_, i) => i + 1).map((n) => {
        const s      = scriptByNumber.get(n);
        const filmed = s ? filmedNumbers.includes(n) : false;
        const inFlight = generating.has(n);
        const err      = errByNumber[n];

        // ── Unbuilt row ────────────────────────────────────────────────
        if (!s) {
          return (
            <div
              key={n}
              style={{
                background: "#141820",
                border: "1px solid rgba(232,185,74,0.12)",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: inFlight
                    ? "linear-gradient(160deg,#F6DFA0,#9E7C3A)"
                    : "rgba(232,185,74,0.1)",
                  border: "1px solid rgba(232,185,74,0.3)",
                  color: inFlight ? "#171204" : "#9E7C3A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  flex: "0 0 auto",
                }}
              >
                {n}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15.5, color: "#EDE9E1", fontWeight: 700 }}>
                  {CANONICAL_TITLES[n] ?? `פרק ${n}`}
                </div>
                {inFlight ? (
                  <div style={{ fontSize: 12.5, color: "#E8B94A", fontWeight: 500, marginTop: 2 }}>
                    <span style={{
                      display: "inline-block",
                      width: 8, height: 8, borderRadius: 999,
                      background: "#E8B94A",
                      marginInlineEnd: 6,
                      animation: "kavPulse 1s ease-in-out infinite",
                    }} />
                    כותבים את הפרק, כ-20 שניות
                  </div>
                ) : err ? (
                  <div style={{ fontSize: 12.5, color: "#FF8888", fontWeight: 500, marginTop: 2 }}>{err}</div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "#9E9990", fontWeight: 300, marginTop: 2 }}>
                    עוד לא נכתב
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => requestBuild(n)}
                disabled={inFlight || !extractionId}
                style={{
                  flex: "0 0 auto",
                  padding: "0 16px",
                  minHeight: 40,
                  background: "transparent",
                  color: inFlight ? "#9E9990" : err ? "#FFB0B0" : "#E8B94A",
                  border: `1px solid ${inFlight ? "rgba(232,185,74,0.28)" : err ? "rgba(255,136,136,0.5)" : "rgba(232,185,74,0.55)"}`,
                  borderRadius: 999,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: inFlight ? "wait" : "pointer",
                }}
              >
                {inFlight ? "יוצר…" : err ? "לנסות שוב" : "לכתוב את הפרק"}
              </button>
            </div>
          );
        }

        // ── Built row (may or may not be filmed) ──────────────────────
        return (
          <details
            key={n}
            style={{
              background: "#141820",
              border: `1px solid ${filmed ? "rgba(127,191,142,0.28)" : "rgba(232,185,74,0.18)"}`,
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            <summary
              style={{
                listStyle: "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  background: filmed ? "rgba(127,191,142,0.15)" : "linear-gradient(160deg,#F6DFA0,#9E7C3A)",
                  color: filmed ? "#7FBF8E" : "#171204",
                  border: filmed ? "1px solid rgba(127,191,142,0.4)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  flex: "0 0 auto",
                }}
              >
                {filmed ? "✓" : n}
              </span>
              {(() => {
                const takes    = takesPerScript[n] ?? 0;
                const takesFull = takes >= takesCap;
                const blocked   = seasonFull || takesFull;
                const statusLabel = filmed
                  ? "צולם"
                  : seasonFull
                    ? `העונה מלאה (${seasonCap}/${seasonCap} פרקים) — מחקו פרק`
                    : takesFull
                      ? `הפרק הזה מלא (${takesCap}/${takesCap} טייקים) — מחקו טייק`
                      : "מוכן לצילום";
                const statusColor = filmed
                  ? "#7FBF8E"
                  : blocked
                    ? "#FF9F9F"
                    : "#E8B94A";
                return (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, color: "#EDE9E1", fontWeight: 700, lineHeight: 1.3 }}>
                        {s.title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: statusColor,
                          fontWeight: 700,
                          marginTop: 3,
                          letterSpacing: 0.2,
                        }}
                      >
                        {statusLabel}
                      </div>
                      {!blocked && takes > 0 && (
                        <div style={{ fontSize: 11, color: "#9E9990", fontWeight: 300, marginTop: 2, letterSpacing: 0.1 }}>
                          {takes}/{takesCap} טייקים בפרק
                        </div>
                      )}
                    </div>
                    {blocked ? (
                      <span
                        style={{
                          flex: "0 0 auto",
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0 16px",
                          minHeight: 40,
                          background: "rgba(255,159,159,0.08)",
                          color: "#9E9990",
                          border: "1px dashed rgba(255,159,159,0.35)",
                          borderRadius: 999,
                          fontSize: 12.5,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          cursor: "not-allowed",
                        }}
                      >
                        לא ניתן לצלם
                      </span>
                    ) : (
                      <a
                        href={`/hive/signal-kit/broadcast/${extractionId}/${n}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: "0 0 auto",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          ...(filmed
                            ? {
                                padding: "0 2px",
                                minHeight: 40,
                                background: "transparent",
                                color: "#9E9990",
                                border: "none",
                                borderRadius: 0,
                                fontSize: 12.5,
                                fontWeight: 700,
                                textDecoration: "underline",
                                textDecorationColor: "rgba(158,153,144,0.4)",
                                textUnderlineOffset: 3,
                              }
                            : {
                                padding: "0 20px",
                                minHeight: 44,
                                background: "linear-gradient(180deg,#F1D07E,#E2B34A,#CE9C38)",
                                color: "#171204",
                                border: "none",
                                borderRadius: 999,
                                fontSize: 14,
                                fontWeight: 800,
                                textDecoration: "none",
                                boxShadow: "0 6px 18px rgba(232,185,74,0.28)",
                              }),
                          fontFamily: "inherit",
                        }}
                      >
                        {filmed ? "טייק נוסף" : "לצלם עכשיו ←"}
                      </a>
                    )}
                  </>
                );
              })()}
            </summary>
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: "rgba(0,0,0,0.24)",
                border: "1px solid rgba(232,185,74,0.08)",
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 300,
                color: "#EDE9E1",
                lineHeight: 1.65,
              }}
            >
              <span style={{ color: "#E8B94A", fontWeight: 700 }}>{s.hook}</span>{" "}
              <span>{s.body}</span>
              {s.cta ? (
                <>
                  {" "}
                  <span style={{ color: "#E8B94A", fontWeight: 700 }}>{s.cta}</span>
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

// ─────────────────────────────────────────────────────────────────────
// SeasonsRoadmap — the /kaveret monthly-subscription is open-ended. Every
// month a new season generates: same signal, different angle. This strip
// makes that pipeline visible so a subscriber sees the shape of what's
// coming, not just the current season. Season definitions are canonical
// in lib/kaveret-seasons.ts. First season = live (current). One click on
// any card opens a Netflix-style detail row with "what" + "why" copy.
// ─────────────────────────────────────────────────────────────────────
function SeasonsRoadmap() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const seasons = KAVERET_SEASONS;
  const visible = showAll ? seasons : seasons.slice(0, 5);
  const openSeason = openIdx !== null ? seasons.find((s) => s.number === openIdx) ?? null : null;

  const statusLabel = (s: KaveretSeason["status"]): string =>
    s === "live" ? "העונה שלכם" : s === "next" ? "העונה הבאה" : s === "coming" ? "בקרוב" : "בהמשך";

  return (
    <div className={sty.roadWrap}>
      <div className={sty.roadHead}>
        <span className={sty.roadTitle}>מפת העונות של המנוי</span>
      </div>
      <p className={sty.roadIntro}>{KAVERET_SEASONS_INTRO}</p>
      <div className={sty.roadStrip}>
        {visible.map((s) => (
          <button
            key={s.number}
            type="button"
            onClick={() => setOpenIdx(openIdx === s.number ? null : s.number)}
            className={`${sty.roadCard} ${sty[s.status]}`}
            style={{ textAlign: "start", fontFamily: "inherit", cursor: "pointer" }}
          >
            <div className={sty.roadTop}>
              <span className={sty.roadNo}>עונה {String(s.number).padStart(2, "0")}</span>
              <span className={sty.roadPill}>{statusLabel(s.status)}</span>
            </div>
            <div className={sty.roadCardTitle}>{s.title}</div>
            <p className={sty.roadTag}>{s.tagline}</p>
            <div className={sty.roadMeta}>{s.episodes} פרקים</div>
          </button>
        ))}
      </div>
      {!showAll && seasons.length > visible.length ? (
        <button type="button" className={sty.roadExpand} onClick={() => setShowAll(true)}>
          עוד {seasons.length - visible.length} עונות ←
        </button>
      ) : null}
      {openSeason ? (
        <div className={sty.roadDetail}>
          <h4>עונה {openSeason.number} · {openSeason.title}</h4>
          <p>{openSeason.what}</p>
          <p className="why">{openSeason.why}</p>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// InterviewQuestionsCard — Hadar's canonical rule (HADAR_FUNNEL_FRAMEWORK
// 2026-07-11): a testimonial video's value doesn't come from the testimonial
// itself. It comes from the questions the customer asks their own clients —
// questions built so the answer voices the signal statement in the client's
// words. The engine emits these on V7 as `client_interview_questions`; this
// card renders them under the V7 script with a copy-all action so the
// customer can paste them into WhatsApp/email before booking a testimonial
// call.
// ─────────────────────────────────────────────────────────────────────
function InterviewQuestionsCard({ questions }: { questions: string[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    const text = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — do nothing */
    }
  }, [questions]);

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        background: "rgba(232,185,74,0.06)",
        border: "1px solid rgba(232,185,74,0.18)",
        borderRadius: 10,
        color: "#EDE9E1",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            color: "#E8B94A",
            fontSize: 11.5,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          שאלות לראיון עדות
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: "1px solid rgba(232,185,74,0.4)",
            color: "#E8B94A",
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {copied ? "הועתקו ✓" : "העתק הכל"}
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: "#9E9990", margin: "0 0 10px", lineHeight: 1.55 }}>
        השאלות האלה מכוונות את הלקוח שלך לומר בפיו את משפט האות. שאל אותן בראיון עדות לפני שאתה מקליט.
      </p>
      <ol style={{ margin: 0, paddingInlineStart: 20, fontSize: 14.5, lineHeight: 1.7 }}>
        {questions.map((q, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {q}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// KaveretChatLauncher + KaveretChat
// Post-purchase Q&A bot (Alon 2026-07-10 evening) — replaces the WhatsApp
// handoff at the bottom of /kaveret. Knowledge scope: all Hive components
// (signal / 7-day challenge / monthly live / visual / shoot day / broadcast
// room / monthly-season model). System prompt lives in lib/prompts/
// kaveret-chat.ts; API at /api/kaveret/chat. Ephemeral conversation — not
// persisted server-side, resets on modal close.
// ─────────────────────────────────────────────────────────────────────
type ChatMsg = { role: "user" | "assistant"; content: string };

function KaveretChatLauncher() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 40,
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 15,
          background: "linear-gradient(100deg, rgba(232,185,74,0.12), rgba(232,185,74,0.04))",
          border: "1px solid rgba(232,185,74,0.35)",
          borderRadius: 18,
          padding: 18,
          color: "#EDE9E1",
          fontFamily: "inherit",
          cursor: "pointer",
          textAlign: "right",
        }}
        aria-label="פתיחת שיחת עזרה"
      >
        <span
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            background: "linear-gradient(160deg,#F6DFA0,#9E7C3A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#171204",
            flex: "0 0 auto",
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16v10H8l-4 4z" />
            <path d="M8 10h8M8 13h5" />
          </svg>
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 800, display: "block" }}>שאלה על הכוורת שלך?</span>
          <span style={{ fontSize: 13, color: "#ACA79E", fontWeight: 300 }}>
            שאלו כל דבר, עונה תוך שניות
          </span>
        </span>
      </button>
      {open && <KaveretChat onClose={() => setOpen(false)} />}
    </>
  );
}

function KaveretChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft]       = useState("");
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setError(null);
    setDraft("");
    const nextMsgs: ChatMsg[] = [...messages, { role: "user", content: text }];
    setMessages(nextMsgs);
    setBusy(true);
    try {
      const r = await fetch("/api/kaveret/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: nextMsgs }),
      });
      const t = await r.text();
      const d = safeJson(t) as { role?: string; content?: string; error?: string } | null;
      if (!r.ok || !d?.content) {
        throw new Error(String(d?.error ?? `שגיאה (${r.status})`));
      }
      setMessages((prev) => [...prev, { role: "assistant", content: d.content! }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [draft, busy, messages]);

  const suggestions = [
    "איך עובד יום הצילום?",
    "מתי המפגש הלייב הבא?",
    "מה יש לי בטאב ויזואל?",
    "אחרי 7 הפרקים, מה קורה?",
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="שיחה על הכוורת"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,10,18,0.75)",
        zIndex: 9000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "88vh",
          background: "#0D1119",
          borderTop: "1px solid rgba(232,185,74,0.3)",
          borderRadius: "22px 22px 0 0",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 12px",
            borderBottom: "1px solid rgba(232,185,74,0.14)",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#EDE9E1" }}>שאלה על הכוורת</div>
            <div style={{ fontSize: 12, color: "#ACA79E", fontWeight: 300, marginTop: 2 }}>
              עונה תוך שניות, מבוסס על תכולת הכוורת שלכם
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "rgba(232,185,74,0.1)",
              border: "1px solid rgba(232,185,74,0.3)",
              color: "#E8B94A",
              cursor: "pointer",
              fontSize: 18,
              fontWeight: 800,
              fontFamily: "inherit",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.length === 0 && (
            <>
              <div
                style={{
                  padding: "14px 16px",
                  background: "rgba(232,185,74,0.06)",
                  border: "1px solid rgba(232,185,74,0.18)",
                  borderRadius: 14,
                  color: "#EDE9E1",
                  fontSize: 15,
                  lineHeight: 1.65,
                  fontWeight: 300,
                }}
              >
                שלום. אני יודע כל מה שיש בכוורת שלך. שאלו על האות, על אתגר 7 הימים, על המפגש החי החודשי, על יום הצילום או על הפרקים שלכם. אני עונה תוך שניות.
              </div>
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft(s)}
                    disabled={busy}
                    style={{
                      background: "transparent",
                      color: "#E8B94A",
                      border: "1px solid rgba(232,185,74,0.35)",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12.5,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-start" : "flex-end",
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius: 14,
                background: m.role === "user" ? "linear-gradient(180deg,#F6DFA0,#E2B34A)" : "#141820",
                border: m.role === "user" ? "none" : "1px solid rgba(232,185,74,0.16)",
                color: m.role === "user" ? "#171204" : "#EDE9E1",
                fontSize: 15,
                fontWeight: m.role === "user" ? 600 : 300,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {m.content}
            </div>
          ))}

          {busy && (
            <div
              style={{
                alignSelf: "flex-end",
                padding: "10px 14px",
                borderRadius: 14,
                background: "#141820",
                border: "1px solid rgba(232,185,74,0.16)",
                color: "#ACA79E",
                fontSize: 14,
                fontWeight: 300,
                fontStyle: "italic",
              }}
            >
              רגע…
            </div>
          )}

          {error && (
            <div
              style={{
                alignSelf: "center",
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(255,136,136,0.08)",
                border: "1px solid rgba(255,136,136,0.3)",
                color: "#FF8888",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          style={{
            padding: "12px 16px calc(14px + env(safe-area-inset-bottom))",
            borderTop: "1px solid rgba(232,185,74,0.14)",
            display: "flex",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="כתבו כאן שאלה…"
            rows={1}
            disabled={busy}
            dir="rtl"
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 140,
              padding: "10px 14px",
              background: "#141820",
              border: "1px solid rgba(232,185,74,0.25)",
              borderRadius: 14,
              color: "#EDE9E1",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 300,
              resize: "none",
              lineHeight: 1.5,
            }}
          />
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            style={{
              flex: "0 0 auto",
              height: 44,
              padding: "0 18px",
              background: "linear-gradient(180deg,#F6DFA0,#E2B34A)",
              border: "none",
              borderRadius: 999,
              color: "#171204",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 800,
              cursor: busy || draft.trim().length === 0 ? "not-allowed" : "pointer",
              opacity: busy || draft.trim().length === 0 ? 0.5 : 1,
            }}
          >
            שלח
          </button>
        </form>
      </div>
    </div>
  );
}
