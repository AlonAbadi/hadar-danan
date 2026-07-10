// כוורת האות — client render of the master mockup
// (design/kaveret/beegood-kaveret-haot-master.html). The DOM structure, class
// values and interaction logic are a one-to-one port; only the texts are the
// member's own. Do not restyle by hand — visual-check compares against the
// mockup at 1.5% tolerance.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import sty from "./kaveret.module.css";

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
  scripts: { number: number; title: string; hook: string; body: string; cta: string }[];
  extractionId: string | null;
  challengeDays: { day: number; title: string; videoId: string; portrait: boolean }[];
  completedDays: number[];
  challengeDone: boolean;
  liveMeeting: { label: string; zoomUrl: string | null } | null;
  filmedNumbers: number[];
  aboutSite: string;
  manifesto: string;
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
  const letterTo = data.demo || data.gender !== "m" ? "מהדר אלייך" : "מהדר אליך";

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

          <div className={sty.letterbox}>
            <div className={sty.from}>{letterTo}</div>
            <p>אם השיווק שלכם לא עובד היום, זה לא בגלל שאתם גרועים. זה כי אתם משחקים משחק שכבר לא מתקיים.</p>
            <p className={sty.em}>בואו נבנה לכם יום אחד שבו אתם משחקים משחק חדש.</p>
            <p className={sty.lsig}>הדר</p>
          </div>

          <div className={sty.trow}>
            <div className={sty.head}><span className={sty.plat}>משפט הזהות שלכם</span><span className={sty.check}>לפתיחת כל סרטון</span></div>
            <p className={`${sty.txt} ${sty.txtCopy}`} onClick={() => copyText(data.identity, "identity")}>{data.identity}</p>
            <div className={sty.tfoot}>{copyBtn("identity", data.identity)}</div>
          </div>

          {!data.demo ? (
            <div>
              <div className={sty.zhead} style={{ marginTop: 34 }}>
                <span className={sty.zt}>
                  <h2 style={{ fontSize: 19 }}>חבילת הסרטונים שלך</h2>
                  <span className={sty.hint}>{data.filmedCount} מתוך {data.scriptsTotal} צולמו</span>
                </span>
              </div>
              <div className={sty.trow}>
                {!data.scripts.length ? (
                  <>
                    <p className={sty.txt}>ערכת יום הצילום שלך עוד לא נבנתה. זה לוקח כמה דקות, ומחכה לך בערכה.</p>
                    <div className={sty.tfoot}>
                      <a className={`${sty.btnCopy} ${sty.btnCard}`} style={{ textDecoration: "none" }} href="/hive/signal-kit">
                        <span>לבנות את ערכת הצילום</span>
                      </a>
                    </div>
                  </>
                ) : (
                  <div>
                    {data.scripts.map((s2) => {
                      const filmed = data.filmedNumbers.includes(s2.number);
                      return (
                        <details key={s2.number} style={{ marginTop: 12 }}>
                          <summary
                            style={{ listStyle: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                          >
                            <p className={sty.txt} style={{ flex: 1 }}>
                              {filmed ? <span style={{ color: "#7FBF8E", fontWeight: 700 }}>✓ </span> : null}
                              {s2.number}. {s2.title}
                            </p>
                            <a
                              className={`${sty.btnCopy} ${filmed ? "" : sty.btnCard}`}
                              style={{
                                flex: "0 0 auto",
                                padding: "0 22px",
                                minHeight: 50,
                                textDecoration: "none",
                                boxShadow: filmed ? undefined : "0 8px 26px rgba(232,185,74,0.38)",
                              }}
                              href={`/hive/signal-kit/broadcast/${data.extractionId}/${s2.number}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>{filmed ? "טייק נוסף" : "לצלם עכשיו"}</span>
                            </a>
                          </summary>
                          <div style={{ padding: "10px 18px 6px 0", fontWeight: 300, fontSize: 16, lineHeight: 1.7 }}>
                            <span style={{ color: "#E8B94A", fontWeight: 700 }}>{s2.hook}</span>{" "}
                            <span>{s2.body}</span>
                            {s2.cta ? (
                              <>
                                {" "}
                                <span style={{ color: "#E8B94A", fontWeight: 700 }}>{s2.cta}</span>
                              </>
                            ) : null}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <section className={sty.zone} id="z-mine" data-tab-index={4} ref={(el) => { zonesRef.current[4] = el; }}>
          <div className={sty.zhead}>
            <span className={sty.zn}>04</span>
            <span className={sty.zt}><h2>התכנים שלי</h2><span className={sty.hint}>נגיעה בטקסט מעתיקה מיד</span></span>
          </div>
          <div className={sty.zrule} />

          {!data.demo && reels.length ? (
            <div>
              <div className={sty.zhead} style={{ marginTop: 34 }}>
                <span className={sty.zt}>
                  <h2 style={{ fontSize: 19 }}>הרילסים שלך</h2>
                  <span className={sty.hint}>מה שצילמת בחדר השידור</span>
                </span>
              </div>
              {reels.filter((r) => !deletedReels[r.editId]).map((r) => {
                const isPub = r.published || published[r.editId];
                return (
                  <div className={sty.trow} key={r.editId}>
                    <div className={sty.head}>
                      <span className={sty.plat}>
                        {r.videoNumber ? `רילס לתסריט ${r.videoNumber}` : "רילס"}
                      </span>
                      <span className={sty.check}>
                        {isPub ? <><span className={sty.v}>✓</span> פורסם</> : "ממתין לפרסום"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {r.thumbUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.thumbUrl}
                          alt=""
                          style={{ width: 48, height: 85, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(232,185,74,0.16)" }}
                        />
                      ) : null}
                      <span className={sty.txt} style={{ flex: 1 }}>
                        {new Date(r.createdAt).toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem" })}
                      </span>
                    </div>
                    <div className={sty.tfoot}>
                      {r.downloadUrl ? (
                        <a className={sty.btnCopy} href={r.downloadUrl} style={{ textDecoration: "none" }}>
                          <span>הורדה</span>
                        </a>
                      ) : null}
                      {!isPub && r.reviewItemId ? (
                        <button
                          type="button"
                          className={sty.btnCopy}
                          onClick={() => {
                            setPublished((prev) => ({ ...prev, [r.editId]: true }));
                            fetch(`/api/broadcast/review-items/${r.reviewItemId}/publish`, { method: "POST" }).catch(() => {});
                            toast("סומן כפורסם");
                          }}
                        >
                          <span>פורסם</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={sty.btnCopy}
                        style={{ opacity: 0.75 }}
                        onClick={async () => {
                          if (!window.confirm("למחוק את הרילס הזה לצמיתות? אי אפשר לשחזר אחרי מחיקה")) return;
                          const res = await fetch(`/api/broadcast/edits/${r.editId}`, { method: "DELETE" }).catch(() => null);
                          if (res?.ok) {
                            setDeletedReels((prev) => ({ ...prev, [r.editId]: true }));
                            toast("הרילס נמחק");
                          } else {
                            toast("המחיקה לא הצליחה, נסו שוב");
                          }
                        }}
                      >
                        <span>מחיקה</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {(() => {
            // outward texts come only from the content kit; show each once
            const seen = new Set<string>();
            const rows = ([
              ["ביו לאינסטגרם", data.bioInstagram, "bio"],
              ["כותרת ללינקדאין", data.linkedinHeadline, "li"],
              ["אודות לפייסבוק", data.facebookAbout, "fb"],
              ["אודות לאתר", data.aboutSite, "about"],
              ["מניפסט אישי", data.manifesto, "manifesto"],
            ] as const).filter(([, text]) => {
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
            return rows.map(([label, text, key]) => (
              <div className={sty.trow} key={key}>
                <div className={sty.head}><span className={sty.plat}>{label}</span><span className={sty.check}><span className={sty.v}>✓</span> באורך מדויק</span></div>
                <p className={`${sty.txt} ${sty.txtCopy}`} onClick={() => copyText(text, key)}>{text}</p>
                <div className={sty.tfoot}>{copyBtn(key, text)}</div>
              </div>
            ));
          })()}


          {data.demo ? (
            <>
              <div className={sty.zhead} style={{ marginTop: 34 }}>
                <span className={sty.zt}><h2 style={{ fontSize: 19 }}>חבילת הסרטונים שלך</h2><span className={sty.hint}>שבעה סרטונים במסגרת כוורת האות</span></span>
              </div>
              <div className={sty.trow}>
                <div className={sty.head}><span className={sty.plat}>חבילת כוורת האות</span><span className={sty.check}>{data.filmedCount} מתוך {data.scriptsTotal} הופקו</span></div>
                <p className={sty.txt}>שבעת התסריטים שלך, כל אחד עם כפתור לצלם עכשיו.</p>
              </div>
            </>
          ) : null}
        </section>

        <a className={sty.wa} href={`https://wa.me/${data.waPhone}`} target="_blank" rel="noopener">
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
    </div>
  );
}
