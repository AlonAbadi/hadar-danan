const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

type Crumb = { name: string; url: string };

export function BreadcrumbSchema({ crumbs }: { crumbs: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map(({ name, url }, i) => ({
      "@type":    "ListItem",
      "position": i + 1,
      "name":     name,
      "item":     url.startsWith("http") ? url : `${APP_URL}${url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
