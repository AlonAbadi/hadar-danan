"use client";

import { useState, useEffect } from "react";

type ClientVideo = {
  id: string;
  title: string;
  durationSec: number;
  portrait: boolean;
  thumb: string;
};

const CLIENT_VIDEOS: ClientVideo[] = [
  { id: "1188794984", title: "חי סיני",                  durationSec: 57, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153525-777573a5f129e2ecea1e05fbf334c1ccbe937d959ac0d72f3a5036ea076ca655-d_640x360?&r=pad&region=us" },
  { id: "1188794936", title: "שלי ליטאי",                durationSec: 53, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153469-e3d1f9a5ba2e65cb2c4b116246fd505e0324e7844f77e3c4f4d46cce682a3373-d_640x360?&r=pad&region=us" },
  { id: "1188794898", title: "בית קפה ניקה",             durationSec: 52, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153412-32d9d01edd06b7a847d90d7a665f8c03b1fa2fc0ee590e3a9adce9ceb0327965-d_640x360?&r=pad&region=us" },
  { id: "1188794881", title: "דקל עמר",                  durationSec: 49, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153371-050f909f2f6180a0190848522e6e42c6d4fcb3fe58e3a65027689e986901aef0-d_640x360?&r=pad&region=us" },
  { id: "1188794835", title: "רבקה עמר",                 durationSec: 36, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153319-50e9c9c6e7d286873ad4c967c2878e0a4f659b1a62422fe2472f25bd73976379-d_640x360?&r=pad&region=us" },
  { id: "1188794804", title: "ורה שמעון",                durationSec: 56, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153289-940bc8ae58c263ab2e769c70ad2e14cef78aba99b6caeaf5ed69ff8b7a27d54c-d_640x360?&r=pad&region=us" },
  { id: "1188794766", title: "נטלי אוחיון",              durationSec: 46, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153264-4960c9613f0063f8d22e1678bd886c0388eb1e3a4afcb516abcb65dd12e46241-d_640x360?&r=pad&region=us" },
  { id: "1188794740", title: "מרים לוי",                 durationSec: 57, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153255-8624823663cfa52b06b01eaa6a8acc11e4d832213e2f402f3cbb15a7584a1758-d_640x360?&r=pad&region=us" },
  { id: "1188794715", title: "דנה כנר",                  durationSec: 43, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153169-8b7f1c73024bb8bc012ac85faafdeaf8a217f8fff6b250e04c093bfc97e3ca46-d_640x360?&r=pad&region=us" },
  { id: "1188794692", title: "הילה",                     durationSec: 33, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153143-da3e59b84131e0f7c87a19dff10c46862c7137979c28cecf02ca3f0a3f886ad8-d_640x360?&r=pad&region=us" },
  { id: "1188794633", title: "מיכה פול",                 durationSec: 58, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153126-eaf35b258a696943b7517a13291c44a517fcd49f9896b87fe17e30346863b20b-d_640x360?&r=pad&region=us" },
  { id: "1188794580", title: "דפנה טהור",                durationSec: 55, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153099-1fe4069a4b41823846e282a5fb287ca0886318a4a52292d706c5ac16faee605c-d_640x360?&r=pad&region=us" },
  { id: "1188794561", title: "נועה יצחק",                durationSec: 42, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153033-d6747bd8be0d4c87df5dfabaffd0ab654d68616d0e89d0538ebfd317ece9b496-d_640x360?&r=pad&region=us" },
  { id: "1188794548", title: "יהודה ספר",                durationSec: 41, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153010-d5b353f2269ec3ebe7743c861bfb28e98cfa1241f4a5bd78f367b63a39b25aa3-d_640x360?&r=pad&region=us" },
  { id: "1188794525", title: "צור יצחקי",                durationSec: 38, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152992-7873fe637cfd9cf9dcb76dda13f8e61066a2b4df5f341aab2c7052f1beb46414-d_640x360?&r=pad&region=us" },
  { id: "1188794489", title: "נוגטין",                   durationSec: 51, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152979-e653e171ab753c15da6a08736b8d865c65b8b55ee49af42fc8cb00010bfc5f13-d_640x360?&r=pad&region=us" },
  { id: "1188794464", title: "שיר",                      durationSec: 51, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152926-efe3f77a4f4eeb9ad064e65860d5c571d858e9e9ef007c34b3fa3ebf797c95fb-d_640x360?&r=pad&region=us" },
  { id: "1188794418", title: "אדם וגל",                  durationSec: 53, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152911-12074bb9db7161c8a60d9350f0fb036a92d7e9714285b305a82b408fd9b6a386-d_640x360?&r=pad&region=us" },
  { id: "1188794393", title: "קליניקות המעיין",          durationSec: 37, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152855-0a8adf944e8116519ce9017d4535a7928698ecec326b09a0ba2adc5273001448-d_640x360?&r=pad&region=us" },
  { id: "1188794366", title: "שירלי",                    durationSec: 66, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152844-69816e16d61e83260a5174315766e0ff294be19b9cad589a033d4475489a0f0c-d_640x360?&r=pad&region=us" },
  { id: "1188794355", title: "יוסי",                     durationSec: 49, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152817-fcf6ff378bffe612c059d412ce9374b9b2e77f0000100d9398145f66457f983e-d_640x360?&r=pad&region=us" },
  { id: "1188794312", title: "יפית סלע",                 durationSec: 34, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152776-d0ee4f4cb37571c92c6b61082ed074833270c87008d5727b61808caaed30e216-d_640x360?&r=pad&region=us" },
  { id: "1188794277", title: "פליקס",                    durationSec: 45, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152725-7e31fff09502d838c6695fbc26ac2ec552110a94dd8477007215af371284c457-d_640x360?&r=pad&region=us" },
  { id: "1188794258", title: "פליקס פרטוק — עו״ד",      durationSec: 38, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152698-5d3d5ee150afc2febb7917dafdb0de075b48cf409f95760e9a8a324feefd0af5-d_640x360?&r=pad&region=us" },
  { id: "1188794244", title: "חגית",                     durationSec: 45, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152669-6b2401624faf059092cb61b4a2954595b1a75b6ce6b6b35b6d1374630274a3cd-d_640x360?&r=pad&region=us" },
  { id: "1188794229", title: "סוזי גטניו",               durationSec: 59, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152658-212cd5b36ba40673f6f2440cc0211be790b6fa7f7c6f3df7cf975c83bec045c4-d_640x360?&r=pad&region=us" },
  { id: "1188794181", title: "מירה",                     durationSec: 45, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152590-f409911ab7ad2d5f2ce83b9f2c2bcbbbdfead17d123bbd90f61c6d0543c40e1e-d_640x360?&r=pad&region=us" },
  { id: "1188794142", title: "מיטל כהן",                 durationSec: 56, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152544-5426519003a96b5c8add4f1f4a864852bbd1c254e3ee285d6295c2f1ec0992dc-d_640x360?&r=pad&region=us" },
  { id: "1188794128", title: "אוריה",                    durationSec: 40, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152505-b549aa121e4b898c78deb0a1358cc5b6270c42a09597d09fe34fc1135f850712-d_640x360?&r=pad&region=us" },
  { id: "1188794091", title: "אינווסט גרופ",             durationSec: 62, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152462-f71e8ca112228c7f54e4b93ba21ac8a2281c7900ce05decae3e043812b1dfcc4-d_640x360?&r=pad&region=us" },
  { id: "1188791116", title: "חנות תיקים",               durationSec: 69, portrait: true, thumb: "https://i.vimeocdn.com/video/2153148692-5928e6f92f7d6347921d3d69f0ea79dc6207c4386499826b66793dba049a57e4-d_640x360?&r=pad&region=us" },
];

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ClientVideosCarousel() {
  const [playing, setPlaying] = useState<ClientVideo | null>(null);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlaying(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [playing]);

  return (
    <div className="cvc">
      <h2 className="cvc-title">השיטה בפעולה</h2>
      <p className="cvc-sub">סרטונים שהפקנו עבור לקוחות. סוף התהליך — האסטרטגיה הופכת לוידאו.</p>

      <div className="cvc-row">
        {CLIENT_VIDEOS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="cvc-card"
            onClick={() => setPlaying(v)}
            aria-label={`צפה בעדות של ${v.title}`}
          >
            <div className="cvc-poster">
              <img src={v.thumb} alt={v.title} loading="lazy" />
              <div className="cvc-grad" />
              <div className="cvc-dur">{fmtDur(v.durationSec)}</div>
              <p className="cvc-name">{v.title}</p>
            </div>
          </button>
        ))}
      </div>

      {playing && (
        <div className="cvc-modal" onClick={() => setPlaying(null)} role="dialog" aria-modal="true">
          <button
            type="button"
            className="cvc-close"
            onClick={(e) => { e.stopPropagation(); setPlaying(null); }}
            aria-label="סגור"
          >
            ✕
          </button>
          <div
            className="cvc-modal-inner"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: playing.portrait ? 400 : 800,
              aspectRatio: playing.portrait ? "9 / 16" : "16 / 9",
            }}
          >
            <iframe
              src={`https://player.vimeo.com/video/${playing.id}?autoplay=1&title=0&byline=0&portrait=0`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={playing.title}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .cvc { display: flex; flex-direction: column; gap: 14px; }
        .cvc-title {
          color: #EDE9E1;
          font-size: 22px;
          font-weight: 800;
          margin: 0;
          text-align: center;
          line-height: 1.3;
        }
        .cvc-sub {
          margin: 0;
          font-size: 13px;
          color: #9E9990;
          text-align: center;
        }

        .cvc-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 4px 4px 8px;
          margin: 0 -16px;
          padding-left: 16px;
          padding-right: 16px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .cvc-row::-webkit-scrollbar { display: none; }

        @media (min-width: 768px) {
          .cvc-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            overflow: visible;
            margin: 0;
            padding: 0;
          }
        }
        @media (min-width: 1100px) {
          .cvc-row {
            grid-template-columns: repeat(5, 1fr);
          }
        }

        .cvc-card {
          flex-shrink: 0;
          width: 140px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          scroll-snap-align: start;
          transition: transform 0.2s;
        }
        .cvc-card:hover { transform: translateY(-2px); }

        @media (min-width: 768px) {
          .cvc-card { width: auto; }
        }

        .cvc-poster {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: 8px;
          overflow: hidden;
          background: #1D2430;
          border: 1px solid rgba(201, 150, 74, 0.12);
        }
        .cvc-card:hover .cvc-poster {
          border-color: rgba(201, 150, 74, 0.4);
        }
        .cvc-poster img {
          width: 100%; height: 100%;
          object-fit: cover; object-position: center;
          display: block;
        }
        .cvc-grad {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 65%;
          background: linear-gradient(to top, rgba(8,12,20,0.97) 0%, rgba(8,12,20,0.4) 55%, transparent 100%);
          pointer-events: none;
        }
        .cvc-dur {
          position: absolute;
          top: 6px; left: 6px;
          background: rgba(0,0,0,0.72);
          color: #EDE9E1;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          backdrop-filter: blur(4px);
        }
        .cvc-name {
          position: absolute;
          bottom: 8px; left: 8px; right: 8px;
          color: #EDE9E1;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-align: right;
        }

        /* Modal */
        .cvc-modal {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.93);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(8px);
        }
        .cvc-close {
          position: absolute;
          top: 16px; right: 16px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          width: 40px; height: 40px;
          color: #fff; font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 201;
        }
        .cvc-modal-inner {
          position: relative;
          width: 100%;
          max-height: 92dvh;
        }
        .cvc-modal-inner iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
