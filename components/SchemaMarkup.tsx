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
  "sameAs": ["https://www.instagram.com/hadar_danan"],
  "worksFor": {
    "@type": "Organization",
    "name": "BeeGood",
    "url": APP_URL,
  },
  "offers": [
    { "@type": "Offer", "name": "אתגר 7 ימים",      "price": "197",   "priceCurrency": "ILS", "url": `${APP_URL}/challenge` },
    { "@type": "Offer", "name": "סדנה יום אחד",      "price": "1080",  "priceCurrency": "ILS", "url": `${APP_URL}/workshop` },
    { "@type": "Offer", "name": "קורס דיגיטלי",      "price": "1800",  "priceCurrency": "ILS", "url": `${APP_URL}/course` },
    { "@type": "Offer", "name": "פגישת אסטרטגיה",    "price": "4000",  "priceCurrency": "ILS", "url": `${APP_URL}/strategy` },
    { "@type": "Offer", "name": "יום צילום פרמיום",  "price": "14000", "priceCurrency": "ILS", "url": `${APP_URL}/premium` },
  ],
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
