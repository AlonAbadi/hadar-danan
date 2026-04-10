const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BeeGood - הדר דנן",
  "url": APP_URL,
  "inLanguage": "he",
};

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "הדר דנן",
  "url": APP_URL,
  "jobTitle": "מומחית שיווק, יוצרת שיטת TrueSignal",
  "description": "הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal by BeeGood. קורסים, סדנאות וליווי אישי לבעלי עסקים.",
  "knowsAbout": ["שיווק דיגיטלי", "אסטרטגיה עסקית", "יצירת תוכן", "מיתוג אישי", "TrueSignal"],
  "sameAs": [
    "https://www.instagram.com/hadar_danan",
    "https://www.tiktok.com/@hadardanann",
    "https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC",
    "https://podcasts.apple.com/il/podcast/id1829722848",
  ],
  "worksFor": {
    "@type": "Organization",
    "name": "BeeGood",
    "url": APP_URL,
  },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BeeGood",
  "url": APP_URL,
  "logo": `${APP_URL}/beegood_logo.png`,
  "description": "BeeGood - שיטת TrueSignal לשיווק אותנטי לעסקים",
  "founder": { "@type": "Person", "name": "הדר דנן" },
  "sameAs": ["https://www.instagram.com/hadar_danan"],
};

export function SchemaMarkup() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
    </>
  );
}
