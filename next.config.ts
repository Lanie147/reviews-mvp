// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "via.placeholder.com",
      "m.media-amazon.com",
      "images-na.ssl-images-amazon.com",
    ],
    // If you prefer remotePatterns instead, this also works:
    // remotePatterns: [
    //   { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
    //   { protocol: "https", hostname: "m.media-amazon.com", pathname: "/**" },
    //   { protocol: "https", hostname: "images-na.ssl-images-amazon.com", pathname: "/**" },
    // ],
  },
};

export default nextConfig;

//https://m.media-amazon.com/images/I/61TZvIapKcL._AC_SL1500_.jpg
