import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  async rewrites() {
    const configured = process.env.API_INTERNAL_BASE_URL || "http://localhost:8080/api/v1";
    const base = (configured.includes("://") ? configured
      : /\.onrender\.com(?:\/|$)/i.test(configured) ? `https://${configured}`
      : `http://${configured}`).replace(/\/+$/, "");
    const upstream = base.endsWith("/api/v1") ? base : `${base}/api/v1`;
    return [{ source: "/api/v1/:path*", destination: `${upstream}/:path*` }];
  },
};

export default nextConfig;
