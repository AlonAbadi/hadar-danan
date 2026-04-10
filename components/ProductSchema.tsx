const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

const PROVIDER = {
  "@type": "Organization",
  "name": "BeeGood",
  "url": APP_URL,
};

const INSTRUCTOR = {
  "@type": "Person",
  "name": "הדר דנן",
  "url": APP_URL,
};

type ProductSchemaProps = {
  type:        "Course" | "Service";
  name:        string;
  description: string;
  url:         string;
  price:       number;
  imageUrl?:   string;
};

export function ProductSchema({ type, name, description, url, price, imageUrl }: ProductSchemaProps) {
  const base = {
    "@context":    "https://schema.org",
    "@type":       type,
    "name":        name,
    "description": description,
    "url":         url,
    "inLanguage":  "he",
    "provider":    PROVIDER,
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
    ? { ...base, "instructor": INSTRUCTOR }
    : base;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(withInstructor) }}
    />
  );
}
