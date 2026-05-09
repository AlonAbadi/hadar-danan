"use client";

import { useState } from "react";
import { WorkshopTestimonials } from "@/app/workshop/WorkshopTestimonials";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "הכל" | "הדר" | "לקוחות";
const CATEGORIES: Category[] = ["הכל", "הדר", "לקוחות"];

interface Video {
  id: string;
  title: string;
  durationSec: number;
  thumb: string;
  portrait: boolean;
}

function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `0:${sec.toString().padStart(2, "0")}`;
  if (sec === 0) return `${m} דק׳`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURED = {
  id: "1188793450",
  title: "תהליך שלם מהסדנה",
  subtitle: "צפו בתהליך TrueSignal© מלא — מאבחון ועד פריצת דרך",
  durationSec: 368,
  portrait: false,
  thumb: "https://i.vimeocdn.com/video/2153151822-24b35215f9175167f236d3fa86ab2fcd09dfde24c2deacb309b1193d407c603d-d_1280x720?&r=pad&region=us",
};

const HADAR_REELS: Video[] = [
  { id: "1188793607", title: "אין נאהב את המותג",               durationSec: 74,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153151890-8e7a70d2ddab4ee1e253e06a69db11e3c8575e13cfb18ee1b2d6631e4f29815d-d_640x360?&r=pad&region=us" },
  { id: "1188790814", title: "תהליך מוכרת מיטות",              durationSec: 74,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153148315-1a053bf671a4af54ec57a9a43271b6db0acdcae7066c0564da52f081c77544f0-d_640x360?&r=pad&region=us" },
  { id: "1188790367", title: "התדר של האגו",                    durationSec: 87,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153147710-6fe1753b3439622ea3d24b037d1bb5e0ebc718eac24b56464a0551af09372d23-d_640x360?&r=pad&region=us" },
  { id: "1188790186", title: "לא מפיקת אירועים",               durationSec: 65,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153147413-d6c9f3ca8f779b9327b70f83214a4843db3f8f958ba83c286aa988798a296d15-d_640x360?&r=pad&region=us" },
  { id: "1188790078", title: "להיות בתדר שלנו",                durationSec: 55,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153147265-f55fed977870f9f4cd24c74bb5da53709dc85b60678174a41b32cbb958f254ce-d_640x360?&r=pad&region=us" },
  { id: "1188789980", title: "הצ׳אט לוקח לנו את המחשבה",      durationSec: 92,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153147134-3ece3f11a343ae4dafde9c3e009526191126951b2ca58024164bcf9049372bd1-d_640x360?&r=pad&region=us" },
  { id: "1188789911", title: "כריך AI",                         durationSec: 85,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153147046-19c930c4a3942450042b80cbbe6337905c5cdf6958b9d1285e3e0ffee8a12832-d_640x360?&r=pad&region=us" },
  { id: "1188788600", title: "התכנים שאנחנו לא יכולים לראות", durationSec: 63,  portrait: true, thumb: "https://i.vimeocdn.com/video/2153145232-76acf8349b566d6924554e99c9432e937b3f599a344e45914129b749163be7d5-d_640x360?&r=pad&region=us" },
];

const HADAR_LONG: Video[] = [
  { id: "1188789280", title: "תהליך אדיר",              durationSec: 394, portrait: true, thumb: "https://i.vimeocdn.com/video/2153146213-f1ac7afefba99927c3d8e3214c5f5b77835a3bf5c0433b6c4818e5a364133d55-d_640x360?&r=pad&region=us" },
  { id: "1188791176", title: "למה את הולכת עם אסוף",   durationSec: 324, portrait: true, thumb: "https://i.vimeocdn.com/video/2153148874-af851a6324eaf28888a44e6920a90439b6231f551cc6e36a5522e8c2bfb2519d-d_640x360?&r=pad&region=us" },
  { id: "1188790254", title: "תהליך בחורה בסלון",       durationSec: 296, portrait: true, thumb: "https://i.vimeocdn.com/video/2153147567-42495f072446ab593873c8b185e949cc1daaee72c530d2f53ba043da9808a128-d_640x360?&r=pad&region=us" },
  { id: "1188788656", title: "זה הסטורי",               durationSec: 294, portrait: true, thumb: "https://i.vimeocdn.com/video/2153145437-c50ab20e4ac8d28cbf929267bf250d9a2df1c1043f8d1a015a8e35bff2caa575-d_640x360?&r=pad&region=us" },
  { id: "1188793244", title: "תהליך יהודית",            durationSec: 276, portrait: true, thumb: "https://i.vimeocdn.com/video/2153151563-c2f159c01af7c825d5d70293358772b5b88a356209e04ba990338113a4cd6c81-d_640x360?&r=pad&region=us" },
  { id: "1188792815", title: "תהליך מתן",               durationSec: 266, portrait: true, thumb: "https://i.vimeocdn.com/video/2153151007-336653698f4c94157cbc52375805fb69fcf8caffa59785cccfa399b6095a0032-d_640x360?&r=pad&region=us" },
  { id: "1188791247", title: "תהליך מאלף כלבים",        durationSec: 243, portrait: true, thumb: "https://i.vimeocdn.com/video/2153149003-a1528ac694931923a3ef8452b75fb39bc86cdcd0ab506540b9cdb4463e7aa10a-d_640x360?&r=pad&region=us" },
  { id: "1188790119", title: "הבוס החליט בשבילך",       durationSec: 188, portrait: true, thumb: "https://i.vimeocdn.com/video/2153147369-75e6624fe7fc483857639a0b14b6ce01e36044c0885a3758921e0dcd4887ec37-d_640x360?&r=pad&region=us" },
  { id: "1188793143", title: "סוכנת נסיעות",            durationSec: 178, portrait: true, thumb: "https://i.vimeocdn.com/video/2153151420-d2b2a623656b300b2eacf6538092c583cf5195dcf46358494ecf5a3d3aa3f694-d_640x360?&r=pad&region=us" },
];

const CLIENT_VIDEOS: Video[] = [
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
  { id: "1188794332", title: "יוסי — גרסה ב׳",          durationSec: 46, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152804-d935dbeeef5718ea185d704e7330a22d85d5635d4f43c3180bc802822a9c4855-d_640x360?&r=pad&region=us" },
  { id: "1188794312", title: "יפית סלע",                 durationSec: 34, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152776-d0ee4f4cb37571c92c6b61082ed074833270c87008d5727b61808caaed30e216-d_640x360?&r=pad&region=us" },
  { id: "1188794277", title: "פליקס",                    durationSec: 45, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152725-7e31fff09502d838c6695fbc26ac2ec552110a94dd8477007215af371284c457-d_640x360?&r=pad&region=us" },
  { id: "1188794258", title: "פליקס פרטוק — עו״ד",      durationSec: 38, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152698-5d3d5ee150afc2febb7917dafdb0de075b48cf409f95760e9a8a324feefd0af5-d_640x360?&r=pad&region=us" },
  { id: "1188794244", title: "חגית",                     durationSec: 45, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152669-6b2401624faf059092cb61b4a2954595b1a75b6ce6b6b35b6d1374630274a3cd-d_640x360?&r=pad&region=us" },
  { id: "1188794229", title: "סוזי גטניו",               durationSec: 59, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152658-212cd5b36ba40673f6f2440cc0211be790b6fa7f7c6f3df7cf975c83bec045c4-d_640x360?&r=pad&region=us" },
  { id: "1188794203", title: "סוזי גטניו — גרסה ב׳",    durationSec: 55, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152626-cdaff77ee9935c3965538476c4b2bd344cecc5fe7f9c505731ce426abf98bb23-d_640x360?&r=pad&region=us" },
  { id: "1188794181", title: "מירה",                     durationSec: 45, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152590-f409911ab7ad2d5f2ce83b9f2c2bcbbbdfead17d123bbd90f61c6d0543c40e1e-d_640x360?&r=pad&region=us" },
  { id: "1188794142", title: "מיטל כהן",                 durationSec: 56, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152544-5426519003a96b5c8add4f1f4a864852bbd1c254e3ee285d6295c2f1ec0992dc-d_640x360?&r=pad&region=us" },
  { id: "1188794128", title: "אוריה",                    durationSec: 40, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152505-b549aa121e4b898c78deb0a1358cc5b6270c42a09597d09fe34fc1135f850712-d_640x360?&r=pad&region=us" },
  { id: "1188794115", title: "אוריה — גרסה ב׳",         durationSec: 41, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152476-d183c1d74a25e14307917811b82974ad67ac3a589a5cb706000735bc8f7ec09d-d_640x360?&r=pad&region=us" },
  { id: "1188794091", title: "אינווסט גרופ",             durationSec: 62, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152462-f71e8ca112228c7f54e4b93ba21ac8a2281c7900ce05decae3e043812b1dfcc4-d_640x360?&r=pad&region=us" },
  { id: "1188793987", title: "רילס עם מוזיקה",           durationSec: 95, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152333-3677dc1d42193489faf965b3fd7d96dd7de10901b9351bc3db4c32d4c7cd203f-d_640x360?&r=pad&region=us" },
  { id: "1188791116", title: "חנות תיקים",               durationSec: 69, portrait: true, thumb: "https://i.vimeocdn.com/video/2153148692-5928e6f92f7d6347921d3d69f0ea79dc6207c4386499826b66793dba049a57e4-d_640x360?&r=pad&region=us" },
  { id: "1188795017", title: "רילס — אטלייה",            durationSec: 72, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153571-9313f5583963a0cf76b4da32ec89156250dbf12e93ab50132beb7b8f83057447-d_640x360?&r=pad&region=us" },
  { id: "1188794857", title: "דקל עמר — גרסה ב׳",       durationSec: 50, portrait: true, thumb: "https://i.vimeocdn.com/video/2153153345-7b5c557aacea3a3e95e595fef975e4deb269b36d8007b3c611b08d5b021dd1c1-d_640x360?&r=pad&region=us" },
  { id: "1188794294", title: "יפית סלע — גרסה ב׳",      durationSec: 25, portrait: true, thumb: "https://i.vimeocdn.com/video/2153152760-ad0f8c057e3b4953bb2af51dbddc88cce045bb9de82ddb8a8403de8a0961764d-d_640x360?&r=pad&region=us" },
];

// ─── VimeoModal ──────────────────────────────────────────────────────────────

interface ModalVideo { id: string; portrait: boolean; title: string }

function VimeoModal({ video, onClose }: { video: ModalVideo; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.93)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <button
        onClick={onClose}
        aria-label="סגור"
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "50%",
          width: 40, height: 40,
          color: "#fff", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 201,
        }}
      >
        ✕
      </button>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: video.portrait ? 400 : 800,
          maxHeight: "92dvh",
          aspectRatio: video.portrait ? "9/16" : "16/9",
        }}
      >
        <iframe
          src={`https://player.vimeo.com/video/${video.id}?autoplay=1&loop=0&title=0&byline=0&portrait=0`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: 10 }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

// ─── PosterCard ──────────────────────────────────────────────────────────────

function PosterCard({ video, onPlay }: { video: Video; onPlay: (v: ModalVideo) => void }) {
  return (
    <div
      className="flex-shrink-0 w-40 lg:w-auto cursor-pointer"
      onClick={() => onPlay({ id: video.id, portrait: video.portrait, title: video.title })}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        aspectRatio: "2/3",
        background: "#1D2430",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumb}
          alt={video.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "65%",
          background: "linear-gradient(to top, rgba(8,12,20,0.97) 0%, rgba(8,12,20,0.4) 55%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {/* Play button */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0,
          transition: "opacity 150ms",
          background: "rgba(0,0,0,0.25)",
        }}
          className="group-hover-play"
        />
        {/* Duration badge */}
        <div style={{
          position: "absolute", top: 7, left: 7,
          background: "rgba(0,0,0,0.72)",
          color: "#EDE9E1", fontSize: 10, fontWeight: 600,
          padding: "2px 6px", borderRadius: 4,
          backdropFilter: "blur(4px)",
        }}>
          {fmtDur(video.durationSec)}
        </div>
        {/* Title overlay */}
        <p style={{
          position: "absolute", bottom: 8, left: 8, right: 8,
          color: "#EDE9E1", fontSize: 11, fontWeight: 700,
          lineHeight: 1.4, margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {video.title}
        </p>
      </div>
    </div>
  );
}

// ─── ScrollRow ───────────────────────────────────────────────────────────────

function ScrollRow({
  title,
  videos,
  onPlay,
}: {
  title: string;
  videos: Video[];
  onPlay: (v: ModalVideo) => void;
}) {
  if (videos.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2
        className="px-5 lg:px-0"
        style={{
          color: "#EDE9E1", fontSize: 16, fontWeight: 700, margin: 0,
          fontFamily: "var(--font-assistant), Assistant, sans-serif",
        }}
      >
        {title}
      </h2>
      <div className="binge-scroll-row flex lg:grid lg:grid-cols-4 xl:grid-cols-5 gap-[10px] lg:gap-4 overflow-x-auto lg:overflow-visible pr-5 lg:pr-0 pl-5 lg:pl-0 pb-1 lg:pb-0">
        {videos.map(v => (
          <PosterCard key={v.id} video={v} onPlay={onPlay} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BingePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("הכל");
  const [playing, setPlaying] = useState<ModalVideo | null>(null);

  const showHadar   = activeCategory === "הכל" || activeCategory === "הדר";
  const showClients = activeCategory === "הכל" || activeCategory === "לקוחות";

  return (
    <div
      dir="rtl"
      style={{
        background: "#0D1018",
        minHeight: "100vh",
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
        color: "#EDE9E1",
      }}
    >
      <style>{`
        .binge-scroll-row::-webkit-scrollbar { display: none; }
        .binge-scroll-row { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {playing && <VimeoModal video={playing} onClose={() => setPlaying(null)} />}

      {/* ── Sub-header ─────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 64, zIndex: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 48,
        background: "rgba(13,16,24,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1E2430",
      }}>
        <span style={{
          fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px",
          background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          fontFamily: "var(--font-assistant), Assistant, sans-serif", lineHeight: 1,
        }}>
          בינג׳
        </span>
      </div>

      {/* ── Featured ───────────────────────────────────────────────── */}
      <div
        onClick={() => setPlaying({ id: FEATURED.id, portrait: FEATURED.portrait, title: FEATURED.title })}
        style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "#1D2430", maxHeight: 480, overflow: "hidden", cursor: "pointer" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FEATURED.thumb}
          alt={FEATURED.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom, rgba(13,16,24,0.7), transparent)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 20px 20px", background: "linear-gradient(to top, rgba(8,12,20,1) 0%, rgba(8,12,20,0.85) 60%, transparent 100%)" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <span style={{ background: "rgba(201,150,74,0.18)", border: "1px solid rgba(201,150,74,0.35)", color: "#C9964A", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
              הדר דנן
            </span>
            <span style={{ background: "rgba(201,150,74,0.18)", border: "1px solid rgba(201,150,74,0.35)", color: "#C9964A", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
              סדנה
            </span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "clamp(16px,4vw,22px)", fontWeight: 800, lineHeight: 1.3, color: "#EDE9E1" }}>
            {FEATURED.title}
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9E9990", lineHeight: 1.5 }}>
            {FEATURED.subtitle}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
              color: "#080C14", border: "none", borderRadius: 20,
              padding: "8px 22px", fontSize: 13, fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-assistant), Assistant, sans-serif",
            }}>
              ▶ צפה עכשיו
            </button>
            <span style={{ color: "#6B7080", fontSize: 12 }}>{fmtDur(FEATURED.durationSec)}</span>
          </div>
        </div>
      </div>

      {/* ── Category pills ─────────────────────────────────────────── */}
      <div className="binge-scroll-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingInlineStart: 20, paddingInlineEnd: 20, paddingTop: 16, paddingBottom: 16 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0,
              background: activeCategory === cat ? "linear-gradient(135deg, #E8B94A, #9E7C3A)" : "#1D2430",
              color: activeCategory === cat ? "#080C14" : "#EDE9E1",
              border: activeCategory === cat ? "none" : "1px solid #2C323E",
              borderRadius: 20, padding: "7px 18px", fontSize: 13,
              fontWeight: activeCategory === cat ? 800 : 400,
              cursor: "pointer", fontFamily: "var(--font-assistant), Assistant, sans-serif",
              transition: "all 150ms",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Content rows ───────────────────────────────────────────── */}
      <div className="lg:px-5" style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 48 }}>
        {showHadar && (
          <>
            <ScrollRow title="רילס של הדר"      videos={HADAR_REELS} onPlay={setPlaying} />
            <ScrollRow title="תהליכים מלאים"    videos={HADAR_LONG}  onPlay={setPlaying} />
          </>
        )}
        {showClients && (
          <ScrollRow title="לקוחות מדברים"      videos={CLIENT_VIDEOS} onPlay={setPlaying} />
        )}

        {/* Testimonials carousel */}
        <div className="px-5 lg:px-0">
          <p style={{
            fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "#C9964A", textTransform: "uppercase", marginBottom: 16,
          }}>
            מה אומרים עליה
          </p>
          <WorkshopTestimonials />
        </div>
      </div>
    </div>
  );
}
