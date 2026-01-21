console.log("Loading next.config.js for " + process.env.NODE_ENV);

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    basePath: process.env.NODE_ENV === "production" ? "/character_relationship_navigation" : "",
    assetPrefix: process.env.NODE_ENV === "production" ? "/character_relationship_navigation/" : "",
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
