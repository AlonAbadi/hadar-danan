import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

const DISALLOW = ["/admin", "/members", "/my", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Standard crawlers
      { userAgent: "*",               allow: "/", disallow: DISALLOW },
      // AI crawlers — explicitly welcome
      { userAgent: "GPTBot",          allow: "/" },
      { userAgent: "PerplexityBot",   allow: "/" },
      { userAgent: "ClaudeBot",       allow: "/" },
      { userAgent: "anthropic-ai",    allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Bingbot",         allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
