import { getTenant } from "@/lib/tenant";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

const FALLBACK_PROVIDER_NAME   = "BeeGood";
const FALLBACK_INSTRUCTOR_NAME = "הדר דנן";

type ProductSchemaProps = {
  type:        "Course" | "Service";
  name:        string;
  description: string;
  url:         string;
  price:       number;
  imageUrl?:   string;
};

export async function ProductSchema({ type, name, description, url, price, imageUrl }: ProductSchemaProps) {
  let providerName   = FALLBACK_PROVIDER_NAME;
  let instructorName = FALLBACK_INSTRUCTOR_NAME;

  try {
    const tenant  = await getTenant();
    const content = tenant.content ?? {};
    providerName   = (content["site_name"] as string) ?? FALLBACK_PROVIDER_NAME;
    instructorName = tenant.name           ?? FALLBACK_INSTRUCTOR_NAME;
  } catch (err) {
    console.error("[ProductSchema] getTenant() failed, using fallback schema:", err);
  }

  const provider = {
    "@type": "Organization",
    "name": providerName,
    "url": APP_URL,
  };

  const instructor = {
    "@type": "Person",
    "name": instructorName,
    "url": APP_URL,
  };

  const base = {
    "@context":    "https://schema.org",
    "@type":       type,
    "name":        name,
    "description": description,
    "url":         url,
    "inLanguage":  "he",
    "provider":    provider,
    "offers": {
      "@type":         "Offer",
      "price":         price,
      "priceCurrency": "ILS",
      "availability":  "https://schema.org/InStock",
      "url":           url,
    },
    ...(imageUrl ? { "image": imageUrl } : {}),
  };

  const withInstructor = type === "Course"
    ? { ...base, "instructor": instructor }
    : base;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(withInstructor) }}
    />
  );
}
