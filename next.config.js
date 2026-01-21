/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    basePath: process.env.NODE_ENV === "production" ? "/character_relationship_navigation" : "",
    assetPrefix: process.env.NODE_ENV === "production" ? "/character_relationship_navigation/" : "",
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
