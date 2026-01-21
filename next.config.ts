import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/character_relationship_navigation" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/character_relationship_navigation/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
