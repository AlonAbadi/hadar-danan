// The English locked kaveret — the visitor state a lead lands on after the
// English reading, and the central sales surface for The Signal Hive. Mirrors
// the Hebrew visitor page zone for zone (minus the Hebrew-only challenge
// videos); the conversion layer swaps by routing:
//   hive      — open The Signal Hive, FREE first episode (launch model)
//   concierge — a working session with Hadar's team, quiet Hive exit
//   sensitive — no sale layer at all; warm "a human will reach out" + WhatsApp
// Open on the page: the signal board, the public card, the full reading with
// one of three content directions exposed, one designed asset slot, and the
// teleprompter demo loaded with the lead's actual first script hook.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import sty from "./kaveret-en.module.css";

export interface VisitorDataEn {
  firstName: string;
  signalText: string;
  element: string;
  promise: string;
  tool: string;
  people: string;
  directions: string[];
  publicSentence: string | null;
  firstScriptHook: string | null;
  extractionId: string;
  offer: "hive" | "concierge" | "sensitive";
  waPhone: string;
  token: string;
}

const LOCK = (
  <svg viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);


function LockBand({ text }: { text: string }) {
  return (
    <div className={sty.vLockBand}>
      <span className={sty.vLockIc}>{LOCK}</span>
      <span className={sty.vLockT}>{text}</span>
    </div>
  );
}

function ChipLock() {
  return <span className={sty.vChipLock}>{LOCK}Hive</span>;
}

