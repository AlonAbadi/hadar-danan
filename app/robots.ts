import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://hadar-danan.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/members", "/my", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
