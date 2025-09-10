// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from Amazon (tight allowlist)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      // add more if needed:
      // { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      // { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
    ],

    // OR, if you truly need to allow any remote image (not recommended):
    // remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;

//https://m.media-amazon.com/images/I/61TZvIapKcL._AC_SL1500_.jpg
