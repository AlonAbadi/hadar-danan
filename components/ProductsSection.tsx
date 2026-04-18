export function ProductsSection({ excludeTraining = false }: { excludeTraining?: boolean }) {
  const overlay = "linear-gradient(to top, rgba(10,14,24,1) 0%, rgba(10,14,24,0.9) 18%, rgba(10,14,24,0.55) 35%, rgba(10,14,24,0.15) 55%, transparent 70%)";

  const nameStyle: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: "#EDE9E1", marginBottom: 6 };
  const priceStyle: React.CSSProperties = { fontSize: 19, fontWeight: 800, color: "#C9964A", marginBottom: 2 };
  const descStyle: React.CSSProperties = { fontSize: 14, color: "rgba(237,233,225,0.8)", lineHeight: 1.6, marginBottom: 14 };
  const ctaStyle: React.CSSProperties = { display: "inline-block", padding: "10px 24px", borderRadius: 9999, fontSize: 14, fontWeight: 700, border: "1px solid rgba(201,150,74,0.55)", color: "#EDE9E1" };

  return (
    <section id="products" style={{ background: "#080C14" }}>
      <div style={{ color: "#EDE9E1" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", padding: "80px 40px 56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,150,74,0.1)", border: "1px solid rgba(201,150,74,0.28)", borderRadius: 9999, padding: "5px 16px", marginBottom: 20 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A" }} />
            <span style={{ color: "#C9964A", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600 }}>הדרך</span>
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 10 }}>
            <span style={{ color: "#EDE9E1" }}>כל אחד נמצא</span><br />
            <span className="text-gradient-gold">במקום אחר</span>
          </h2>
          <p style={{ color: "#9E9990", fontSize: "0.95rem" }}>
            כשהאות שלך ברור - הלקוחות הנכונים מגיעים מאליהם
          </p>
        </div>

        {/* ── Ladder ── */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px", position: "relative" }}>
          {/* Vertical gold line */}
          <div style={{ position: "absolute", right: "calc(50% + 28px)", top: 0, bottom: 0, width: 1, background: "linear-gradient(to bottom, transparent, rgba(201,150,74,0.18) 10%, rgba(201,150,74,0.18) 90%, transparent)", pointerEvents: "none" }} />

          {/* ── Step 1 - card RIGHT ── */}
          {!excludeTraining && (
            <>
              <div className="nf-row">
                <div className="nf-empty" />
                <div className="nf-node nf-node-gold">1</div>
                <a href="/training" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
                  <img src="/hadarlesson.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }} />
                  <div style={{ position: "absolute", inset: 0, background: overlay }} />
                  <div style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 4, padding: "2px 8px", zIndex: 2 }}>מתחילים כאן</div>
                  <div style={{ position: "absolute", left: 8, top: 8, fontSize: "5rem", fontWeight: 800, color: "rgba(255,255,255,0.22)", lineHeight: 1, userSelect: "none" }}>1</div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                    <div style={priceStyle}>חינם</div>
                    <div style={nameStyle}>הדרכה חינמית</div>
                    <p style={descStyle}>הבן למה השיווק שלך לא עובד - לפני שאתה משקיע שקל אחד</p>
                    <span style={ctaStyle}>התחל כאן ←</span>
                  </div>
                </a>
              </div>
              {/* Connector */}
              <div className="nf-connector"><div /><div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: 1, height: 40, background: "rgba(201,150,74,0.18)" }} /></div><div /></div>
            </>
          )}

          {/* ── Step 2 - card LEFT ── */}
          <div className="nf-row">
            <a href="/challenge" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
              <img src="/etgar.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "35% 10%" }} />
              <div style={{ position: "absolute", inset: 0, background: overlay }} />
              <div style={{ position: "absolute", left: 8, top: 8, fontSize: "5rem", fontWeight: 800, color: "rgba(255,255,255,0.22)", lineHeight: 1, userSelect: "none" }}>2</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={priceStyle}>₪197</div>
                <div style={nameStyle}>אתגר 7 ימים</div>
                <p style={descStyle}>7 ימים, 7 סרטונים - צא לדרך ותתחיל לייצר תוכן שמביא לקוחות</p>
                <span style={ctaStyle}>להתחיל ←</span>
              </div>
            </a>
            <div className="nf-node">2</div>
            <div className="nf-empty" />
          </div>

          {/* Connector */}
          <div className="nf-connector"><div /><div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: 1, height: 40, background: "rgba(201,150,74,0.18)" }} /></div><div /></div>

          {/* ── Step 3 - card RIGHT ── */}
          <div className="nf-row">
            <div className="nf-empty" />
            <div className="nf-node">3</div>
            <a href="/workshop" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
              <img src="/sadna.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 8%" }} />
              <div style={{ position: "absolute", inset: 0, background: overlay }} />
              <div style={{ position: "absolute", left: 8, top: 8, fontSize: "5rem", fontWeight: 800, color: "rgba(255,255,255,0.22)", lineHeight: 1, userSelect: "none" }}>3</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={priceStyle}>₪1,080</div>
                <div style={nameStyle}>סדנה יום אחד</div>
                <p style={descStyle}>מייצר תוכן אבל לא רואה תוצאות? יום אחד שמשנה גישה</p>
                <span style={ctaStyle}>קבע יום ←</span>
              </div>
            </a>
          </div>

          {/* Connector */}
          <div className="nf-connector"><div /><div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: 1, height: 40, background: "rgba(201,150,74,0.18)" }} /></div><div /></div>

          {/* ── Step 4 - card LEFT ── */}
          <div className="nf-row">
            <a href="/course" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
              <img src="/coursehadar.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "25% 5%" }} />
              <div style={{ position: "absolute", inset: 0, background: overlay }} />
              <div style={{ position: "absolute", left: 8, top: 8, fontSize: "5rem", fontWeight: 800, color: "rgba(255,255,255,0.22)", lineHeight: 1, userSelect: "none" }}>4</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={priceStyle}>₪1,800</div>
                <div style={nameStyle}>קורס דיגיטלי</div>
                <p style={descStyle}>השיטה המלאה - לא רק לצלם, אלא להבין את ה־Signal שלך</p>
                <span style={ctaStyle}>לקורס ←</span>
              </div>
            </a>
            <div className="nf-node">4</div>
            <div className="nf-empty" />
          </div>

          {/* Connector */}
          <div className="nf-connector"><div /><div style={{ display: "flex", justifyContent: "center" }}><div style={{ width: 1, height: 40, background: "rgba(201,150,74,0.18)" }} /></div><div /></div>

          {/* ── Step 5 - card RIGHT, gold node ── */}
          <div className="nf-row">
            <div className="nf-empty" />
            <div className="nf-node nf-node-gold">5</div>
            <a href="/strategy" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
              <img src="/strategymeeting.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 8%" }} />
              <div style={{ position: "absolute", inset: 0, background: overlay }} />
              <div style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, color: "#1A1206", background: "linear-gradient(135deg,#E8B94A,#C9964A)", borderRadius: 4, padding: "2px 8px", zIndex: 2 }}>מומלץ</div>
              <div style={{ position: "absolute", left: 8, top: 8, fontSize: "5rem", fontWeight: 800, color: "rgba(255,255,255,0.22)", lineHeight: 1, userSelect: "none" }}>5</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={priceStyle}>₪4,000</div>
                <div style={nameStyle}>פגישת אסטרטגיה</div>
                <p style={descStyle}>90 דקות עם הדר - בנה אסטרטגיה מדויקת לעסק שלך</p>
                <span style={{ display: "inline-block", padding: "10px 24px", borderRadius: 9999, fontSize: 14, fontWeight: 700, background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)", color: "#1A1206", border: "none" }}>קבע פגישה ←</span>
              </div>
            </a>
          </div>
        </div>

        {/* ── Premium divider ── */}
        <div style={{ maxWidth: 780, margin: "48px auto 8px", padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.25)" }} />
          <span style={{ fontSize: 24, letterSpacing: "0.06em", fontWeight: 800, color: "#EDE9E1" }}>פרימיום</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.25)" }} />
        </div>

        {/* ── Premium grid ── */}
        <div className="nf-premium-grid" style={{ maxWidth: 960, margin: "16px auto", padding: "0 24px" }}>
          <a href="/premium" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
            <img src="/shooting.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "15% 5%" }} />
            <div style={{ position: "absolute", inset: 0, background: overlay }} />
            <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.08em", zIndex: 2 }}>PREMIUM</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
              <div style={priceStyle}>₪14,000 <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(237,233,225,0.5)" }}>+ מע״מ</span></div>
              <div style={nameStyle}>יום צילום פרמיום</div>
              <p style={descStyle}>אסטרטגיה + הפקה + עריכה - 16 סרטונים</p>
              <span style={ctaStyle}>לפרטים ←</span>
            </div>
          </a>
          <a href="/partnership" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
            <img src="/partnership.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "75% 5%" }} />
            <div style={{ position: "absolute", inset: 0, background: overlay }} />
            <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.08em", zIndex: 2 }}>PREMIUM</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
              <div style={priceStyle}>₪10k-30k <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(237,233,225,0.5)" }}>/ חודש</span></div>
              <div style={nameStyle}>שותפות אסטרטגית</div>
              <p style={descStyle}>למשפיעניות וחברות שרוצות שותף לדרך</p>
              <span style={ctaStyle}>בדוק התאמה ←</span>
            </div>
          </a>
          <a href="/atelier" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(145deg, #1A1E2C 0%, #0D1018 50%, #101520 100%)" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(201,150,74,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.08em", zIndex: 2 }}>ATELIER</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
              <div style={{ ...priceStyle, fontSize: 15 }}>בהתאמה אישית</div>
              <div style={nameStyle}>beegood atelier</div>
              <p style={descStyle}>למשפיעניות שרוצות להפוך למנהיגות תרבותיות - עולם שלם תחת הדומיין שלך</p>
              <span style={{ ...ctaStyle, borderColor: "rgba(201,150,74,0.45)" }}>לבדיקת התאמה ←</span>
            </div>
          </a>
        </div>

        {/* ── Hive divider ── */}
        <div style={{ maxWidth: 780, margin: "32px auto 8px", padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.25)" }} />
          <span style={{ fontSize: 24, letterSpacing: "0.06em", fontWeight: 800, color: "#EDE9E1" }}>קהילה</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.25)" }} />
        </div>

        {/* ── Hive card ── */}
        <div style={{ maxWidth: 500, margin: "16px auto 80px", padding: "0 24px" }}>
          <a href="/hive" className="nf-card" style={{ position: "relative", height: "420px", overflow: "hidden", display: "block" }}>
            <img src="/hive.jpg" loading="lazy" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "40% 10%" }} />
            <div style={{ position: "absolute", inset: 0, background: overlay }} />
            <div style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 700, color: "#1A1206", background: "linear-gradient(135deg,#E8B94A,#C9964A)", borderRadius: 4, padding: "2px 8px", zIndex: 2 }}>פופולרי</div>
            <div style={{ position: "absolute", bottom: 80, right: 16, fontSize: "2.4rem", zIndex: 2 }}>🐝</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, display: "flex", alignItems: "center", gap: 16, textAlign: "right" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#EDE9E1", marginBottom: 4 }}>הכוורת</div>
                <p style={{ fontSize: 14, color: "rgba(237,233,225,0.8)", lineHeight: 1.5 }}>קהילה חודשית של בעלי עסקים בוני Signal - לקוחות הדר ₪29 בלבד</p>
              </div>
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#C9964A", lineHeight: 1 }}>₪29-97</div>
                <div style={{ fontSize: 12, color: "rgba(237,233,225,0.5)", marginBottom: 10 }}>לחודש</div>
                <span style={{ display: "inline-block", background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)", color: "#1A1206", fontWeight: 700, borderRadius: 9999, padding: "10px 24px", fontSize: 14 }}>הצטרף ←</span>
              </div>
            </div>
          </a>
        </div>

      </div>

      <style>{`
        .nf-row {
          display: grid;
          grid-template-columns: 1fr 56px 1fr;
          align-items: center;
        }
        .nf-connector {
          display: grid;
          grid-template-columns: 1fr 56px 1fr;
          height: 56px;
        }
        .nf-node {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 1px solid rgba(201,150,74,0.35);
          background: #0D1320;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #C9964A;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
          margin: 0 auto;
        }
        .nf-node-gold {
          background: linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A);
          color: #1A1206;
          border: none;
        }
        .nf-empty {}
        .nf-card {
          display: block;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #1C2638;
          background: #0F1828;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .nf-card:hover {
          border-color: rgba(201,150,74,0.4);
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
        }
        .nf-premium-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media (max-width: 768px) {
          .nf-row {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          .nf-row .nf-empty { display: none; }
          .nf-row .nf-node { order: -1; }
          .nf-row .nf-card { width: 100%; }
          .nf-connector {
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .nf-connector > div:first-child,
          .nf-connector > div:last-child { display: none; }
          .nf-premium-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
