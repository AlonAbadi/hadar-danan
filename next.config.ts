import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    return [
      // /sadna was a one-off premium workshop in May 2026. It's not running
      // again. Anyone who finds an old link or screenshot is funneled to
      // the standing monthly workshop instead. 308 = permanent, search
      // engines drop the old URL.
      { source: "/sadna",         destination: "/workshop", permanent: true },
      { source: "/sadna/success", destination: "/workshop", permanent: true },
    ];
  },
};

export default nextConfig;
