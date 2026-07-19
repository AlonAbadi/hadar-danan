/**
 * FoundersSection — "מי עומד מאחורי" (Alon + Hadar), adapted from the Atelier
 * landing so the strategy page shows the partnership, not only Hadar. Passed as
 * ProductLandingPage's `whoSlot` on /strategy. Self-contained scoped CSS.
 */
export function FoundersSection() {
  return (
    <section className="fdr">
      <style>{FDR_CSS}</style>
      <div className="fdr-inner">
        <div className="fdr-eyebrow">מי עומד מאחורי</div>
        <h2 className="fdr-title">beegood = <span className="fdr-gd">אלון + הדר</span></h2>
        <p className="fdr-lead">לא חברה. שותפות. שני ראשים שחיים ונושמים את זה ביחד.</p>

        <div className="fdr-card">
          <div className="fdr-duo">
            <div className="fdr-person">
              <div className="fdr-photo">
                <img src="/alonimage.jpg" alt="אלון עבדי" />
              </div>
              <div className="fdr-name">אלון עבדי</div>
              <div className="fdr-role">Strategy · Architecture</div>
              <p className="fdr-desc">חד, אינטואיטיבי, יודע לאסוף נקודות ולחבר אותן לתמונה שלמה. רואה מה שעוד לא נאמר ומתרגם אותו למבנה שעובד. עשרות שנות ניסיון עסקי, אסטרטגי וטכנולוגי — בונה את העולם שמחזיק את החזון.</p>
            </div>
            <div className="fdr-person">
              <div className="fdr-photo fdr-photo-gold">
                <img src="/hadarprotrait.jpg" alt="הדר דנן" />
              </div>
              <div className="fdr-name">הדר דנן</div>
              <div className="fdr-role">Creative · Strategy</div>
              <p className="fdr-desc">חדה, אינטואיטיבית, יודעת לאסוף נקודות ולחבר אותן לתמונה שלמה. 70K עוקבים ו-3,500 עסקים שעברו דרכה יודעים: היא שומעת מה שלא אומרים, ומחזירה לך את מי שאתה בבהירות שלא היתה שם קודם. יוצרת שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal</span>.</p>
            </div>
          </div>
          <div className="fdr-together">
            <p>זה לא &ldquo;שני מוחות שחושבים אחרת&rdquo;. זה <span className="fdr-gd">שני מוחות שחושבים אותו דבר</span> — ובגלל זה זה מכפיל כוח מטורף. שנינו רואים את אותה תמונה, אוספים את אותן נקודות, מגיעים לאותה מסקנה — פשוט בעומק כפול. שנינו טובים עם אנשים. שנינו יודעים לשמוע. שנינו חדים. זה מה שהופך פגישה איתנו לפגישה שאחריה הכל בהיר.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const FDR_CSS = `
.fdr{padding:56px 20px;background:#080C14}
.fdr *{box-sizing:border-box}
.fdr-inner{max-width:760px;margin:0 auto;text-align:center}
.fdr-gd{color:#E8B94A}
.fdr-eyebrow{font-size:11px;letter-spacing:3px;font-weight:800;color:#C9964A;text-transform:uppercase;margin-bottom:14px}
.fdr-title{font-size:clamp(26px,6vw,36px);font-weight:800;color:#EDE9E1;margin:0 0 12px;line-height:1.2}
.fdr-lead{font-size:clamp(15.5px,2.4vw,18px);color:#AAB0BD;line-height:1.7;margin:0 auto 34px;max-width:40ch}
.fdr-card{border:1px solid #2C323E;background:linear-gradient(160deg,#141820,#0F131C);border-radius:24px;padding:40px 26px 34px}
.fdr-duo{display:grid;grid-template-columns:1fr;gap:44px}
.fdr-person{text-align:center}
.fdr-photo{width:150px;height:150px;border-radius:50%;overflow:hidden;margin:0 auto 18px;border:2px solid rgba(201,150,74,.4)}
.fdr-photo-gold{border:3px solid #C9964A;box-shadow:0 0 0 4px rgba(201,150,74,.12)}
.fdr-photo img{width:100%;height:100%;object-fit:cover;display:block}
.fdr-name{font-size:23px;font-weight:800;color:#EDE9E1;margin-bottom:8px}
.fdr-role{font-size:13px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#C9964A;margin-bottom:16px}
.fdr-desc{font-size:15.5px;line-height:1.72;color:#AAB0BD;margin:0 auto;max-width:44ch}
.fdr-together{margin-top:34px;padding-top:30px;border-top:1px solid #2C323E}
.fdr-together p{font-size:16px;line-height:1.75;color:#EDE9E1;margin:0}
.fdr-together .fdr-gd{font-weight:800}
@media(min-width:768px){
  .fdr-duo{grid-template-columns:1fr 1fr;gap:32px;align-items:start}
  .fdr-card{padding:44px 40px 38px}
}
`;
