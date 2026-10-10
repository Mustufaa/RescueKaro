import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  async rewrites(){
    const upstream=(process.env.API_INTERNAL_BASE_URL || "http://localhost:8080/api/v1").replace(/\/$/,"");
    return [{source:"/api/v1/:path*",destination:`${upstream}/:path*`}];
  },
};

export default nextConfig;
