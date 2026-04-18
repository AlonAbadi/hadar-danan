import { getTenant } from "@/lib/tenant";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

const FALLBACK_SITE_NAME  = "BeeGood - הדר דנן";
const FALLBACK_PERSON     = "הדר דנן";
const FALLBACK_DESCRIPTION = "הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal by BeeGood. קורסים, סדנאות וליווי אישי לבעלי עסקים.";
const FALLBACK_SOCIAL: string[] = [
  "https://www.instagram.com/hadar_danan",
  "https://www.tiktok.com/@hadardanann",
  "https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC",
  "https://podcasts.apple.com/il/podcast/id1829722848",
];

export async function SchemaMarkup() {
  let siteName   = FALLBACK_SITE_NAME;
  let personName = FALLBACK_PERSON;
  let description = FALLBACK_DESCRIPTION;
  let socialLinks = FALLBACK_SOCIAL;

  try {
    const tenant  = await getTenant();
    const content = tenant.content ?? {};
    const social  = (content["social"] as Record<string, string> | null) ?? {};

    siteName    = (content["site_name"]   as string) ?? FALLBACK_SITE_NAME;
    personName  = tenant.name             ?? FALLBACK_PERSON;
    description = (content["description"] as string) ?? FALLBACK_DESCRIPTION;

    const links = [
      social["instagram"],
      social["tiktok"],
      social["spotify"],
      social["podcast"],
    ].filter((url): url is string => typeof url === "string" && url.length > 0);

    if (links.length > 0) socialLinks = links;
  } catch (err) {
    console.error("[SchemaMarkup] getTenant() failed, using fallback schema:", err);
  }

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": APP_URL,
    "inLanguage": "he",
  };

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": personName,
    "url": APP_URL,
    "jobTitle": "מומחית שיווק, יוצרת שיטת TrueSignal",
    "description": description,
    "knowsAbout": ["שיווק דיגיטלי", "אסטרטגיה עסקית", "יצירת תוכן", "מיתוג אישי", "TrueSignal"],
    "sameAs": socialLinks,
    "worksFor": {
      "@type": "Organization",
      "name": siteName,
      "url": APP_URL,
    },
  };

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": siteName,
    "url": APP_URL,
    "logo": `${APP_URL}/beegood_logo.png`,
    "description": `${siteName} - שיטת TrueSignal לשיווק אותנטי לעסקים`,
    "founder": { "@type": "Person", "name": personName },
    "sameAs": socialLinks.slice(0, 1),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
    </>
  );
}
