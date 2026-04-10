import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/method`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/team`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/quiz`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/training`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/binge`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/challenge`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/workshop`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/course`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/strategy`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/strategy/book`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/premium`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/partnership`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/hive`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/hive/terms`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/privacy`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/terms`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/accessibility`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];
}
