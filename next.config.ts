import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Broadcast Room (חדר השידור): the /api/broadcast/* functions spawn a static
  // ffmpeg binary and burn ASS captions with the vendored Assistant font.
  // File tracing can't see execFile targets, so both must be included by hand.
  outputFileTracingIncludes: {
    "/api/broadcast/**": [
      "./node_modules/ffmpeg-static/ffmpeg",
      "./assets/broadcast/fonts/**",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    return [
      // Quiz → kriah cutover (2026-07-04, Alon's approval). 308 preserves the
      // full query string, so live Meta ads keep their UTM attribution. The
      // quiz page code stays in the repo as the rollback path.
      { source: "/quiz", destination: "/kriah", permanent: true },
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