export function KaveretVisitorClientEn({ data }: { data: VisitorDataEn }) {
  const sale = data.offer !== "sensitive";
  const [assetOk, setAssetOk] = useState(true);

  useEffect(() => {
    // presence beacon — one row per view, the unification's success metric
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [
            JSON.stringify({
              type: "KAVERET_LOCKED_VIEW",
              metadata: { offer: data.offer, extraction_id: data.extractionId, locale: "en" },
            }),
          ],
          { type: "application/json" }
        )
      );
    } catch {
      /* observability only */
    }
  }, [data.offer, data.extractionId]);

  // Pre-purchase artifacts carry the beegood branding, same asset routes as
  // the Hebrew page — they render the signal fields, which are English here.
  const assetUrl = `/api/signal/${data.extractionId}/asset?type=quote-signal&style=editorial&bg=color&v=11`;
  const shareCardUrl = `/api/signal/${data.extractionId}/share-card?style=editorial&bg=color&v=11`;
  const waHref = `https://wa.me/${data.waPhone}`;

  // FREE launch model (2026-07-13): nothing is sold in English. The CTA
  // activates the hive on the spot — the kaveret token in the URL is the
  // credential — and signs the lead straight into their member home.
  const [activating, setActivating] = useState(false);
  const [activateErr, setActivateErr] = useState<string | null>(null);
  const activateFree = async () => {
    if (activating) return;
    setActivating(true);
    setActivateErr(null);
    try {
      const token = new URLSearchParams(window.location.search).get("t");
      const res = await fetch("/api/en/hive/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { url } = await res.json();
      window.location.assign(url || "/en/login?next=/en/kaveret");
    } catch {
      setActivateErr("Something did not connect. Try again in a moment.");
      setActivating(false);
    }
  };

  return (
    <div className={sty.page} dir="ltr" lang="en">
      <div className={sty.bgfix} aria-hidden="true" />
      <div className={sty.glow} aria-hidden="true" />
      <main className={sty.wrap} style={{ paddingBottom: sale ? 120 : 60 }}>
        {/* ── EN chrome: minimal top bar ── */}
        <div className={sty.top}>
          <Link href="/en" className={sty.brand}>
            <Image
              src="/beegood_logo.png"
              alt="beegood"
              width={40}
              height={32}
              style={{ width: "auto", height: 32, display: "block" }}
            />
            beegood
          </Link>
          <span className={sty.who}>
            Saved for <b>you</b>
          </span>
        </div>

        {/* ── hero: the open signal ── */}
        <div className={sty.hero} id="top">
          <div className={sty.ghost} aria-hidden="true">
            THE HIVE
          </div>
          <div className={sty.k}>The Signal Hive · all of this already exists, made from your signal</div>
          <h1>
            <span className={sty.thin}>Your signal,</span>
            <br />
            <span className={sty.goldTxt}>ready to work.</span>
          </h1>
        </div>

        <div className={sty.board}>
          <span className={sty.seal}>Your signal board</span>
          <span className={sty.bigq} aria-hidden="true">
            &ldquo;
          </span>
          <div className={sty.txt} style={{ fontSize: 19, lineHeight: 1.7, fontWeight: 600 }}>
            {data.signalText}
          </div>
        </div>

        <p className={sty.vOwnLine}>This is your signal. It is yours for good - we saved it for you.</p>

        {/* ── public card (open, saveable) ── */}
        {data.publicSentence ? (
          <div className={sty.vCard}>
            <div className={sty.vCardFrame}>
              <span className={`${sty.vCorner} ${sty.vC1}`} />
              <span className={`${sty.vCorner} ${sty.vC2}`} />
              <span className={`${sty.vCorner} ${sty.vC3}`} />
              <span className={`${sty.vCorner} ${sty.vC4}`} />
              <div className={sty.vCardQ}>&ldquo;</div>
              <div className={sty.vCardTxt}>{data.publicSentence}</div>
              <div className={sty.vCardBee}>BEEGOOD · TRUESIGNAL</div>
            </div>
            <a className={sty.vSave} href={shareCardUrl} target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24">
                <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
              </svg>
              Save your signal card
            </a>
          </div>
        ) : null}

        {/* ── the full reading (open) ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zt}>
              <h2>The full reading</h2>
              <span className={sty.hint}>The depth of your signal. Also sent to your email</span>
            </span>
          </div>
          <div className={sty.zrule} />
          {[
            ["Your element", "Where you work with zero effort", data.element],
            ["What your signal promises", "The direction that opens here", data.promise],
            ["Your central tool", "The thing only you make", data.tool],
            ["Your audience", "Who this signal speaks to", data.people],
          ]
            .filter(([, , v]) => v)
            .map(([t, p, v]) => (
              <div className={sty.trow} key={t as string}>
                <div className={sty.head}>
                  <span className={sty.plat}>{t}</span>
                  <span className={sty.check}>{p}</span>
                </div>
                <p className={sty.body}>{v}</p>
              </div>
            ))}
          {data.directions.length ? (
            <div className={sty.trow}>
              <div className={sty.head}>
                <span className={sty.plat}>3 content directions from your signal</span>
                <span className={sty.check} style={{ color: "#7FD49B" }}>
                  the first is fully open
                </span>
              </div>
              <div className={sty.vScriptRow}>
                <span className={sty.vScriptN}>1</span>
                <span className={sty.vScriptT}>{data.directions[0]}</span>
              </div>
              {data.directions.length > 1 ? (
                <div className={sty.vLock}>
                  <div className={sty.vLockContent}>
                    {data.directions.slice(1, 3).map((d, i) => (
                      <div className={sty.vScriptRow} key={i}>
                        <span className={sty.vScriptN}>{i + 2}</span>
                        <span className={sty.vScriptT}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <LockBand
                    text={
                      data.offer === "concierge"
                        ? "Two more directions, part of the working session"
                        : sale
                          ? "Two more directions open inside the Hive"
                          : "Two more directions, saved for you here"
                    }
                  />
                </div>
              ) : null}
              {sale ? (
                <p className={sty.mutedNote}>
                  {data.offer === "concierge"
                    ? "In the working session these three directions become finished scripts and a complete plan."
                    : "Inside the Hive these three directions become finished scripts, loaded in your teleprompter."}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* ── visual: one real designed asset ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zn}>01</span>
            <span className={sty.zt}>
              <h2>Visual</h2>
              <span className={sty.hint}>Designed cards from your signal</span>
            </span>
            {sale ? <ChipLock /> : null}
          </div>
          <div className={sty.zrule} />
          <div className={sty.trow}>
            {assetOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={sty.vAssetImg}
                src={assetUrl}
                alt="Your designed signal card"
                onError={() => setAssetOk(false)}
              />
            ) : null}
            {sale ? (
              <div className={sty.vLock} style={{ marginTop: 14 }}>
                <div className={sty.vLockContent}>
                  <div className={sty.vMini}>
                    {[0, 1, 2].map((i) => (
                      <div className={sty.vMiniCard} key={i}>
                        <div className={sty.vMiniQ}>&ldquo;</div>
                        <div className={sty.vMiniB1} />
                        <div className={sty.vMiniB2} />
                      </div>
                    ))}
                  </div>
                </div>
                <LockBand
                  text={
                    data.offer === "concierge"
                      ? "Every format, from your signal. Part of the working session"
                      : "Every format, from your signal. Opens inside the Hive"
                  }
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* ── broadcast room: teleprompter demo with the real hook ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zn}>02</span>
            <span className={sty.zt}>
              <h2>Your filming day</h2>
              <span className={sty.hint}>The broadcast room, with your scripts inside</span>
            </span>
            {sale ? <ChipLock /> : null}
          </div>
          <div className={sty.zrule} />
          <div className={sty.trow}>
            <div className={sty.head}>
              <span className={sty.plat}>Your broadcast room</span>
              <span className={sty.check} style={{ color: "#7FD49B" }}>
                {data.firstScriptHook ? "7 episodes of yours · the first is already loaded" : "7 episodes of yours"}
              </span>
            </div>
            <div className={sty.vPhone}>
              <div className={sty.vPcam} />
              <div className={sty.vPstrip}>
                <div className={sty.vPtxt}>
                  {data.firstScriptHook ? (
                    <>
                      <em>{data.firstScriptHook.split(" ").slice(0, 4).join(" ")}</em>{" "}
                      {data.firstScriptHook.split(" ").slice(4).join(" ")}
                    </>
                  ) : (
                    <em>Your first script is being written right now</em>
                  )}
                </div>
              </div>
              <div className={sty.vPline} />
              <div className={sty.vPrec} />
            </div>
            <p className={sty.vPcap}>The teleprompter with your script, over the front camera</p>
            <p className={sty.centerNote}>
              Your first scripts already exist. Seven of them, in your voice. The text runs at your pace, the director
              cuts, burns in the captions and returns a reel. Filmed, not produced.
            </p>
          </div>
        </section>

        {/* ── conversion layer ── */}
        {data.offer === "hive" ? (
          <div className={sty.vUnlock}>
            <div className={sty.vUnlockK}>The Signal Hive</div>
            <h2>
              Everything here was already made from your signal.
              <br />
              All that is left is to open it.
            </h2>
            <p className={sty.vUnlockP}>
              Your signal system. Seven scripted episodes, filmed in the broadcast room with a teleprompter, captions
              burned in. Your social texts - bio, about, manifesto. Your designed visual assets. All of it personal,
              drawn from your answers.
            </p>
            <div className={sty.vPnote}>Your first episode is free. No card, no subscription.</div>
            <button className={sty.vGo} onClick={activateFree} disabled={activating} style={{ border: "none", cursor: "pointer" }}>
              {activating ? "Opening your hive..." : "Open the Hive - film your first episode free"}
            </button>
            {activateErr ? <div className={sty.vPnote} style={{ marginTop: 8 }}>{activateErr}</div> : null}
          </div>
        ) : null}

        {data.offer === "concierge" ? (
          <div className={sty.vUnlock}>
            <div className={sty.vUnlockK}>A working session</div>
            <h2>
              Your signal points at a business that is ready to move.
              <br />
              Now it needs a map.
            </h2>
            <p className={sty.vUnlockP}>
              A working session with Hadar&apos;s team, one on one. We start from your signal and build the map on top
              of it: the message, the offer, and the way to say it to the world. Everything you saw on this page is
              part of that work.
            </p>
            <button className={sty.vGo} onClick={activateFree} disabled={activating} style={{ border: "none", cursor: "pointer" }}>
              {activating ? "Opening your hive..." : "Open the Hive - film your first episode free"}
            </button>
            {activateErr ? <div className={sty.vPnote} style={{ marginTop: 8 }}>{activateErr}</div> : null}
            <div className={sty.vSec}>
              Prefer to talk it through first? <a href={waHref} target="_blank" rel="noopener">Message us on WhatsApp</a>
            </div>
          </div>
        ) : null}

        {data.offer === "sensitive" ? (
          <div className={sty.vWarm}>
            <h2>{data.firstName ? `${data.firstName}, ` : ""}your signal touched something real.</h2>
            <p className={sty.vWarmP}>
              This reading is saved for you here, and it is not going anywhere. A human from our team will go over it
              personally and reach out to you. And if you feel like talking now, we are here.
            </p>
            <a
              className={sty.vGo}
              href={waHref}
              target="_blank"
              rel="noopener"
              style={{ maxWidth: 320, margin: "20px auto 0" }}
            >
              Talk to us on WhatsApp
            </a>
          </div>
        ) : null}

        {/* ── EN chrome: minimal footer ── */}
        <footer className={sty.foot}>
          <div className={sty.footLinks}>
            <a href="/privacy">Privacy policy</a>
            <a href="/terms">Terms of use</a>
          </div>
          <p style={{ fontWeight: 600, marginTop: 6 }}>
            We do not create content. We build your signal. | TrueSignal©
          </p>
          <p>© 2026 Hadar Danan Ltd. All rights reserved.</p>
        </footer>
      </main>

      {/* sticky conversion bar */}
      {data.offer === "hive" || data.offer === "concierge" ? (
        <div className={sty.vSticky}>
          <div className={sty.vStickyIn}>
            <span className={sty.vStickyT}>
              <span className={sty.vStickyA}>The Signal Hive · your first episode is free</span>
              <span className={sty.vStickyB}>No card, no subscription</span>
            </span>
            <button className={sty.vStickyGo} onClick={activateFree} disabled={activating} style={{ border: "none", cursor: "pointer" }}>
              {activating ? "Opening..." : "Open"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
